# HERU.gg - Complete Esports Tournament Platform MVP

![HERU.gg](https://img.shields.io/badge/Version-1.0.0-red.svg)
![Platform](https://img.shields.io/badge/Platform-Esports-00ff88.svg)
![Tech](https://img.shields.io/badge/Tech-React%20%2B%20Supabase-blue.svg)

## 🎮 Overview

**HERU.gg** is a production-ready, full-stack esports tournament platform that connects gamers and tournament organizers. Built with modern web technologies, it features comprehensive gamification, real-time updates, and a sleek dark-theme UI optimized for the gaming community.

### ✨ Key Highlights

- **🏆 Tournament Management:** Complete lifecycle from draft to completion
- **⚡ Gamification Engine:** XP, levels, achievements, and leaderboards
- **🔐 Multi-Auth:** Email/password + OAuth (Discord, Twitch, Steam)
- **👥 Team System:** Create teams, manage rosters, earn team XP
- **📢 Real-time Notifications:** Live updates for all platform events
- **📊 Admin Dashboard:** Full user and tournament management
- **🎨 Brand-Consistent Design:** Dark theme with your HERU branding

---

## 📚 Table of Contents

1. [Features](#-features)
2. [Tech Stack](#-tech-stack)
3. [Architecture](#-architecture)
4. [Getting Started](#-getting-started)
5. [User Roles](#-user-roles)
6. [API Documentation](#-api-documentation)
7. [Database Schema](#-database-schema)
8. [Deployment](#-deployment)
9. [Contributing](#-contributing)

---

## 🚀 Features

### Authentication & User Management

- **Multiple Sign-in Methods:**
  - Email/password (Supabase Auth with auto email confirmation)
  - Discord OAuth
  - Twitch OAuth
  - Steam OpenID (custom implementation)

- **Role-Based Access:**
  - **Gamer:** Join tournaments, create/join teams, earn XP
  - **Organizer:** Create and manage tournaments, view analytics
  - **Admin:** Full platform control, user management, moderation

- **Profile System:**
  - Avatar upload
  - Bio and contact information
  - Interested games selection
  - Profile completion percentage tracker
  - Social account connections

### Gamification System (COMPLETE)

- **XP Earning Actions:**
  - Account creation: +50 XP
  - Profile completion (avatar, bio, games, contact): +260 XP total
  - Social connections (Discord, Twitch, Steam): +150 XP each
  - Tournament creation: +200 XP
  - Tournament joining: +100 XP
  - Tournament completion: +500 XP
  - Team creation: +150 XP
  - Team joining: +75 XP

- **Level System:**
  - 10 levels with progressive XP requirements
  - Visual level badges everywhere
  - Real-time XP progress bars
  - Level-up notifications with animations

- **Leaderboard:**
  - Global rankings by total XP
  - Real-time updates
  - Filter by role (gamer/organizer)
  - Top 100 displayed

### Tournament Features

**For Organizers:**
- **Multi-Step Tournament Builder:**
  - Basic info (name, game, description)
  - Tournament format (single/double elimination, round-robin)
  - Schedule configuration
  - Prize pool setup
  - Discord server integration
  - Custom rules and eligibility

- **Tournament Lifecycle Management:**
  - Draft → Published → Registration Closed → Live → Completed → Cancelled
  - Participant management (view, remove)
  - Registration lock controls
  - Manual bracket management
  - Winner declaration

- **Analytics Dashboard:**
  - Participant count tracking
  - Tournament performance metrics
  - Created tournaments history

**For Gamers:**
- **Tournament Discovery:**
  - Browse all published tournaments
  - Filter by game, status, date
  - Search functionality
  - Detailed tournament pages

- **Registration & Participation:**
  - One-click tournament joining
  - Eligibility confirmation
  - Team-based registration (if applicable)
  - Check-in system (optional)
  - Discord link access

- **Bracket Viewing:**
  - Live bracket updates
  - Match results
  - Tournament standings
  - Prize distribution

### Team System

- **Team Management:**
  - Create teams with custom names and tags
  - Team logo upload
  - Team bio and information
  - Role-based member system (Owner, Captain, Member)

- **Team Gamification:**
  - Separate team XP and levels
  - Team achievements
  - Team leaderboards

- **Team Roster:**
  - Invite players to join
  - Remove members (Owner/Captain only)
  - View member profiles and stats

### Notification System

**In-App Notifications for:**
- Tournament start reminders
- Registration closing alerts
- Match start notifications
- XP earned confirmations
- Level-up celebrations
- Team invitations
- Tournament result announcements

**Features:**
- Unread notification badge
- Mark as read functionality
- Notification history
- Click-through to relevant pages

### Admin Panel

**User Management:**
- View all registered users
- Search and filter users
- Change user roles (gamer ↔ organizer ↔ admin)
- Ban/unban users
- View user statistics and activity

**Tournament Oversight:**
- View all tournaments (any status)
- Cancel any tournament
- Manual result override
- Award custom XP/badges

**Platform Analytics:**
- Total user count
- Active tournament count
- Platform engagement metrics
- Growth charts

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Styling:** TailwindCSS v4 (Black + Red #EF4444 theme)
- **UI Components:** Radix UI + Shadcn
- **Form Handling:** React Hook Form + Zod validation
- **State Management:** React Context API + Hooks
- **Icons:** Lucide React
- **Animations:** Motion (Framer Motion)
- **Notifications:** Sonner (toast notifications)

### Backend
- **Runtime:** Deno (via Supabase Edge Functions)
- **Framework:** Hono (lightweight HTTP server)
- **Database:** PostgreSQL (Supabase)
- **ORM:** Direct Supabase client (no ORM for flexibility)
- **Storage:** Supabase KV Store (key-value for rapid prototyping)
- **Authentication:** Supabase Auth

### Infrastructure
- **Hosting:** Supabase (Edge Functions + Database)
- **Storage:** Supabase Storage (avatars, tournament banners)
- **Real-time:** Supabase Realtime (WebSocket subscriptions)
- **CDN:** Supabase Storage CDN

---

## 🏗 Architecture

### System Design

```
┌─────────────────┐
│   Frontend      │
│   React + TS    │
│   Tailwind CSS  │
└────────┬────────┘
         │ HTTPS/REST
         │ WebSocket (Real-time)
         ▼
┌─────────────────┐
│  Supabase       │
│  Edge Functions │──────────┐
│  (Hono Server)  │          │
└────────┬────────┘          │
         │                   │
    ┌────▼────┐         ┌────▼────┐
    │  Auth   │         │   KV    │
    │ Service │         │  Store  │
    └─────────┘         └─────────┘
         │                   │
         └───────┬───────────┘
                 ▼
         ┌───────────────┐
         │  PostgreSQL   │
         │   Database    │
         └───────────────┘
```

### Data Flow

1. **Authentication:** User signs in → Supabase Auth → Access token stored → API calls include token
2. **Profile Loading:** Frontend requests `/users/me` → Backend fetches from KV → Returns profile data
3. **XP Award:** User completes action → Backend checks rules → Creates XP transaction → Updates profile → Sends notification
4. **Tournament Join:** Gamer clicks "Join" → Backend validates eligibility → Creates participant record → Awards XP → Sends notification

---

## 🏁 Getting Started

### Prerequisites
- Supabase account (free tier works)
- Node.js 18+ (for local development)
- Basic understanding of React and REST APIs

### Installation

See **[SETUP.md](./SETUP.md)** for detailed setup instructions.

**Quick Start:**

1. **Clone the project**
   ```bash
   # Project is already set up in Figma Make
   ```

2. **Create Supabase project**
   - Go to https://supabase.com
   - Create new project
   - Note your project URL and keys

3. **Run database migrations**
   - Copy SQL from `SETUP.md`
   - Run in Supabase SQL Editor

4. **Deploy Edge Function**
   - Code is in `/supabase/functions/server/index.tsx`
   - Deploy via Supabase Dashboard or CLI

5. **Configure Auth Providers**
   - Enable email/password (default)
   - Optionally enable Discord, Twitch, Steam

6. **Start the app**
   - Frontend connects automatically via `/utils/supabase/info.tsx`

---

## 👥 User Roles

### Gamer
**Capabilities:**
- Browse and join tournaments
- Create and manage teams
- Earn XP and level up
- View leaderboards and stats
- Receive notifications
- Connect social accounts

**Dashboard Features:**
- Active tournaments list
- My tournaments (registered)
- Team overview
- XP progress tracker
- Leaderboard widget

### Organizer
**Capabilities:**
- Everything a Gamer can do, PLUS:
- Create unlimited tournaments
- Manage tournament lifecycle
- View participant lists
- Remove participants
- Configure tournament settings
- View analytics

**Dashboard Features:**
- Tournament creation wizard
- My created tournaments
- Participant management
- Tournament analytics

### Admin
**Capabilities:**
- Everything an Organizer can do, PLUS:
- View all users
- Change user roles
- Ban/unban users
- Cancel any tournament
- Manual XP awards
- Platform oversight

**Dashboard Features:**
- User management panel
- Global tournament list
- Platform statistics
- Moderation tools

---

## 📡 API Documentation

### Base URL
```
https://{projectId}.supabase.co/functions/v1/make-server-6b1cd74f
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer {access_token}
```

### Endpoints

#### Authentication
- `POST /auth/signup` - Create new account
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123",
    "role": "gamer",
    "display_name": "Pro Player"
  }
  ```

#### User Profiles
- `GET /users/me` - Get current user profile (authenticated)
- `PATCH /users/me` - Update profile (authenticated)
  ```json
  {
    "bio": "Competitive gamer",
    "interested_games": ["Valorant", "CS:GO"],
    "contact_info": { "discord": "username#1234" }
  }
  ```
- `GET /users/:id` - Get public user profile

#### Gamification
- `GET /gamification/xp` - Get XP transaction history (authenticated)
- `GET /gamification/leaderboard` - Get global leaderboard (public)
- `GET /gamification/level-progress` - Get level progress (authenticated)

#### Tournaments
- `GET /tournaments` - List tournaments (public)
  - Query params: `?status=published&game=Valorant`
- `GET /tournaments/:id` - Get tournament details (public)
- `POST /tournaments` - Create tournament (organizer only)
- `PATCH /tournaments/:id` - Update tournament (owner only)
- `POST /tournaments/:id/publish` - Publish tournament (owner only)
- `POST /tournaments/:id/join` - Join tournament (gamer only)

#### Teams
- `POST /teams` - Create team (authenticated)
- `GET /teams/:id` - Get team details (public)

#### Notifications
- `GET /notifications` - List notifications (authenticated)
- `PATCH /notifications/:id/read` - Mark as read (authenticated)

#### Admin
- `GET /admin/users` - List all users (admin only)
- `PATCH /admin/users/:id/ban` - Ban/unban user (admin only)

### Response Format
**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

---

## 🗄 Database Schema

### Core Entities

**user_profiles**
- Extends Supabase Auth users
- Stores role, level, XP, profile data
- Indexed on level, total_xp for leaderboards

**xp_transactions**
- Stored in KV Store as `xp_transaction:{userId}:{transactionId}`
- Tracks all XP awards with metadata

**tournaments**
- Complete tournament data
- Lifecycle status tracking
- Organizer relationships

**tournament_participants**
- Stored in KV as `tournament_participant:{tournamentId}:{userId}`
- Links users/teams to tournaments

**teams**
- Team information and XP
- Owner relationship

**team_members**
- Stored in KV as `team_member:{teamId}:{userId}`
- Role-based membership

**notifications**
- Stored in KV as `notification:{userId}:{notificationId}`
- Type-based categorization

**See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete schema.**

---

## 🚢 Deployment

### Production Checklist

- [ ] Deploy Supabase Edge Function
- [ ] Run database migrations
- [ ] Configure OAuth providers
- [ ] Set up storage buckets
- [ ] Enable RLS policies
- [ ] Configure custom domain
- [ ] Set up monitoring
- [ ] Test all flows end-to-end

### Environment Variables

**Required (auto-provided by Supabase):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Scaling

**MVP → 10K Users:**
- Current KV Store architecture handles well
- No changes needed

**10K → 100K Users:**
- Migrate KV data to PostgreSQL tables
- Add database indexes
- Implement Redis caching for leaderboards
- Use CDN for static assets

**100K+ Users:**
- Horizontal Edge Function scaling (Supabase auto-scales)
- Read replicas for database
- Advanced caching strategies
- WebSocket for real-time updates

---

## 🎨 Design System

### Brand Colors
- **Black (#000000):** Primary background, main UI
- **Red (#EF4444):** CTAs, tournament badges, accents
- **Neon Green (#00ff88):** XP indicators, success states
- **Blue (#3B82F6):** Team features, info states
- **Zinc Grays:** Text hierarchy and borders

### Typography
- **Font Family:** System font stack (optimal performance)
- **Weights:** 400 (normal), 500 (medium), 700 (bold)
- **Scale:** Tailwind default (text-sm to text-6xl)

### Component Library
All components are in `/src/app/components/ui/` using Radix UI primitives with custom styling.

---

## 📊 Metrics & Analytics

### Key Metrics Tracked
- User registration rate
- Tournament creation count
- Tournament join rate
- Average XP per user
- Leaderboard ranking changes
- Notification engagement

### Analytics Dashboard (Admin)
- Total users by role
- Active tournaments
- Platform growth charts
- User engagement scores

---

## 🐛 Troubleshooting

### Common Issues

**"Unauthorized" on API calls:**
- Check localStorage for `sb-access-token`
- Verify token is being sent in Authorization header
- Try logging out and back in

**Social login redirect fails:**
- Verify OAuth provider is enabled in Supabase Dashboard
- Check redirect URL matches exactly: `https://{project}.supabase.co/auth/v1/callback`
- Clear browser cookies and try again

**XP not updating:**
- Check console for API errors
- Verify action hasn't been completed before (non-repeatable)
- Refresh profile manually

**Tournament not appearing:**
- Ensure tournament is in "published" status
- Check filters on tournaments list
- Verify no errors in browser console

---

## 🤝 Contributing

This is a production MVP for HERU.gg. For feature requests or bug reports, please:

1. Document the issue clearly
2. Include reproduction steps
3. Attach screenshots if applicable
4. Note your environment (browser, OS)

---

## 📄 License

Proprietary - HERU.gg Platform
© 2026 HERU.gg. All rights reserved.

---

## 🎯 Roadmap

### Phase 2 (Post-MVP)
- [ ] Automated bracket generation and progression
- [ ] Live streaming integration (Twitch embeds)
- [ ] Real-time chat (tournament and team chat)
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Achievement/badge system beyond XP
- [ ] Premium organizer features
- [ ] Match dispute resolution system
- [ ] Email notification system
- [ ] Third-party API webhooks

### Phase 3 (Scale)
- [ ] Multi-language support
- [ ] Regional tournaments
- [ ] Sponsor integration system
- [ ] Payment processing for entry fees
- [ ] Live tournament streaming on platform
- [ ] AI-powered match predictions
- [ ] Player statistics and performance tracking

---

## 💬 Support

For technical support or questions:
- Review [SETUP.md](./SETUP.md) for detailed configuration
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Consult Supabase documentation: https://supabase.com/docs

---

**Built with precision. Deployed with confidence. HERU.gg - Step Into The Arena.** 🏆
