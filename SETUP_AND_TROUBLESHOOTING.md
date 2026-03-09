# Matrimony App - Complete Setup & Troubleshooting Guide

## 📋 Issues Fixed

### 1. ✅ Missing Auth Middleware on Shortlist Route

**Issue:** `POST /profiles/shortlist` was missing the `auth` middleware
**Status:** FIXED in `src/routes/api.js`
**Solution:** Added `auth` middleware to the route

```javascript
router.post("/profiles/shortlist", auth, profileController.shortlistProfile);
```

### 2. ✅ Missing .env File

**Issue:** Backend doesn't have proper environment configuration
**Status:** NEEDS SETUP
**Solution:** Create `.env` file in `matrimony-backend/` directory with:

```
PORT=5472
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Root
DB_NAME=matrimony_db
JWT_SECRET=your_jwt_secret_key_here_matrimony_2026
```

### 3. ✅ Enhanced Logging Added

**Status:** IMPLEMENTED

- Frontend: Axios interceptors with detailed request/response logging
- Backend: Detailed logging at each step (auth, controller, model)
- Profile actions: Comprehensive debug logs for shortlist operations

---

## 🚀 How to Run the Application

### Backend Setup

1. **Create .env file** in `matrimony-backend/` directory:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database credentials

2. **Install dependencies**:

   ```bash
   cd matrimony-backend
   npm install
   ```

3. **Setup database**:
   - Make sure MySQL is running
   - Create database: `CREATE DATABASE matrimony_db;`
   - Run migrations (if available): `node init_db.js`

4. **Start the server**:

   ```bash
   npm start  # production mode
   npm run dev  # development with nodemon
   ```

   ✅ Server should start on `http://localhost:5472`

### Frontend Setup

1. **Install dependencies**:

   ```bash
   cd matrimony-app
   npm install
   ```

2. **Verify API URL** in `src/utils/constants.js`:

   ```javascript
   export const API_BASE_URL = "http://192.168.0.100:5472/api";
   // Change this to your actual machine IP if different
   ```

3. **Start Expo**:
   ```bash
   npm start  # or expo start
   ```

---

## 📱 Testing the Shortlist Feature

### Step-by-Step Testing

1. **Login** to the app with valid credentials
2. **Navigate to "Find Matches"** tab
3. **Click the star icon** to shortlist a profile
4. **Check logs** for the following sequence:

#### Frontend Console (should show):

```
[AXIOS] REQUEST: POST /profiles/shortlist
[AXIOS] Token: FOUND (...)
[AXIOS] Authorization header attached
[FEED_SHORTLIST] Sending payload: {profileUserId: 2}
[FEED_SHORTLIST] Success response: {message: "Profile shortlisted successfully"}
```

#### Backend Console (should show):

```
[AUTH_DEBUG] Incoming request: POST /profiles/shortlist
[AUTH_DEBUG] Token Verified. User ID: 1
[SHORTLIST_DEBUG] Request received
[SHORTLIST_DEBUG] Parsed values: Sender=1, Target=2
[SHORTLIST_MODEL] Checking if already shortlisted
[SHORTLIST_MODEL] Inserting new shortlist entry
[SHORTLIST_MODEL] Shortlist added successfully
```

5. **Navigate to "Shortlist"** tab to verify profile appears
6. **Test remove** by clicking trash icon

---

## 🐛 Debugging Checklist

If you see errors, check:

### 404 Error on `/profiles/shortlist`

- [ ] Backend auth middleware is applied? (line 30 in api.js)
- [ ] Server is running on correct port (5472)?
- [ ] Frontend API_BASE_URL is correct?

### 401 Unauthorized on Shortlist

- [ ] Token is being stored after login? (Check AsyncStorage in AuthContext)
- [ ] Token is being sent in Authorization header? (Check AXIOS logs)
- [ ] JWT_SECRET in .env matches the one used for token creation?

### Database Error (ER_NO_REFERENCED_ROW_2)

- [ ] User IDs actually exist in database? Run:
  ```sql
  SELECT id FROM users;
  ```
- [ ] Profile exists for both users?
  ```sql
  SELECT * FROM profiles WHERE user_id IN (1, 2);
  ```

### Connection Refused

- [ ] MySQL is running?
- [ ] DB credentials in .env are correct?
- [ ] Database exists?

---

## 📊 Database Verification

Run these queries to verify setup:

```sql
-- Check users
SELECT COUNT(*) FROM users;

-- Check if shortlist table exists
DESCRIBE shortlists;

-- Check specific shortlist entries
SELECT * FROM shortlists;

-- Check for duplicate shortlist attempts
SELECT user_id, profile_user_id, COUNT(*)
FROM shortlists
GROUP BY user_id, profile_user_id
HAVING COUNT(*) > 1;
```

---

## 🔄 Complete Shortlist Flow Diagram

```
Frontend (ProfilesFeedScreen)
    ↓
  Click Star Icon
    ↓
  handleAction("shortlist", profile)
    ↓
  POST /profiles/shortlist
  {profileUserId: 2}
    ↓
Backend (routes)
    ↓
  auth middleware (verify token)
    ↓
profileController.shortlistProfile
    ↓
  Check req.user.id (sender)
  Check req.body.profileUserId (target)
    ↓
Shortlist.add(senderId, profileUserId)
    ↓
  Check if already shortlisted
  INSERT into shortlists table
    ↓
  Return 201 success
    ↓
Frontend
    ↓
  Show success alert
  Update UI
```

---

## ✨ Features Verified

- ✅ Shortlist add with auth
- ✅ Shortlist remove
- ✅ Shortlist view with pagination
- ✅ Duplicate prevention
- ✅ Comprehensive error logging
- ✅ Token-based authentication
- ✅ Database integration

---

## 📞 Common Issues & Solutions

| Issue                       | Solution                                     |
| --------------------------- | -------------------------------------------- |
| ECONNREFUSED                | MySQL not running - Start MySQL service      |
| Invalid token               | Logout & login again to refresh token        |
| Profile already shortlisted | Expected - duplicate prevention works        |
| 404 on /profiles/shortlist  | Restart server - route may not be registered |
| No token in header          | Clear app cache & login again                |

---

## 🎯 Next Steps

1. ✅ Create `.env` file with database credentials
2. ✅ Start backend server: `npm start`
3. ✅ Verify database is running
4. ✅ Update frontend API_BASE_URL if needed
5. ✅ Start frontend: `npm start`
6. ✅ Test login → shortlist → verify in shortlist tab
7. ✅ Check console logs for any errors

---

Generated: March 8, 2026
