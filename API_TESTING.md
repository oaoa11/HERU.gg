# HERU.gg API Testing Guide

## 🧪 Complete Test Suite

This document provides complete API testing scenarios to verify all platform functionality.

---

## Prerequisites

1. **Supabase Project Setup:**
   - Edge Function deployed at `/make-server-6b1cd74f`
   - Database tables created
   - Auth enabled

2. **Test Tools:**
   - Postman, Insomnia, or curl
   - Browser console (for frontend testing)
   - Supabase Dashboard access

3. **Base URL:**
   ```
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-6b1cd74f
   ```

---

## Test Scenario 1: User Registration & Authentication

### 1.1 Sign Up as Gamer

**Request:**
```bash
POST /auth/signup
Content-Type: application/json

{
  "email": "gamer1@test.com",
  "password": "TestPass123!",
  "role": "gamer",
  "display_name": "ProGamer"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "gamer1@test.com",
      ...
    },
    "profile": {
      "id": "uuid-here",
      "role": "gamer",
      "display_name": "ProGamer",
      "level": 1,
      "total_xp": 50,  // Account creation XP
      "current_xp": 50,
      "profile_completion_percentage": 0
    }
  },
  "message": "Account created successfully"
}
```

**Verification:**
- ✅ User can sign in with credentials
- ✅ Profile shows level 1, 50 XP
- ✅ XP transaction created for account_created

### 1.2 Sign Up as Organizer

**Request:**
```bash
POST /auth/signup
Content-Type: application/json

{
  "email": "organizer1@test.com",
  "password": "TestPass123!",
  "role": "organizer",
  "display_name": "TournamentMaster"
}
```

**Expected:**
- Same structure as gamer
- Role should be "organizer"

### 1.3 Sign In

**Using Supabase Client (Frontend):**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'gamer1@test.com',
  password: 'TestPass123!'
});

// Store access token
localStorage.setItem('sb-access-token', data.session.access_token);
```

---

## Test Scenario 2: Profile Management

### 2.1 Get My Profile

**Request:**
```bash
GET /users/me
Authorization: Bearer {access_token}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "role": "gamer",
    "display_name": "ProGamer",
    "level": 1,
    "total_xp": 50,
    "profile_completion_percentage": 0,
    ...
  }
}
```

### 2.2 Update Profile (Bio)

**Request:**
```bash
PATCH /users/me
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "bio": "Competitive FPS player with 5 years experience"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    ...
    "bio": "Competitive FPS player with 5 years experience",
    "total_xp": 100  // +50 for adding bio
  },
  "message": "Profile updated successfully"
}
```

**Verification:**
- ✅ XP increased by 50
- ✅ Profile completion % updated
- ✅ Bio saved correctly

### 2.3 Update Profile (Interested Games)

**Request:**
```bash
PATCH /users/me
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "interested_games": ["Valorant", "CS:GO", "Apex Legends"]
}
```

**Expected:**
- Total XP increases to 150 (+50 for games)

### 2.4 Update Profile (Contact Info)

**Request:**
```bash
PATCH /users/me
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "contact_info": {
    "discord": "ProGamer#1234",
    "twitter": "@progamer"
  }
}
```

**Expected:**
- Total XP increases to 225 (+75 for contact info)

---

## Test Scenario 3: Gamification

### 3.1 Get XP History

**Request:**
```bash
GET /gamification/xp
Authorization: Bearer {access_token}
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "action_type": "profile_contact",
      "xp_amount": 75,
      "description": "Added contact information",
      "created_at": "2026-01-15T..."
    },
    {
      "action_type": "profile_games",
      "xp_amount": 50,
      ...
    },
    {
      "action_type": "profile_bio",
      "xp_amount": 50,
      ...
    },
    {
      "action_type": "account_created",
      "xp_amount": 50,
      ...
    }
  ]
}
```

**Verification:**
- ✅ All XP transactions listed in chronological order
- ✅ Correct XP amounts
- ✅ Descriptions match actions

### 3.2 Get Level Progress

**Request:**
```bash
GET /gamification/level-progress
Authorization: Bearer {access_token}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "currentLevel": 1,
    "currentXp": 225,
    "currentLevelXp": 0,
    "nextLevelXp": 100,
    "xpToNextLevel": -125,  // Already over threshold!
    "percentage": 225
  }
}
```

**Note:** User should have leveled up! Level 2 threshold is 100 XP.

### 3.3 Get Leaderboard

**Request:**
```bash
GET /gamification/leaderboard
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "id": "uuid",
      "display_name": "ProGamer",
      "avatar_url": null,
      "level": 2,
      "total_xp": 225,
      "role": "gamer"
    },
    ...
  ]
}
```

**Verification:**
- ✅ Sorted by total_xp descending
- ✅ Rank assigned correctly
- ✅ Top 100 maximum

---

## Test Scenario 4: Tournaments

### 4.1 Create Tournament (Organizer Only)

**Sign in as organizer first, then:**

**Request:**
```bash
POST /tournaments
Authorization: Bearer {organizer_access_token}
Content-Type: application/json

{
  "name": "Winter Valorant Championship 2026",
  "description": "Competitive 5v5 tournament with $10,000 prize pool",
  "game": "Valorant",
  "format": "single_elimination",
  "max_participants": 32,
  "prize_pool": 10000,
  "tournament_start": "2026-02-01T18:00:00Z",
  "registration_end": "2026-01-31T23:59:59Z",
  "discord_link": "https://discord.gg/example",
  "rules": "Standard Valorant competitive rules apply"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "tournament-uuid",
    "organizer_id": "organizer-uuid",
    "name": "Winter Valorant Championship 2026",
    "status": "draft",
    "game": "Valorant",
    "max_participants": 32,
    "prize_pool": 10000,
    ...
  },
  "message": "Tournament created successfully"
}
```

**Verification:**
- ✅ Tournament created in draft status
- ✅ Organizer received +200 XP
- ✅ Tournament ID returned

### 4.2 Publish Tournament

**Request:**
```bash
POST /tournaments/{tournament_id}/publish
Authorization: Bearer {organizer_access_token}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "tournament-uuid",
    "status": "published",
    ...
  },
  "message": "Tournament published"
}
```

**Verification:**
- ✅ Status changed to "published"
- ✅ Tournament now visible to gamers

### 4.3 Get Tournaments (Public)

**Request:**
```bash
GET /tournaments?status=published&game=Valorant
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tournament-uuid",
      "name": "Winter Valorant Championship 2026",
      "game": "Valorant",
      "status": "published",
      "max_participants": 32,
      "prize_pool": 10000,
      ...
    }
  ],
  "count": 1
}
```

### 4.4 Get Tournament Details

**Request:**
```bash
GET /tournaments/{tournament_id}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "tournament-uuid",
    "name": "Winter Valorant Championship 2026",
    "organizer": {
      "id": "organizer-uuid",
      "display_name": "TournamentMaster",
      "avatar_url": null
    },
    "participants": [],
    "current_participants": 0,
    ...
  }
}
```

### 4.5 Join Tournament (Gamer)

**Sign in as gamer, then:**

**Request:**
```bash
POST /tournaments/{tournament_id}/join
Authorization: Bearer {gamer_access_token}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "participant-uuid",
    "tournament_id": "tournament-uuid",
    "user_id": "gamer-uuid",
    "status": "registered",
    "joined_at": "2026-01-15T..."
  },
  "message": "Successfully joined tournament"
}
```

**Verification:**
- ✅ Participant record created
- ✅ Gamer received +100 XP
- ✅ Notification created for gamer
- ✅ Tournament current_participants incremented

### 4.6 Try to Join Again (Should Fail)

**Request:**
```bash
POST /tournaments/{tournament_id}/join
Authorization: Bearer {gamer_access_token}
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Already registered for this tournament"
}
```

### 4.7 Update Tournament (Owner Only)

**Request:**
```bash
PATCH /tournaments/{tournament_id}
Authorization: Bearer {organizer_access_token}
Content-Type: application/json

{
  "prize_pool": 15000,
  "description": "Updated: Now $15,000 prize pool!"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "tournament-uuid",
    "prize_pool": 15000,
    "description": "Updated: Now $15,000 prize pool!",
    ...
  },
  "message": "Tournament updated"
}
```

---

## Test Scenario 5: Teams

### 5.1 Create Team

**Request:**
```bash
POST /teams
Authorization: Bearer {gamer_access_token}
Content-Type: application/json

{
  "name": "Apex Predators",
  "tag": "APEX",
  "bio": "Competitive esports team focused on tactical shooters"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "team-uuid",
    "name": "Apex Predators",
    "tag": "APEX",
    "owner_id": "gamer-uuid",
    "level": 1,
    "total_xp": 0,
    ...
  },
  "message": "Team created successfully"
}
```

**Verification:**
- ✅ Team created
- ✅ Creator added as owner member
- ✅ Creator received +150 XP

### 5.2 Get Team Details

**Request:**
```bash
GET /teams/{team_id}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "team-uuid",
    "name": "Apex Predators",
    "members": [
      {
        "id": "member-uuid",
        "user_id": "gamer-uuid",
        "role": "owner",
        "user": {
          "id": "gamer-uuid",
          "display_name": "ProGamer",
          "level": 2
        }
      }
    ],
    ...
  }
}
```

---

## Test Scenario 6: Notifications

### 6.1 Get Notifications

**Request:**
```bash
GET /notifications
Authorization: Bearer {gamer_access_token}
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-uuid",
      "type": "tournament_start",
      "title": "Tournament Registration",
      "message": "You've successfully registered for Winter Valorant Championship 2026",
      "read": false,
      "created_at": "2026-01-15T...",
      "data": {
        "tournament_id": "tournament-uuid"
      }
    },
    {
      "type": "level_up",
      "title": "Level Up!",
      "message": "You've reached level 2!",
      "data": { "level": 2 }
    }
  ]
}
```

### 6.2 Mark Notification as Read

**Request:**
```bash
PATCH /notifications/{notif_id}/read
Authorization: Bearer {gamer_access_token}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "notif-uuid",
    "read": true,
    ...
  }
}
```

---

## Test Scenario 7: Admin Features

### 7.1 Get All Users (Admin Only)

**First, manually change a user's role to 'admin' in database or via Supabase Dashboard**

**Request:**
```bash
GET /admin/users
Authorization: Bearer {admin_access_token}
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "display_name": "ProGamer",
      "role": "gamer",
      "level": 2,
      "total_xp": 475,
      "is_banned": false,
      ...
    },
    {
      "id": "uuid",
      "display_name": "TournamentMaster",
      "role": "organizer",
      ...
    }
  ],
  "count": 2
}
```

### 7.2 Ban User

**Request:**
```bash
PATCH /admin/users/{user_id}/ban
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
  "banned": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "is_banned": true,
    ...
  },
  "message": "User banned"
}
```

**Verification:**
- ✅ User cannot join tournaments
- ✅ User removed from leaderboard

### 7.3 Unban User

**Request:**
```bash
PATCH /admin/users/{user_id}/ban
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
  "banned": false
}
```

**Expected:**
- User can participate again

---

## Test Scenario 8: Error Handling

### 8.1 Unauthorized Access

**Request (no token):**
```bash
GET /users/me
```

**Expected Response:**
```json
{
  "error": "Unauthorized - No token provided"
}
```
**Status Code:** 401

### 8.2 Forbidden (Role Required)

**Request (gamer trying to create tournament):**
```bash
POST /tournaments
Authorization: Bearer {gamer_access_token}
```

**Expected Response:**
```json
{
  "error": "Forbidden - Requires role: organizer"
}
```
**Status Code:** 403

### 8.3 Not Found

**Request:**
```bash
GET /tournaments/non-existent-id
```

**Expected Response:**
```json
{
  "error": "Tournament not found"
}
```
**Status Code:** 404

### 8.4 Validation Error

**Request (missing required field):**
```bash
POST /auth/signup
Content-Type: application/json

{
  "email": "test@test.com"
  // Missing password, role, display_name
}
```

**Expected Response:**
```json
{
  "error": "Missing required fields: email, password, role, display_name"
}
```
**Status Code:** 400

---

## Test Scenario 9: Performance & Load

### 9.1 Concurrent Joins

**Test:**
- Have 20 different users join same tournament simultaneously
- Verify participant count is accurate
- Check for race conditions

**Expected:**
- All legitimate joins succeed
- Participant count = 20
- No duplicate participants

### 9.2 Leaderboard with Many Users

**Test:**
- Create 500 test users with varying XP
- Request leaderboard
- Verify response time < 2 seconds

**Expected:**
- Top 100 returned
- Correctly sorted
- Response time acceptable

---

## Automated Test Script (JavaScript)

```javascript
const API_BASE = 'https://YOUR_PROJECT.supabase.co/functions/v1/make-server-6b1cd74f';

async function runTests() {
  console.log('🧪 Starting HERU.gg API Tests...\n');

  // Test 1: Signup
  console.log('Test 1: User Signup');
  const signupRes = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test_${Date.now()}@test.com`,
      password: 'TestPass123!',
      role: 'gamer',
      display_name: 'TestUser'
    })
  });
  const signupData = await signupRes.json();
  console.log(signupData.success ? '✅ PASS' : '❌ FAIL', signupData);

  // Get access token (need to sign in via Supabase client in real scenario)
  const accessToken = 'YOUR_ACCESS_TOKEN_HERE';

  // Test 2: Get Profile
  console.log('\nTest 2: Get Profile');
  const profileRes = await fetch(`${API_BASE}/users/me`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const profileData = await profileRes.json();
  console.log(profileData.success ? '✅ PASS' : '❌ FAIL', profileData);

  // Test 3: Leaderboard
  console.log('\nTest 3: Leaderboard');
  const leaderboardRes = await fetch(`${API_BASE}/gamification/leaderboard`);
  const leaderboardData = await leaderboardRes.json();
  console.log(leaderboardData.success ? '✅ PASS' : '❌ FAIL', `${leaderboardData.data.length} users`);

  console.log('\n✨ Tests Complete!');
}

// Run: node test-api.js
runTests();
```

---

## Test Coverage Checklist

- [ ] User signup (gamer)
- [ ] User signup (organizer)
- [ ] Sign in with email/password
- [ ] Get own profile
- [ ] Update profile (bio, games, contact)
- [ ] XP awarded for profile updates
- [ ] Level up triggered correctly
- [ ] XP transaction history
- [ ] Level progress calculation
- [ ] Leaderboard sorting and display
- [ ] Create tournament (organizer)
- [ ] Publish tournament
- [ ] List tournaments with filters
- [ ] Get tournament details
- [ ] Join tournament (gamer)
- [ ] Duplicate join prevented
- [ ] Update tournament (owner only)
- [ ] Create team
- [ ] View team with members
- [ ] Notifications created for events
- [ ] Mark notifications as read
- [ ] Admin view all users
- [ ] Admin ban/unban users
- [ ] Unauthorized access blocked (401)
- [ ] Forbidden role access (403)
- [ ] Not found errors (404)
- [ ] Validation errors (400)

---

## Debugging Tips

### Enable Verbose Logging
In backend (`/supabase/functions/server/index.tsx`):
```typescript
console.log('Request received:', c.req.method, c.req.url);
console.log('User ID:', userId);
console.log('Profile data:', profile);
```

### Check Browser Console
Frontend errors appear in browser DevTools console with full stack traces.

### Supabase Dashboard Logs
View Edge Function logs in Supabase Dashboard → Edge Functions → Logs

### Database Queries
Run manual queries in Supabase SQL Editor to verify data:
```sql
SELECT * FROM user_profiles ORDER BY created_at DESC LIMIT 10;
```

---

**Testing complete? You're ready to launch HERU.gg! 🚀**
