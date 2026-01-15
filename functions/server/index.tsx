import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase clients
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Auth middleware
const requireAuth = async (c: any, next: any) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !user) {
    console.log('Auth error:', error);
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }

  c.set('user', user);
  c.set('userId', user.id);
  await next();
};

// Role check middleware
const requireRole = (...roles: string[]) => {
  return async (c: any, next: any) => {
    const userId = c.get('userId');
    const profile = await kv.get(`user_profile:${userId}`);
    
    if (!profile || !roles.includes(profile.role)) {
      return c.json({ error: `Forbidden - Requires role: ${roles.join(' or ')}` }, 403);
    }
    
    c.set('profile', profile);
    await next();
  };
};

// ============================================================================
// UTILITIES
// ============================================================================

const XP_RULES = {
  account_created: 50,
  profile_avatar: 100,
  profile_bio: 50,
  profile_games: 50,
  profile_contact: 75,
  social_connect: 150,
  tournament_create: 200,
  tournament_join: 100,
  tournament_complete: 500,
  team_create: 150,
  team_join: 75,
};

const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 3, xp: 250 },
  { level: 4, xp: 500 },
  { level: 5, xp: 1000 },
  { level: 6, xp: 1650 },
  { level: 7, xp: 2500 },
  { level: 8, xp: 3600 },
  { level: 9, xp: 5000 },
  { level: 10, xp: 6800 },
];

const calculateLevel = (totalXp: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i].xp) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 1;
};

const calculateProfileCompletion = (profile: any): number => {
  let completion = 0;
  if (profile.avatar_url) completion += 20;
  if (profile.bio && profile.bio.length > 10) completion += 15;
  if (profile.interested_games && profile.interested_games.length > 0) completion += 15;
  if (profile.contact_info && Object.keys(profile.contact_info).length > 0) completion += 25;
  
  // Check social connections
  const connections = await kv.getByPrefix(`social_connection:${profile.id}:`);
  if (connections && connections.length > 0) completion += 25;
  
  return Math.min(completion, 100);
};

const awardXP = async (userId: string, actionType: string, description: string, metadata = {}) => {
  const xpAmount = XP_RULES[actionType as keyof typeof XP_RULES] || 0;
  if (xpAmount === 0) return null;

  const profile = await kv.get(`user_profile:${userId}`);
  if (!profile) return null;

  // Create XP transaction
  const transaction = {
    id: crypto.randomUUID(),
    user_id: userId,
    action_type: actionType,
    xp_amount: xpAmount,
    description,
    metadata,
    created_at: new Date().toISOString(),
  };
  
  await kv.set(`xp_transaction:${userId}:${transaction.id}`, transaction);

  // Update user profile
  const newTotalXp = (profile.total_xp || 0) + xpAmount;
  const oldLevel = profile.level || 1;
  const newLevel = calculateLevel(newTotalXp);

  profile.total_xp = newTotalXp;
  profile.current_xp = newTotalXp;
  profile.level = newLevel;
  profile.updated_at = new Date().toISOString();

  await kv.set(`user_profile:${userId}`, profile);

  // Check for level up
  if (newLevel > oldLevel) {
    await createNotification(userId, 'level_up', 'Level Up!', `You've reached level ${newLevel}!`, { level: newLevel });
  }

  return { transaction, profile, leveledUp: newLevel > oldLevel };
};

const createNotification = async (userId: string, type: string, title: string, message: string, data = {}) => {
  const notification = {
    id: crypto.randomUUID(),
    user_id: userId,
    type,
    title,
    message,
    data,
    read: false,
    created_at: new Date().toISOString(),
  };

  await kv.set(`notification:${userId}:${notification.id}`, notification);
  return notification;
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get("/make-server-6b1cd74f/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

app.post("/make-server-6b1cd74f/auth/signup", async (c) => {
  try {
    const { email, password, role, display_name } = await c.req.json();

    if (!email || !password || !role || !display_name) {
      return c.json({ error: 'Missing required fields: email, password, role, display_name' }, 400);
    }

    if (!['gamer', 'organizer'].includes(role)) {
      return c.json({ error: 'Invalid role. Must be "gamer" or "organizer"' }, 400);
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since no email server configured
      user_metadata: { role, display_name },
    });

    if (authError || !authData.user) {
      console.log('Signup error:', authError);
      return c.json({ error: authError?.message || 'Failed to create account' }, 400);
    }

    // Create user profile
    const profile = {
      id: authData.user.id,
      role,
      display_name,
      email,
      avatar_url: null,
      level: 1,
      current_xp: 0,
      total_xp: 0,
      profile_completion_percentage: 0,
      interested_games: [],
      contact_info: {},
      bio: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_banned: false,
    };

    await kv.set(`user_profile:${authData.user.id}`, profile);

    // Award XP for account creation
    await awardXP(authData.user.id, 'account_created', 'Account created successfully');

    return c.json({
      success: true,
      data: { user: authData.user, profile },
      message: 'Account created successfully',
    });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Internal server error during signup', details: String(error) }, 500);
  }
});

// ============================================================================
// USER PROFILE ROUTES
// ============================================================================

app.get("/make-server-6b1cd74f/users/me", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const profile = await kv.get(`user_profile:${userId}`);

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Calculate profile completion
    const completion = await calculateProfileCompletion(profile);
    profile.profile_completion_percentage = completion;
    await kv.set(`user_profile:${userId}`, profile);

    return c.json({ success: true, data: profile });
  } catch (error) {
    console.log('Get profile error:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

app.patch("/make-server-6b1cd74f/users/me", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const updates = await c.req.json();
    const profile = await kv.get(`user_profile:${userId}`);

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    // Track what changed for XP awards
    const hadBio = !!profile.bio;
    const hadGames = profile.interested_games && profile.interested_games.length > 0;
    const hadContact = profile.contact_info && Object.keys(profile.contact_info).length > 0;

    // Update allowed fields
    const allowedFields = ['display_name', 'bio', 'interested_games', 'contact_info', 'avatar_url'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        profile[field] = updates[field];
      }
    });

    profile.updated_at = new Date().toISOString();
    await kv.set(`user_profile:${userId}`, profile);

    // Award XP for profile completions
    if (!hadBio && profile.bio && profile.bio.length > 10) {
      await awardXP(userId, 'profile_bio', 'Added bio to profile');
    }
    if (!hadGames && profile.interested_games && profile.interested_games.length > 0) {
      await awardXP(userId, 'profile_games', 'Added interested games');
    }
    if (!hadContact && profile.contact_info && Object.keys(profile.contact_info).length > 0) {
      await awardXP(userId, 'profile_contact', 'Added contact information');
    }

    return c.json({ success: true, data: profile, message: 'Profile updated successfully' });
  } catch (error) {
    console.log('Update profile error:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

app.get("/make-server-6b1cd74f/users/:id", async (c) => {
  try {
    const userId = c.req.param('id');
    const profile = await kv.get(`user_profile:${userId}`);

    if (!profile) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Return public data only
    const publicProfile = {
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      level: profile.level,
      role: profile.role,
      bio: profile.bio,
      interested_games: profile.interested_games,
      created_at: profile.created_at,
    };

    return c.json({ success: true, data: publicProfile });
  } catch (error) {
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// ============================================================================
// GAMIFICATION ROUTES
// ============================================================================

app.get("/make-server-6b1cd74f/gamification/xp", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const transactions = await kv.getByPrefix(`xp_transaction:${userId}:`);
    
    const sorted = (transactions || []).sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({ success: true, data: sorted });
  } catch (error) {
    return c.json({ error: 'Failed to fetch XP history' }, 500);
  }
});

app.get("/make-server-6b1cd74f/gamification/leaderboard", async (c) => {
  try {
    const allProfiles = await kv.getByPrefix('user_profile:');
    
    const leaderboard = (allProfiles || [])
      .filter((p: any) => !p.is_banned)
      .sort((a: any, b: any) => (b.total_xp || 0) - (a.total_xp || 0))
      .slice(0, 100)
      .map((p: any, index: number) => ({
        rank: index + 1,
        id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        level: p.level,
        total_xp: p.total_xp,
        role: p.role,
      }));

    return c.json({ success: true, data: leaderboard });
  } catch (error) {
    return c.json({ error: 'Failed to fetch leaderboard' }, 500);
  }
});

app.get("/make-server-6b1cd74f/gamification/level-progress", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const profile = await kv.get(`user_profile:${userId}`);

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const currentLevel = profile.level || 1;
    const currentXp = profile.total_xp || 0;
    
    const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel);
    const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);

    const progress = {
      currentLevel,
      currentXp,
      currentLevelXp: currentThreshold?.xp || 0,
      nextLevelXp: nextThreshold?.xp || currentXp,
      xpToNextLevel: nextThreshold ? nextThreshold.xp - currentXp : 0,
      percentage: nextThreshold ? ((currentXp - (currentThreshold?.xp || 0)) / (nextThreshold.xp - (currentThreshold?.xp || 0))) * 100 : 100,
    };

    return c.json({ success: true, data: progress });
  } catch (error) {
    return c.json({ error: 'Failed to calculate level progress' }, 500);
  }
});

// ============================================================================
// TOURNAMENT ROUTES
// ============================================================================

app.get("/make-server-6b1cd74f/tournaments", async (c) => {
  try {
    const status = c.req.query('status');
    const game = c.req.query('game');
    const allTournaments = await kv.getByPrefix('tournament:');

    let filtered = allTournaments || [];
    
    if (status) {
      filtered = filtered.filter((t: any) => t.status === status);
    }
    if (game) {
      filtered = filtered.filter((t: any) => t.game.toLowerCase().includes(game.toLowerCase()));
    }

    // Sort by creation date, newest first
    filtered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return c.json({ success: true, data: filtered, count: filtered.length });
  } catch (error) {
    return c.json({ error: 'Failed to fetch tournaments' }, 500);
  }
});

app.post("/make-server-6b1cd74f/tournaments", requireAuth, requireRole('organizer'), async (c) => {
  try {
    const userId = c.get('userId');
    const data = await c.req.json();

    const tournament = {
      id: crypto.randomUUID(),
      organizer_id: userId,
      name: data.name,
      description: data.description || '',
      game: data.game,
      format: data.format || 'single_elimination',
      max_participants: data.max_participants || 16,
      registration_start: data.registration_start || new Date().toISOString(),
      registration_end: data.registration_end,
      tournament_start: data.tournament_start,
      tournament_end: data.tournament_end,
      status: 'draft',
      rules: data.rules || '',
      discord_link: data.discord_link || '',
      prize_pool: data.prize_pool || 0,
      banner_url: data.banner_url || '',
      team_size: data.team_size || 1,
      check_in_required: data.check_in_required || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`tournament:${tournament.id}`, tournament);
    await awardXP(userId, 'tournament_create', `Created tournament: ${tournament.name}`, { tournament_id: tournament.id });

    return c.json({ success: true, data: tournament, message: 'Tournament created successfully' });
  } catch (error) {
    console.log('Create tournament error:', error);
    return c.json({ error: 'Failed to create tournament', details: String(error) }, 500);
  }
});

app.get("/make-server-6b1cd74f/tournaments/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const tournament = await kv.get(`tournament:${id}`);

    if (!tournament) {
      return c.json({ error: 'Tournament not found' }, 404);
    }

    // Get organizer info
    const organizer = await kv.get(`user_profile:${tournament.organizer_id}`);
    tournament.organizer = organizer ? {
      id: organizer.id,
      display_name: organizer.display_name,
      avatar_url: organizer.avatar_url,
    } : null;

    // Get participants
    const participants = await kv.getByPrefix(`tournament_participant:${id}:`);
    tournament.participants = participants || [];
    tournament.current_participants = (participants || []).length;

    return c.json({ success: true, data: tournament });
  } catch (error) {
    return c.json({ error: 'Failed to fetch tournament' }, 500);
  }
});

app.patch("/make-server-6b1cd74f/tournaments/:id", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const tournament = await kv.get(`tournament:${id}`);

    if (!tournament) {
      return c.json({ error: 'Tournament not found' }, 404);
    }

    if (tournament.organizer_id !== userId) {
      return c.json({ error: 'Only the organizer can update this tournament' }, 403);
    }

    const updates = await c.req.json();
    const allowedFields = ['name', 'description', 'rules', 'discord_link', 'prize_pool', 'banner_url', 'registration_end', 'tournament_start', 'tournament_end'];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        tournament[field] = updates[field];
      }
    });

    tournament.updated_at = new Date().toISOString();
    await kv.set(`tournament:${id}`, tournament);

    return c.json({ success: true, data: tournament, message: 'Tournament updated' });
  } catch (error) {
    return c.json({ error: 'Failed to update tournament' }, 500);
  }
});

app.post("/make-server-6b1cd74f/tournaments/:id/publish", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const tournament = await kv.get(`tournament:${id}`);

    if (!tournament) {
      return c.json({ error: 'Tournament not found' }, 404);
    }

    if (tournament.organizer_id !== userId) {
      return c.json({ error: 'Only the organizer can publish this tournament' }, 403);
    }

    tournament.status = 'published';
    tournament.updated_at = new Date().toISOString();
    await kv.set(`tournament:${id}`, tournament);

    return c.json({ success: true, data: tournament, message: 'Tournament published' });
  } catch (error) {
    return c.json({ error: 'Failed to publish tournament' }, 500);
  }
});

app.post("/make-server-6b1cd74f/tournaments/:id/join", requireAuth, requireRole('gamer'), async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const tournament = await kv.get(`tournament:${id}`);

    if (!tournament) {
      return c.json({ error: 'Tournament not found' }, 404);
    }

    if (tournament.status !== 'published') {
      return c.json({ error: 'Tournament registration is not open' }, 400);
    }

    // Check if already joined
    const existing = await kv.get(`tournament_participant:${id}:${userId}`);
    if (existing) {
      return c.json({ error: 'Already registered for this tournament' }, 400);
    }

    // Check max participants
    const participants = await kv.getByPrefix(`tournament_participant:${id}:`);
    if (participants && participants.length >= tournament.max_participants) {
      return c.json({ error: 'Tournament is full' }, 400);
    }

    const participant = {
      id: crypto.randomUUID(),
      tournament_id: id,
      user_id: userId,
      team_id: null,
      status: 'registered',
      placement: null,
      joined_at: new Date().toISOString(),
    };

    await kv.set(`tournament_participant:${id}:${userId}`, participant);
    await awardXP(userId, 'tournament_join', `Joined tournament: ${tournament.name}`, { tournament_id: id });
    await createNotification(userId, 'tournament_start', 'Tournament Registration', `You've successfully registered for ${tournament.name}`, { tournament_id: id });

    return c.json({ success: true, data: participant, message: 'Successfully joined tournament' });
  } catch (error) {
    console.log('Join tournament error:', error);
    return c.json({ error: 'Failed to join tournament', details: String(error) }, 500);
  }
});

// ============================================================================
// TEAM ROUTES
// ============================================================================

app.post("/make-server-6b1cd74f/teams", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const data = await c.req.json();

    const team = {
      id: crypto.randomUUID(),
      name: data.name,
      tag: data.tag || '',
      owner_id: userId,
      logo_url: data.logo_url || '',
      bio: data.bio || '',
      level: 1,
      total_xp: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`team:${team.id}`, team);

    // Add owner as member
    const member = {
      id: crypto.randomUUID(),
      team_id: team.id,
      user_id: userId,
      role: 'owner',
      joined_at: new Date().toISOString(),
    };
    await kv.set(`team_member:${team.id}:${userId}`, member);

    await awardXP(userId, 'team_create', `Created team: ${team.name}`, { team_id: team.id });

    return c.json({ success: true, data: team, message: 'Team created successfully' });
  } catch (error) {
    return c.json({ error: 'Failed to create team' }, 500);
  }
});

app.get("/make-server-6b1cd74f/teams/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const team = await kv.get(`team:${id}`);

    if (!team) {
      return c.json({ error: 'Team not found' }, 404);
    }

    // Get members
    const members = await kv.getByPrefix(`team_member:${id}:`);
    const enrichedMembers = [];

    for (const member of members || []) {
      const profile = await kv.get(`user_profile:${member.user_id}`);
      enrichedMembers.push({
        ...member,
        user: profile ? {
          id: profile.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          level: profile.level,
        } : null,
      });
    }

    team.members = enrichedMembers;

    return c.json({ success: true, data: team });
  } catch (error) {
    return c.json({ error: 'Failed to fetch team' }, 500);
  }
});

// ============================================================================
// NOTIFICATION ROUTES
// ============================================================================

app.get("/make-server-6b1cd74f/notifications", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const notifications = await kv.getByPrefix(`notification:${userId}:`);

    const sorted = (notifications || []).sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({ success: true, data: sorted });
  } catch (error) {
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

app.patch("/make-server-6b1cd74f/notifications/:id/read", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const notification = await kv.get(`notification:${userId}:${id}`);

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    notification.read = true;
    await kv.set(`notification:${userId}:${id}`, notification);

    return c.json({ success: true, data: notification });
  } catch (error) {
    return c.json({ error: 'Failed to mark notification as read' }, 500);
  }
});

// ============================================================================
// ADMIN ROUTES
// ============================================================================

app.get("/make-server-6b1cd74f/admin/users", requireAuth, requireRole('admin'), async (c) => {
  try {
    const users = await kv.getByPrefix('user_profile:');
    return c.json({ success: true, data: users || [], count: (users || []).length });
  } catch (error) {
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

app.patch("/make-server-6b1cd74f/admin/users/:id/ban", requireAuth, requireRole('admin'), async (c) => {
  try {
    const id = c.req.param('id');
    const { banned } = await c.req.json();
    const profile = await kv.get(`user_profile:${id}`);

    if (!profile) {
      return c.json({ error: 'User not found' }, 404);
    }

    profile.is_banned = banned;
    profile.updated_at = new Date().toISOString();
    await kv.set(`user_profile:${id}`, profile);

    return c.json({ success: true, data: profile, message: `User ${banned ? 'banned' : 'unbanned'}` });
  } catch (error) {
    return c.json({ error: 'Failed to update user ban status' }, 500);
  }
});

// ============================================================================
// START SERVER
// ============================================================================

Deno.serve(app.fetch);
