import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import type { UserProfile } from '@/types';
import { Toaster, toast } from 'sonner';
import { User, Trophy, Users, Settings, LogOut, Zap, Bell, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import redLogo from 'figma:asset/534b6c17c8a311d2e71cab639ef43dc0b2df1338.png';
import brandingImage from 'figma:asset/90e6df578228f3bbde5bcd97a659a6f88ad188c0.png';

// ============================================================================
// AUTH CONTEXT
// ============================================================================

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile();
        localStorage.setItem('sb-access-token', session.access_token);
      } else {
        setProfile(null);
        localStorage.removeItem('sb-access-token');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      localStorage.setItem('sb-access-token', session.access_token);
      await loadProfile();
    }
    setLoading(false);
  };

  const loadProfile = async () => {
    const response = await api.getMyProfile();
    if (response.success && response.data) {
      setProfile(response.data);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session) {
      localStorage.setItem('sb-access-token', data.session.access_token);
      await loadProfile();
    }
  };

  const signUp = async (email: string, password: string, role: string, displayName: string) => {
    const response = await api.signup(email, password, role, displayName);
    if (!response.success) {
      throw new Error(response.error || 'Signup failed');
    }
    // Auto sign in
    await signIn(email, password);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    localStorage.removeItem('sb-access-token');
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// LANDING PAGE
// ============================================================================

function LandingPage({ onShowAuth }: { onShowAuth: (mode: 'signin' | 'signup') => void }) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#EF4444]/20 via-black to-black" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="flex flex-col items-center text-center space-y-8">
            <img src={redLogo} alt="HERU" className="w-64 h-auto" />
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Step Into The Arena
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl">
              The premier esports tournament platform. Create, compete, and conquer.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => onShowAuth('signup')} size="lg" className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-8">
                Get Started
              </Button>
              <Button onClick={() => onShowAuth('signin')} size="lg" variant="outline" className="border-zinc-700 text-white">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <Trophy className="w-12 h-12 text-[#EF4444] mb-4" />
              <CardTitle>Tournament Management</CardTitle>
              <CardDescription>Create and manage professional esports tournaments</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <Zap className="w-12 h-12 text-[#00ff88] mb-4" />
              <CardTitle>Gamification System</CardTitle>
              <CardDescription>Earn XP, level up, and climb the leaderboards</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <Users className="w-12 h-12 text-[#3B82F6] mb-4" />
              <CardTitle>Team Building</CardTitle>
              <CardDescription>Form teams and compete together</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AUTH MODAL
// ============================================================================

function AuthModal({ mode, onClose, onSuccess }: { mode: 'signin' | 'signup'; onClose: () => void; onSuccess: () => void }) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'gamer' | 'organizer'>('gamer');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        toast.success('Welcome back!');
      } else {
        await signUp(email, password, role, displayName);
        toast.success('Account created! Welcome to HERU.gg');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</DialogTitle>
          <DialogDescription>
            {mode === 'signin' ? 'Sign in to your HERU account' : 'Join the ultimate esports platform'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <Label>Display Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your gaming name"
                  required
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label>I am a...</Label>
                <Select value={role} onValueChange={(v: 'gamer' | 'organizer') => setRole(v)}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectItem value="gamer">Gamer (Compete in tournaments)</SelectItem>
                    <SelectItem value="organizer">Organizer (Create tournaments)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#EF4444] hover:bg-[#DC2626]">
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// DASHBOARD
// ============================================================================

function Dashboard() {
  const { profile, signOut, refreshProfile } = useAuth();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [levelProgress, setLevelProgress] = useState<any>(null);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    const [tournamentsRes, leaderboardRes, notificationsRes, progressRes] = await Promise.all([
      api.getTournaments({ status: 'published' }),
      api.getLeaderboard(),
      api.getNotifications(),
      api.getLevelProgress(),
    ]);

    if (tournamentsRes.success) setTournaments(tournamentsRes.data || []);
    if (leaderboardRes.success) setLeaderboard(leaderboardRes.data || []);
    if (notificationsRes.success) setNotifications(notificationsRes.data || []);
    if (progressRes.success) setLevelProgress(progressRes.data);
    setLoading(false);
  };

  const handleJoinTournament = async (tournamentId: string) => {
    const response = await api.joinTournament(tournamentId);
    if (response.success) {
      toast.success('Successfully joined tournament!');
      await loadDashboardData();
      await refreshProfile();
    } else {
      toast.error(response.error || 'Failed to join tournament');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={redLogo} alt="HERU" className="h-8" />
              <Badge variant="outline" className="border-[#EF4444] text-[#EF4444]">
                Level {profile?.level || 1}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-[#00ff88]" />
                <span>{profile?.total_xp.toLocaleString()} XP</span>
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
          {/* XP Progress Bar */}
          {levelProgress && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Level {levelProgress.currentLevel}</span>
                <span>{levelProgress.currentXp.toLocaleString()} / {levelProgress.nextLevelXp.toLocaleString()} XP</span>
              </div>
              <Progress 
                value={Math.min(levelProgress.percentage, 100)} 
                className="h-1.5 bg-zinc-800"
              />
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Card */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#EF4444] to-[#00ff88] flex items-center justify-center text-2xl font-bold">
                      {profile?.display_name[0]}
                    </div>
                    <div>
                      <CardTitle>{profile?.display_name}</CardTitle>
                      <CardDescription className="capitalize">{profile?.role}</CardDescription>
                    </div>
                  </div>
                  <Badge className={`${profile?.role === 'organizer' ? 'bg-[#3B82F6]' : 'bg-[#00ff88]'} text-black`}>
                    {profile?.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-[#EF4444]">{profile?.level}</div>
                    <div className="text-xs text-zinc-400">Level</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#00ff88]">{profile?.total_xp.toLocaleString()}</div>
                    <div className="text-xs text-zinc-400">Total XP</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#3B82F6]">{profile?.profile_completion_percentage}%</div>
                    <div className="text-xs text-zinc-400">Profile</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tournaments */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Active Tournaments</CardTitle>
                  {profile?.role === 'organizer' && (
                    <Button onClick={() => setShowCreateTournament(true)} size="sm" className="bg-[#EF4444] hover:bg-[#DC2626]">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Tournament
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tournaments.slice(0, 5).map((tournament) => (
                    <div key={tournament.id} className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-[#EF4444] transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-white mb-1">{tournament.name}</h3>
                          <p className="text-sm text-zinc-400 mb-2">{tournament.game}</p>
                          <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {tournament.current_participants || 0}/{tournament.max_participants}
                            </span>
                            <span className="flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-[#EF4444]" />
                              ${tournament.prize_pool.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {profile?.role === 'gamer' && (
                          <Button onClick={() => handleJoinTournament(tournament.id)} size="sm" className="bg-[#EF4444] hover:bg-[#DC2626]">
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {tournaments.length === 0 && (
                    <div className="text-center py-8 text-zinc-500">
                      No active tournaments yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm">Leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {leaderboard.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${entry.rank <= 3 ? 'bg-[#EF4444]' : 'bg-zinc-800'}`}>
                      {entry.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{entry.display_name}</div>
                      <div className="text-xs text-zinc-500">Level {entry.level}</div>
                    </div>
                    <div className="text-xs text-[#00ff88]">{entry.total_xp.toLocaleString()}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm">Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.slice(0, 5).map((notif) => (
                  <div key={notif.id} className={`p-3 rounded ${notif.read ? 'bg-zinc-800/50' : 'bg-zinc-800'} border border-zinc-700`}>
                    <div className="text-sm font-medium">{notif.title}</div>
                    <div className="text-xs text-zinc-400 mt-1">{notif.message}</div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-sm text-zinc-500 text-center py-4">
                    No notifications
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Tournament Modal */}
      {showCreateTournament && <CreateTournamentModal onClose={() => setShowCreateTournament(false)} onSuccess={() => { setShowCreateTournament(false); loadDashboardData(); }} />}
    </div>
  );
}

// ============================================================================
// CREATE TOURNAMENT MODAL
// ============================================================================

function CreateTournamentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [game, setGame] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('16');
  const [prizePool, setPrizePool] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.createTournament({
        name,
        game,
        description,
        max_participants: parseInt(maxParticipants),
        prize_pool: prizePool ? parseFloat(prizePool) : 0,
        tournament_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        registration_end: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (response.success) {
        // Auto publish
        await api.publishTournament(response.data.id);
        toast.success('Tournament created and published!');
        onSuccess();
      } else {
        toast.error(response.error || 'Failed to create tournament');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Tournament</DialogTitle>
          <DialogDescription>Fill in the tournament details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Tournament Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Spring Championship 2026"
                required
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div>
              <Label>Game *</Label>
              <Input
                value={game}
                onChange={(e) => setGame(e.target.value)}
                placeholder="Valorant, League of Legends, etc."
                required
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tournament details and information..."
              className="bg-zinc-800 border-zinc-700 text-white"
              rows={3}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Max Participants *</Label>
              <Select value={maxParticipants} onValueChange={setMaxParticipants}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectItem value="8">8 Players</SelectItem>
                  <SelectItem value="16">16 Players</SelectItem>
                  <SelectItem value="32">32 Players</SelectItem>
                  <SelectItem value="64">64 Players</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prize Pool (USD)</Label>
              <Input
                type="number"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                placeholder="1000"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-zinc-700">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-[#EF4444] hover:bg-[#DC2626]">
              {loading ? 'Creating...' : 'Create & Publish Tournament'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null);

  return (
    <AuthProvider>
      <AppContent authMode={authMode} setAuthMode={setAuthMode} />
      <Toaster position="top-right" theme="dark" />
    </AuthProvider>
  );
}

function AppContent({ authMode, setAuthMode }: { authMode: 'signin' | 'signup' | null; setAuthMode: (mode: 'signin' | 'signup' | null) => void }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading HERU.gg...</div>
      </div>
    );
  }

  return (
    <>
      {!user ? (
        <>
          <LandingPage onShowAuth={(mode) => setAuthMode(mode)} />
          {authMode && (
            <AuthModal
              mode={authMode}
              onClose={() => setAuthMode(null)}
              onSuccess={() => setAuthMode(null)}
            />
          )}
        </>
      ) : (
        <Dashboard />
      )}
    </>
  );
}
