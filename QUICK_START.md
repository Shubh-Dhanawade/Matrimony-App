# ⚡ QUICK START GUIDE - 5 MINUTES TO RUN

## 🪜 Step 1: Setup Database (2 minutes)

### A. Create Database

```sql
CREATE DATABASE matrimony_db;
USE matrimony_db;
```

### B. Run Schema

1. Open `matrimony-backend/schema.sql`
2. Copy ALL content
3. Paste in MySQL and execute
4. Done! ✅

**Verify:**

```sql
SHOW TABLES;
-- Should show: users, profiles, multiple_profile_images, invitations, shortlists, blocks
```

---

## 🖥️ Step 2: Start Backend (1 minute)

```bash
cd matrimony-backend
npm install    # (only first time)
npm start
```

**Expected:**

```
Server is running on http://0.0.0.0:5472
Access from device: http://192.168.0.100:5472
```

✅ Leave running

---

## 📱 Step 3: Start Frontend (1 minute)

**New terminal:**

```bash
cd matrimony-app
npm install    # (only first time)
npm start
```

**Expected:**

```
Expo DevTools is running at ...
Localhost URL: exp://localhost:19000
LAN URL: exp://192.168.0.100:19000
```

✅ App ready

---

## 🧪 Step 4: Test It! (1 minute)

### Create User 1:

- Sign Up → Mobile: `9876543210`
- Password: `password123`
- Fill profile quickly

### Create User 2:

- Different terminal or device
- Sign Up → Mobile: `9876543211`
- Password: `password123`
- Fill profile

### Approve Profiles (IMPORTANT):

```sql
UPDATE profiles SET status='Approved' WHERE user_id IN (1, 2);
```

### Test Shortlist:

1. Login as User 1
2. "Find Matches" tab
3. Click ⭐ on User 2
4. Success! ✅

### Test Follow:

1. "Shortlist" tab
2. Click "FOLLOW"
3. Request sent! ✅

### Test Accept:

1. Login as User 2
2. "Invitations" tab → "Received"
3. Click "ACCEPT"
4. Connected! ✅

### Test Full Profile:

1. Login as User 1
2. "Find Matches" tab
3. View User 2 profile
4. ✅ Full name visible
5. ✅ Phone visible
6. ✅ Photo not blurred

---

## 📊 Verify Database

Run in MySQL:

```sql
-- Check shortlists
SELECT * FROM shortlists;

-- Check invitations
SELECT * FROM invitations;

-- Check if connected
SELECT * FROM invitations WHERE status='Accepted';
```

---

## ✅ Done!

Your matrimony app is fully functional with:

- ⭐ Shortlist
- 💌 Follow requests
- 🎉 Accepted connections
- 👁️ Full profile visibility

🎊 **Congratulations!**

---

## 🆘 Quick Troubleshooting

| Problem                | Solution                                               |
| ---------------------- | ------------------------------------------------------ |
| Error connecting to DB | MySQL not running → `mysql -u root -p`                 |
| Can't see profiles     | Approve them: `UPDATE profiles SET status='Approved';` |
| Shortlist fails        | Check backend logs for errors                          |
| Can't follow           | Make sure profile is Approved                          |
| Phone not visible      | Invitation must be Accepted, not Pending               |

---

## 📞 Console Logs to Check

**Frontend (when shortlisting):**

```
[FEED_SHORTLIST] Sending payload: {profileUserId: 2}
[FEED_SHORTLIST] Success response:...
```

**Backend:**

```
[SHORTLIST_DEBUG] Request received
[SHORTLIST_MODEL] ✅ Shortlist added successfully
```

If you see these → Everything works! ✅

---

**Total Time:** ~5-10 minutes ⏱️

**Result:** Fully working matrimony app! 🚀
