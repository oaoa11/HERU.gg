// User Types
export type UserRole = 'gamer' | 'organizer' | 'admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  display_name: string;
  email?: string;
  avatar_url: string | null;
  level: number;
  current_xp: number;
  total_xp: number;
  profile_completion_percentage: number;
  interested_games: string[];
  contact_info: Record<string, any>;
  bio: string | null;
  created_at: string;
  updated_at: string;
  is_banned: boolean;
}

export interface SocialConnection {
  id: string;
  user_id: string;
  provider: 'discord' | 'twitch' | 'steam';
  provider_id: string;
  provider_username: string;
  connected_at: string;
}

// Gamification Types
export interface XPTransaction {
  id: string;
  user_id: string;
  action_type: string;
  xp_amount: number;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface LevelProgress {
  currentLevel: number;
  currentXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpToNextLevel: number;
  percentage: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  role: UserRole;
}

// Tournament Types
export type TournamentStatus = 'draft' | 'published' | 'registration_closed' | 'live' | 'completed' | 'cancelled';
export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'round_robin';

export interface Tournament {
  id: string;
  organizer_id: string;
  name: string;
  description: string;
  game: string;
  format: TournamentFormat;
  max_participants: number;
  current_participants?: number;
  registration_start: string;
  registration_end: string;
  tournament_start: string;
  tournament_end: string;
  status: TournamentStatus;
  rules: string;
  discord_link: string;
  prize_pool: number;
  banner_url: string;
  team_size: number;
  check_in_required: boolean;
  created_at: string;
  updated_at: string;
  organizer?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  participants?: TournamentParticipant[];
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string | null;
  team_id: string | null;
  status: 'registered' | 'checked_in' | 'disqualified' | 'withdrawn';
  placement: number | null;
  joined_at: string;
}

// Team Types
export interface Team {
  id: string;
  name: string;
  tag: string;
  owner_id: string;
  logo_url: string;
  bio: string;
  level: number;
  total_xp: number;
  created_at: string;
  updated_at: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'captain' | 'member';
  joined_at: string;
  user?: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    level: number;
  };
}

// Notification Types
export type NotificationType = 'tournament_start' | 'registration_closing' | 'match_start' | 'xp_earned' | 'level_up' | 'team_invite';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}
