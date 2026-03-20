# 🎯 MATRIMONY APP - COMPLETE EXECUTION GUIDE

## 📋 Project Overview

This is a complete matrimony/matrimonial matching application with the following features:

- ✅ User authentication with JWT
- ✅ Profile creation and management
- ✅ Browse profiles feed
- ✅ **Shortlist profiles** (save favorites)
- ✅ **Send follow/invitation requests**
- ✅ **Accept connections** to see full profiles
- ✅ Profile visibility based on subscription/connection status

---

## 🗄️ Database Setup (CRITICAL FIRST STEP)

### Option 1: Using SQL File (Recommended)

1. **Open MySQL and create database:**

   ```sql
   CREATE DATABASE matrimony_db;
   USE matrimony_db;
   ```

2. **Run the schema file:**
   - Location: `matrimony-backend/schema.sql`
   - Copy entire file content and execute in MySQL

3. **Verify all tables are created:**

   ```sql
   SHOW TABLES;
   ```

   Should show: `users`, `profiles`, `multiple_profile_images`, `invitations`, `shortlists`, `blocks`

### Option 2: Manual SQL (If file method fails)

Copy and paste from `matrimony-backend/schema.sql` into your MySQL client.

---

## 🚀 Backend Setup

### Step 1: Install Dependencies

```bash
cd matrimony-backend
npm install
```

### Step 2: Environment Configuration

✅ **Already created:** `.env` file in `matrimony-backend/`

**Verify it contains:**

```
PORT=5472
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Root
DB_NAME=matrimony_db
JWT_SECRET=matrimony_app_jwt_secret_key_2026_secure_very_important
NODE_ENV=development
```

### Step 3: Start Backend Server

```bash
npm start
```

**Expected output:**

```
Server is running on http://0.0.0.0:5472
Access from device: http://192.168.0.100:5472
```

✅ Server should be **running on port 5472**

---

## 📱 Frontend Setup

### Step 1: Install Dependencies

```bash
cd matrimony-app
npm install
```

### Step 2: Verify API URL

**File:** `matrimony-app/src/utils/constants.js`

Find this line:

```javascript
export const API_BASE_URL = "http://192.168.0.176:5472/api";
```

**⚠️ IMPORTANT:** Replace `192.168.0.176` with your actual machine IP if different:

- Windows: Run `ipconfig` → find `IPv4 Address`
- Mac/Linux: Run `ifconfig` → find inet address

### Step 3: Start Frontend

```bash
npm start
```

or

```bash
expo start
```

---

## 🌐 Web Admin Dashboard Setup

### Step 1: Install Dependencies

```bash
cd matrimony-admin-web
npm install
```

### Step 2: Seed Admin User (First Time Only)

Run the seed script in the backend to create an admin account:

```bash
cd matrimony-backend
node seed_admin.js
```

**Credentials Created:**
- **Mobile Number:** `9999999999`
- **Password:** `admin123`

### Step 3: Verify API URL

**File:** `matrimony-admin-web/src/api.js`

```javascript
export const API_BASE_URL = "http://localhost:5472/api";
```

*(No need to change if running backend on the same machine)*

### Step 4: Start Web App

```bash
cd matrimony-admin-web
npm run dev
```

✅ Open `http://localhost:5173` in your browser.

---

## 🧪 Complete Feature Testing Flow


### Test Case 1: Create User & Profile

1. **Signup:**
   - Open app → Click "Sign Up"
   - Enter mobile: `9876543210`
   - Enter password: `password123`
   - ✅ Should redirect to registration

2. **Create Profile:**
   - Fill all required fields:
     - Full Name: "John Doe"
     - DOB: Select date
     - Gender: Male/Female
     - Marital Status: Single
     - Occupation: Job
     - Caste: Any
     - Address: City name
     - State, District, Taluka: Select from dropdown
   - Click "Submit"
   - ✅ Profile should be **Pending** (admin approval needed)

### Test Case 2: Approve Profile (Admin)

1. **Create another user** with different mobile (for testing)
2. **Shortlist & notification testing** requires approved profiles

**To approve profile quickly:**

```sql
UPDATE profiles SET status = 'Approved' WHERE user_id = 1;
```

### Test Case 3: Shortlist Feature ⭐

1. **Login** as User 1
2. **Navigate to "Find Matches"** tab
3. **Click star icon** on a profile
4. **Check console logs:**
   ```
   [FEED_SHORTLIST] Sending payload: {profileUserId: 2}
   [FEED_SHORTLIST] Success response: {message: "..."}
   ```
5. **Success Alert** should appear
6. **Navigate to "Shortlist"** tab
7. ✅ Profile should appear in shortlist

**Verify in Database:**

```sql
SELECT * FROM shortlists;
-- Should show: user_id=1, profile_user_id=2
```

### Test Case 4: Send Follow/Invitation Request 💌

1. **In Shortlist screen**, click "FOLLOW" button
2. **Check console logs:**
   ```
   [SHORTLIST_SCREEN] Sending follow request to user 2...
   [SHORTLIST_SCREEN] ✅ Follow request sent successfully
   ```
3. **Success Alert** displays
4. Button should change to "PENDING..."

**Verify in Database:**

```sql
SELECT * FROM invitations
WHERE sender_id = 1 AND receiver_id = 2;
-- Should show: status='Pending'
```

### Test Case 5: Accept Invitation & See Full Profile 🎉

1. **Login as User 2** (the one who received follow request)
2. **Navigate to "Invitations"** tab
3. **Go to "Received" tab**
4. **See User 1's profile** with "Accept" button
5. **Click "Accept"**
6. **Success Alert:** "You are now connected with John Doe!"

**Verify in Database:**

```sql
SELECT * FROM invitations
WHERE sender_id = 1 AND receiver_id = 2;
-- Should show: status='Accepted'
```

### Test Case 6: View Full Profile When Connected ✅

1. **Login as User 1**
2. **Go to Find Matches**
3. **View User 2's profile**
4. **Check profile visibility:**
   - ✅ Name should now show FULL name (was masked)
   - ✅ Phone number should be visible
   - ✅ Photo should NOT be blurred
   - ✅ "Connected" badge should appear

**Profile logic:**

- 🔒 **Blurred & Masked** → Not subscribed, not connected
- 🔓 **Unlocked** → Subscribed OR Accepted invitation
- 👁️ **Full Profile** → Accepted invitation (connected)
- ☎️ **Phone visible** → Connected (Accepted invitation)

---

## 📊 Database Verification Queries

Run these in MySQL to verify complete setup:

```sql
-- Check all users
SELECT id, mobile_number, role, is_subscribed FROM users;

-- Check all profiles
SELECT id, user_id, full_name, status FROM profiles;

-- Check shortlists
SELECT
  s.id,
  u1.mobile_number as user_mobile,
  u2.mobile_number as shortlisted_user_mobile,
  s.created_at
FROM shortlists s
JOIN users u1 ON s.user_id = u1.id
JOIN users u2 ON s.profile_user_id = u2.id;

-- Check invitations
SELECT
  i.id,
  u1.mobile_number as sender,
  u2.mobile_number as receiver,
  i.status,
  i.created_at
FROM invitations i
JOIN users u1 ON i.sender_id = u1.id
JOIN users u2 ON i.receiver_id = u2.id;

-- Check if invitation is "Connected"
SELECT * FROM invitations
WHERE sender_id = 1 AND receiver_id = 2 AND status = 'Accepted';
```

---

## 🐛 Console Logs to Look For

### Frontend (Expo console)

**Shortlist Action:**

```
[FEED_SHORTLIST] Sending payload: {profileUserId: 2}
[FEED_SHORTLIST] To endpoint: /profiles/shortlist
[FEED_SHORTLIST] Success response: {message: "Profile shortlisted successfully"}
```

**Follow Request:**

```
[SHORTLIST_SCREEN] Sending follow request to user 2...
[SHORTLIST_SCREEN] ✅ Follow request sent successfully
[SHORTLIST_SCREEN] Received: 1 profiles
```

### Backend (Node.js console)

**Shortlist:**

```
[AUTH_DEBUG] Token Verified. User ID: 1
[SHORTLIST_DEBUG] Request received
[SHORTLIST_DEBUG] Parsed values: Sender=1, Target=2
[SHORTLIST_MODEL] Checking if already shortlisted
[SHORTLIST_MODEL] Inserting new shortlist entry
[SHORTLIST_MODEL] ✅ Shortlist added successfully
```

**Follow Request:**

```
[SHORTLIST_MODEL] Checking if already shortlisted
[SHORTLIST_MODEL] Inserting new shortlist entry
```

---

## ❌ Troubleshooting

| Issue                               | Solution                                          |
| ----------------------------------- | ------------------------------------------------- |
| **404 on /profiles/shortlist**      | Restart backend after fixing auth middleware      |
| **ECONNREFUSED (DB)**               | Check MySQL is running: `mysql -u root -p`        |
| **Empty shortlists table**          | Check backend logs for INSERT errors              |
| **Photos blurred after connection** | Logout & login to refresh data                    |
| **Phone not showing**               | Invitation must be **Accepted**, not just Pending |
| **Full name still masked**          | Refresh profile or acceptance status not synced   |

---

## 📱 Test Accounts to Create

### User 1:

- Mobile: 9876543210
- Password: password123
- After signup: Fill profile with "John Doe"

### User 2:

- Mobile: 9876543211
- Password: password123
- After signup: Fill profile with "Jane Smith"

### Admin (Optional):

- Mobile: 8446430330
- Password: admin123
- Then update role: `UPDATE users SET role='admin' WHERE mobile_number='8446430330';`

---

## 🔄 Complete Flow Summary

```
1. USER A LOGS IN
   ↓
2. SEES PROFILE FEED (blurred, name masked)
   ↓
3. CLICKS SHORTLIST ⭐
   → Saves to shortlists table
   ↓
4. Goes to SHORTLIST TAB
   ↓
5. CLICKS FOLLOW 💌
   → Sends invitation
   → Saves to invitations table (status=Pending)
   ↓
6. USER B LOGS IN
   ↓
7. Goes to INVITATIONS TAB → RECEIVED
   ↓
8. CLICKS ACCEPT ✅
   → Updates invitations table (status=Accepted)
   → Both users now "Connected"
   ↓
9. USER A VIEWS PROFILE AGAIN
   → Photo NOT blurred ✅
   → Full name visible ✅
   → Phone number visible ✅
   → "Connected" badge shows ✅
```

---

## 🎯 Key Files Modified

1. **Backend:**
   - `.env` - Database configuration
   - `src/routes/api.js` - Fixed shortlist auth
   - `src/models/Shortlist.js` - Enhanced logging
   - `src/models/Invitation.js` - Connection logic
   - `schema.sql` - Complete DB schema

2. **Frontend:**
   - `src/screens/dashboard/ProfilesFeedScreen.js` - Shortlist action
   - `src/screens/dashboard/ShortlistedScreen.js` - Follow logic
   - `src/screens/dashboard/InvitationsScreen.js` - Accept logic
   - `src/components/ProfileCard.js` - Profile visibility
   - `src/services/api.js` - Enhanced logging

---

## ✅ Verification Checklist

Before considering setup complete, verify:

- [ ] Database created with all 6 tables
- [ ] `.env` file exists in backend
- [ ] Backend running on port 5472
- [ ] Frontend can connect to backend (check network request logs)
- [ ] Can create user and profile
- [ ] Can see profile feed (may be blurred if not subscribed)
- [ ] Can shortlist profile ⭐
- [ ] Shortlist entry appears in database
- [ ] Can send follow request 💌
- [ ] Invitation saved to database
- [ ] Can accept invitation on other user account
- [ ] Profile shows full details after acceptance
- [ ] Phone number visible only when connected

---

## 📞 Support

If you encounter issues:

1. **Check backend logs** - Look for error messages
2. **Check frontend logs** - Expo console should show request/response
3. **Check database** - Run verification queries
4. **Verify .env** - JWT_SECRET must match across all tokens
5. **Clear cache** - Logout & login to refresh data

---

## 🎉 Once Everything Works

You have successfully implemented:

✅ Shortlist/Favorites feature
✅ Follow/Connection request system
✅ Profile visibility based on connection status
✅ Full authentication flow
✅ Database-backed persistence
✅ Real-time profile matching

Congratulations! Your matrimony app is now fully functional! 🚀

---

**Last Updated:** March 8, 2026
**Status:** ✅ COMPLETE & READY FOR TESTING
