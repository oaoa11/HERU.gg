# HERU.gg - 5-Minute Quick Start

Get your esports platform running in 5 minutes!

---

## Step 1: Create Supabase Project (2 minutes)

1. Go to **https://supabase.com**
2. Click "New Project"
3. Choose organization or create one
4. Enter project details:
   - Name: `heru-gg`
   - Database Password: (choose a strong password)
   - Region: (choose closest to you)
5. Click "Create new project"
6. ⏱️ Wait ~2 minutes for project to initialize

---

## Step 2: Set Up Database (1 minute)

1. In Supabase Dashboard, click **SQL Editor** (left sidebar)
2. Click "New Query"
3. **Copy and paste this SQL:**

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('gamer', 'organizer', 'admin')),
  display_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  profile_completion_percentage INTEGER DEFAULT 0,
  interested_games TEXT[] DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  bio TEXT,
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_level ON user_profiles(level DESC);
CREATE INDEX idx_user_profiles_total_xp ON user_profiles(total_xp DESC);

-- Enable RLS (optional for MVP)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles viewable" 
  ON user_profiles FOR SELECT 
  USING (true);
```

4. Click **Run** (bottom right)
5. ✅ Should see "Success. No rows returned"

---

## Step 3: Deploy Backend (1 minute)

1. In Supabase Dashboard, click **Edge Functions** (left sidebar)
2. Click **Deploy a new function**
3. Name it: `make-server-6b1cd74f`
4. **Copy the code from:** `/supabase/functions/server/index.tsx` in this project
5. Paste into the editor
6. Click **Deploy function**
7. ✅ Function should deploy successfully

**Note:** The function code is already written and ready to paste!

---

## Step 4: Test the App (1 minute)

1. **The frontend is already connected!**
   - It uses `/utils/supabase/info.tsx` which auto-connects to your Supabase project

2. **Open the app** (it's running in Figma Make)

3. **Try it out:**
   - Click "Get Started" on landing page
   - Create account:
     - Email: `test@heru.gg`
     - Password: `TestPass123!`
     - Role: Gamer
     - Name: Pro Player
   - Click "Create Account"
   - ✅ You should be logged in and see the dashboard!

4. **Earn some XP:**
   - Update your profile (add a bio)
   - Watch the XP bar fill up
   - Check the leaderboard (you should be rank #1!)

---

## Step 5: Test Tournament Creation (1 minute)

1. **Create Organizer Account:**
   - Sign out (top right)
   - Sign up again:
     - Email: `organizer@heru.gg`
     - Password: `TestPass123!`
     - Role: **Organizer**
     - Name: Tournament Master

2. **Create a Tournament:**
   - Click "Create Tournament" button
   - Fill in:
     - Name: `Winter Valorant Championship`
     - Game: `Valorant`
     - Description: `Epic tournament!`
     - Max Participants: 16
     - Prize Pool: 10000
   - Click "Create & Publish Tournament"
   - ✅ Tournament created! Check your XP (+200)

3. **Join as Gamer:**
   - Sign out
   - Sign in as `test@heru.gg`
   - Find the tournament in the list
   - Click "Join"
   - ✅ Success! You earned +100 XP

---

## ✅ You're Done!

Your HERU.gg platform is now fully functional!

### What Works Right Now:
- ✅ User registration (Gamer & Organizer)
- ✅ Sign in / Sign out
- ✅ XP system (auto-awards for actions)
- ✅ Level progression (auto-calculates)
- ✅ Leaderboard (live rankings)
- ✅ Tournament creation (organizers)
- ✅ Tournament browsing (everyone)
- ✅ Tournament joining (gamers)
- ✅ Notifications (check the bell icon)
- ✅ Profile management
- ✅ Responsive design

---

## 🎯 Next Steps

### Optional Enhancements:

1. **Enable Social Login (Discord):**
   - Supabase Dashboard → Authentication → Providers
   - Enable Discord
   - Follow: https://supabase.com/docs/guides/auth/social-login/auth-discord
   - Users can then sign in with Discord!

2. **Create an Admin Account:**
   - In Supabase Dashboard → SQL Editor
   - Run:
     ```sql
     UPDATE user_profiles 
     SET role = 'admin' 
     WHERE email = 'test@heru.gg';
     ```
   - Sign in as that user
   - You now have admin powers!

3. **Upload Tournament Banners:**
   - Supabase Dashboard → Storage
   - Create bucket: `make-6b1cd74f-tournament-banners`
   - Upload images
   - Reference in tournament creation

---

## 🐛 Troubleshooting

### "Failed to fetch" error
- ✅ Check Edge Function is deployed
- ✅ Verify function name is exactly `make-server-6b1cd74f`
- ✅ Check Supabase project status (green = running)

### "Unauthorized" error
- ✅ Try logging out and back in
- ✅ Check browser console for token
- ✅ Clear localStorage and retry

### Tournament not showing
- ✅ Make sure you clicked "Create & Publish"
- ✅ Check status filter on tournaments list
- ✅ Refresh the page

### XP not updating
- ✅ Check browser console for errors
- ✅ Verify Edge Function is running
- ✅ Try the action again (some actions only award XP once)

---

## 📊 Test Data

Use these accounts for testing:

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| gamer1@heru.gg | Test123! | Gamer | Join tournaments |
| gamer2@heru.gg | Test123! | Gamer | Fill tournaments |
| organizer@heru.gg | Test123! | Organizer | Create tournaments |
| admin@heru.gg | Test123! | Admin | Platform management |

---

## 📚 Full Documentation

For complete details:
- **Architecture:** See `ARCHITECTURE.md`
- **Setup Guide:** See `SETUP.md`
- **API Testing:** See `API_TESTING.md`
- **Main README:** See `README.md`
- **Delivery Summary:** See `DELIVERY_SUMMARY.md`

---

## 🎉 Success!

You now have a fully functional esports tournament platform running in under 5 minutes!

**Go ahead and:**
- Create more tournaments
- Invite friends to join
- Watch the leaderboard grow
- Earn XP and level up
- Build your esports community

**HERU.gg - Step Into The Arena! 🏆**
