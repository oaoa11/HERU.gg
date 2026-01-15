# HERU.gg - Complete Esports Platform Architecture

## Executive Summary
Production-ready MVP for tournament-centric esports platform with full gamification, authentication, and real-time features.

---

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: TailwindCSS v4 (Black primary, Red #EF4444 secondary, Neon accents)
- **State Management**: React Context + Hooks
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Radix UI + Shadcn
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion)
- **Real-time**: Supabase Realtime subscriptions

### Backend
- **Runtime**: Deno via Supabase Edge Functions
- **Framework**: Hono (lightweight, fast HTTP server)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (email/password + OAuth: Discord, Twitch, Steam)
- **Storage**: Supabase Storage (tournament assets, avatars)
- **API**: REST with full validation

### Data Layer
- **ORM**: Direct Supabase client queries
- **Caching**: Redis-like via Supabase KV store
- **Real-time**: PostgreSQL real-time subscriptions

---

## Database Schema

### Core Tables

#### users (Supabase Auth managed)
- Managed by Supabase Auth system
- Extended with user_metadata

#### user_profiles
```sql
- id (UUID, PK, FK to auth.users)
- role (ENUM: 'gamer', 'organizer', 'admin')
- display_name (VARCHAR)
- avatar_url (TEXT)
- level (INTEGER DEFAULT 1)
- current_xp (INTEGER DEFAULT 0)
- total_xp (INTEGER DEFAULT 0)
- profile_completion_percentage (INTEGER DEFAULT 0)
- interested_games (TEXT[])
- contact_info (JSONB)
- bio (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- is_banned (BOOLEAN DEFAULT FALSE)
```

#### social_connections
```sql
- id (UUID, PK)
- user_id (UUID, FK to user_profiles)
- provider (ENUM: 'discord', 'twitch', 'steam')
- provider_id (VARCHAR)
- provider_username (VARCHAR)
- connected_at (TIMESTAMP)
- UNIQUE(user_id, provider)
```

#### xp_transactions
```sql
- id (UUID, PK)
- user_id (UUID, FK to user_profiles)
- action_type (ENUM: 'profile_complete', 'social_connect', 'tournament_join', 'tournament_create', 'tournament_complete', 'team_create', 'team_join')
- xp_amount (INTEGER)
- description (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)
```

#### xp_rules
```sql
- id (UUID, PK)
- action_type (VARCHAR, UNIQUE)
- xp_value (INTEGER)
- repeatable (BOOLEAN)
- description (TEXT)
```

#### level_thresholds
```sql
- level (INTEGER, PK)
- xp_required (INTEGER)
```

#### tournaments
```sql
- id (UUID, PK)
- organizer_id (UUID, FK to user_profiles)
- name (VARCHAR NOT NULL)
- description (TEXT)
- game (VARCHAR NOT NULL)
- format (ENUM: 'single_elimination', 'double_elimination', 'round_robin')
- max_participants (INTEGER)
- registration_start (TIMESTAMP)
- registration_end (TIMESTAMP)
- tournament_start (TIMESTAMP)
- tournament_end (TIMESTAMP)
- status (ENUM: 'draft', 'published', 'registration_closed', 'live', 'completed', 'cancelled')
- rules (TEXT)
- discord_link (VARCHAR)
- prize_pool (DECIMAL)
- banner_url (TEXT)
- team_size (INTEGER DEFAULT 1)
- check_in_required (BOOLEAN DEFAULT FALSE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### tournament_participants
```sql
- id (UUID, PK)
- tournament_id (UUID, FK to tournaments)
- user_id (UUID, FK to user_profiles, NULL if team)
- team_id (UUID, FK to teams, NULL if individual)
- status (ENUM: 'registered', 'checked_in', 'disqualified', 'withdrawn')
- placement (INTEGER)
- joined_at (TIMESTAMP)
- UNIQUE(tournament_id, user_id) OR UNIQUE(tournament_id, team_id)
```

#### teams
```sql
- id (UUID, PK)
- name (VARCHAR NOT NULL)
- tag (VARCHAR)
- owner_id (UUID, FK to user_profiles)
- logo_url (TEXT)
- bio (TEXT)
- level (INTEGER DEFAULT 1)
- total_xp (INTEGER DEFAULT 0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### team_members
```sql
- id (UUID, PK)
- team_id (UUID, FK to teams)
- user_id (UUID, FK to user_profiles)
- role (ENUM: 'owner', 'captain', 'member')
- joined_at (TIMESTAMP)
- UNIQUE(team_id, user_id)
```

#### matches
```sql
- id (UUID, PK)
- tournament_id (UUID, FK to tournaments)
- round (INTEGER)
- match_number (INTEGER)
- participant_1_id (UUID, FK to tournament_participants)
- participant_2_id (UUID, FK to tournament_participants)
- winner_id (UUID, FK to tournament_participants)
- score (JSONB)
- scheduled_time (TIMESTAMP)
- status (ENUM: 'pending', 'in_progress', 'completed')
- created_at (TIMESTAMP)
```

#### notifications
```sql
- id (UUID, PK)
- user_id (UUID, FK to user_profiles)
- type (ENUM: 'tournament_start', 'registration_closing', 'match_start', 'xp_earned', 'level_up', 'team_invite')
- title (VARCHAR)
- message (TEXT)
- data (JSONB)
- read (BOOLEAN DEFAULT FALSE)
- created_at (TIMESTAMP)
```

#### audit_logs
```sql
- id (UUID, PK)
- user_id (UUID, FK to user_profiles)
- action (VARCHAR)
- entity_type (VARCHAR)
- entity_id (UUID)
- changes (JSONB)
- ip_address (INET)
- created_at (TIMESTAMP)
```

---

## API Endpoints

### Authentication (`/make-server-6b1cd74f/auth/*`)
- `POST /signup` - Create account with role selection
- `POST /login` - Email/password login
- `GET /session` - Get current session
- `POST /logout` - End session
- `GET /oauth/:provider` - Social login initiation

### User Profiles (`/make-server-6b1cd74f/users/*`)
- `GET /me` - Current user profile
- `PATCH /me` - Update profile
- `POST /me/avatar` - Upload avatar
- `GET /:id` - Get user profile (public data)
- `GET /:id/stats` - Get user statistics

### Gamification (`/make-server-6b1cd74f/gamification/*`)
- `GET /xp` - Get XP transactions history
- `POST /xp/award` - Award XP (protected)
- `GET /leaderboard` - Global leaderboard
- `GET /level-progress` - Current level progress

### Tournaments (`/make-server-6b1cd74f/tournaments/*`)
- `GET /` - List tournaments (with filters)
- `POST /` - Create tournament (organizer only)
- `GET /:id` - Get tournament details
- `PATCH /:id` - Update tournament (owner only)
- `DELETE /:id` - Cancel tournament (owner only)
- `POST /:id/publish` - Publish tournament
- `POST /:id/join` - Join tournament (gamer)
- `DELETE /:id/participants/:userId` - Remove participant (owner)
- `POST /:id/brackets/generate` - Generate brackets (owner)
- `PATCH /:id/matches/:matchId` - Update match result (owner)

### Teams (`/make-server-6b1cd74f/teams/*`)
- `GET /` - List teams
- `POST /` - Create team
- `GET /:id` - Get team details
- `PATCH /:id` - Update team (owner only)
- `POST /:id/members` - Invite member (captain/owner)
- `DELETE /:id/members/:userId` - Remove member
- `POST /:id/leave` - Leave team

### Notifications (`/make-server-6b1cd74f/notifications/*`)
- `GET /` - List notifications
- `PATCH /:id/read` - Mark as read
- `PATCH /read-all` - Mark all as read
- `DELETE /:id` - Delete notification

### Admin (`/make-server-6b1cd74f/admin/*`)
- `GET /users` - List all users (admin only)
- `PATCH /users/:id/role` - Change user role
- `PATCH /users/:id/ban` - Ban/unban user
- `GET /tournaments` - All tournaments
- `PATCH /tournaments/:id/cancel` - Cancel any tournament

---

## Gamification Engine Logic

### XP Calculation
1. Action triggered (e.g., profile update, tournament join)
2. Check if action is repeatable
3. Query xp_rules for XP value
4. Create xp_transaction record
5. Update user current_xp and total_xp
6. Check if level threshold crossed
7. If leveled up, create level_up notification
8. Return updated profile with new level/XP

### Level System
- Level 1: 0 XP
- Level 2: 100 XP
- Level 3: 250 XP
- Level 4: 500 XP
- Level 5: 1000 XP
- Formula: `xp_required = previous + (level * 150)`

### Profile Completion
Calculated based on:
- Avatar uploaded (20%)
- Bio filled (15%)
- Interested games selected (15%)
- At least 1 social connection (25%)
- Contact info added (25%)

---

## Authentication Flow

### Email/Password Registration
1. User submits email, password, role
2. Backend calls `supabase.auth.admin.createUser()`
3. Set `email_confirm: true` (no email server configured)
4. Create user_profile entry with role
5. Award "account_created" XP
6. Return success + auto-login

### Social Login (Discord/Twitch/Steam)
1. User clicks provider button
2. Frontend calls `supabase.auth.signInWithOAuth({ provider })`
3. User redirects to provider auth
4. On callback, create/update user_profile
5. Create social_connection entry
6. Award "social_connect" XP if new
7. Redirect to dashboard

### Session Management
- Access tokens stored in localStorage
- Refresh tokens handled by Supabase
- Protected routes check `supabase.auth.getSession()`
- Server endpoints verify token with `supabase.auth.getUser(accessToken)`

---

## Real-time Features

### Subscriptions
1. **Tournament Updates**
   ```typescript
   supabase
     .channel(`tournament:${id}`)
     .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${id}` }, handler)
     .subscribe()
   ```

2. **Match Updates**
   - Subscribe to bracket changes during live tournaments

3. **Notifications**
   - Real-time notification badge updates

---

## Security Considerations

### Row Level Security (RLS)
While not directly configurable in Figma Make, the API implements:
- User can only update own profile
- Organizers can only modify their tournaments
- Admins have elevated permissions
- Soft deletes for audit trail

### Input Validation
- Zod schemas on all API endpoints
- Sanitize user-generated content
- Rate limiting via Supabase KV store
- CORS properly configured

### Data Privacy
- No PII in logs
- Passwords never exposed
- Access tokens in Authorization headers only
- Sensitive data encrypted at rest (Supabase default)

---

## Frontend Architecture

### Component Structure
```
src/
├── app/
│   ├── App.tsx                  # Main router
│   ├── components/
│   │   ├── auth/                # Login, Register, RoleSelect
│   │   ├── dashboard/           # Gamer, Organizer, Admin dashboards
│   │   ├── tournaments/         # List, Detail, Builder, Bracket
│   │   ├── teams/               # List, Detail, Create
│   │   ├── profile/             # Profile view/edit
│   │   ├── gamification/        # XP Bar, Level Badge, Leaderboard
│   │   ├── notifications/       # NotificationBell, NotificationList
│   │   ├── shared/              # Navbar, Footer, Layout
│   │   └── ui/                  # Shadcn components
├── hooks/
│   ├── useAuth.ts              # Authentication hook
│   ├── useXP.ts                # Gamification hook
│   ├── useTournaments.ts       # Tournament data
│   └── useNotifications.ts     # Notifications
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── api.ts                  # API client
│   └── utils.ts                # Helpers
└── types/
    ├── user.ts
    ├── tournament.ts
    ├── team.ts
    └── gamification.ts
```

### State Management
- **Auth Context**: User session, profile, role
- **Notification Context**: Unread count, real-time updates
- **React Query**: Server state caching (optional, using useState for MVP)

---

## Deployment Checklist

### Supabase Setup
1. Create project
2. Enable Auth providers (Discord, Twitch, Steam)
3. Create database tables via SQL editor
4. Set up storage buckets:
   - `make-6b1cd74f-avatars` (private)
   - `make-6b1cd74f-tournament-banners` (public)
5. Deploy Edge Function

### Environment Variables
Required in Supabase Edge Function:
- `SUPABASE_URL` (auto-provided)
- `SUPABASE_ANON_KEY` (auto-provided)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-provided)

### Social Login Setup
**CRITICAL**: User must configure OAuth providers:
- Discord: https://supabase.com/docs/guides/auth/social-login/auth-discord
- Twitch: https://supabase.com/docs/guides/auth/social-login/auth-twitch  
- Steam: OpenID (custom implementation required)

---

## Performance Optimizations

### Frontend
- Code splitting by route
- Image optimization (WebP, lazy loading)
- Debounced search/filters
- Virtual scrolling for large lists

### Backend
- Database indexes on foreign keys
- Query result pagination
- Cached leaderboard (1-minute TTL)
- Connection pooling (Supabase default)

### Real-time
- Unsubscribe on component unmount
- Batch notification updates
- Throttled presence updates

---

## Monitoring & Logging

### Logs
- All API errors logged to console
- Audit trail for critical actions
- XP transaction history

### Metrics
- User registration count
- Tournament creation rate
- Active tournaments
- Average XP per user

---

## Future Enhancements (Post-MVP)

1. **Bracket Automation**: Auto-advance winners
2. **Live Streaming**: Integrated Twitch embeds
3. **Chat System**: Tournament/team chat
4. **Advanced Analytics**: Player/organizer stats
5. **Mobile App**: React Native
6. **Achievements**: Badge system beyond XP
7. **Monetization**: Premium features for organizers
8. **Dispute System**: Match result challenges
9. **Email Notifications**: Tournament reminders
10. **Webhooks**: Third-party integrations

---

## API Response Examples

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Unauthorized access",
  "code": "AUTH_REQUIRED",
  "details": { ... }
}
```

---

**Built with precision, deployed with confidence. HERU.gg - Step Into The Arena.**
