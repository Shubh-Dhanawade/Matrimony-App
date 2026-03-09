const db = require("../config/db");

const Shortlist = {
  // Add a profile to shortlist
  add: async (userId, profileUserId) => {
    console.log(
      `[SHORTLIST_MODEL] Checking if already shortlisted: ${userId} -> ${profileUserId}`,
    );
    const [existing] = await db.execute(
      "SELECT id FROM shortlists WHERE user_id = ? AND profile_user_id = ?",
      [userId, profileUserId],
    );

    if (existing.length > 0) {
      console.log(`[SHORTLIST_MODEL] ⚠️ Already shortlisted`);
      throw new Error("Profile already shortlisted");
    }

    console.log(`[SHORTLIST_MODEL] Inserting new shortlist entry...`);
    const [result] = await db.execute(
      "INSERT INTO shortlists (user_id, profile_user_id) VALUES (?, ?)",
      [userId, profileUserId],
    );

    console.log(
      `[SHORTLIST_MODEL] ✅ Shortlist added successfully. Insert ID:`,
      result.insertId,
    );
    return result.insertId;
  },

  // Remove a profile from shortlist
  remove: async (userId, profileUserId) => {
    const [result] = await db.execute(
      "DELETE FROM shortlists WHERE user_id = ? AND profile_user_id = ?",
      [userId, profileUserId],
    );
    return result.affectedRows > 0;
  },

  // Get all shortlisted profiles for a user (enriched with profile + invitation status)
  getByUser: async (userId) => {
    try {
      console.log(
        `[SHORTLIST_MODEL] Fetching shortlisted profiles for user ${userId}`,
      );
      const [rows] = await db.execute(
        `SELECT 
            s.id         AS shortlist_id,
            s.created_at AS shortlisted_at,
            p.*,
            u.mobile_number,
            TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
            CASE
              WHEN inv.status = 'Accepted' THEN 'Connected'
              WHEN inv.status = 'Pending'  THEN 'Pending'
              ELSE 'None'
            END AS invitation_status
         FROM shortlists s
         JOIN profiles p ON p.user_id = s.profile_user_id
         JOIN users    u ON u.id      = s.profile_user_id
         LEFT JOIN invitations inv ON inv.id = (
           SELECT i.id FROM invitations i
           WHERE (i.sender_id = ? AND i.receiver_id = s.profile_user_id)
              OR (i.receiver_id = ? AND i.sender_id  = s.profile_user_id)
           ORDER BY i.id DESC LIMIT 1
         )
         WHERE s.user_id = ?
           AND p.status = 'Approved'
         ORDER BY s.created_at DESC`,
        [userId, userId, userId],
      );
      console.log(
        `[SHORTLIST_MODEL] ✅ Found ${rows.length} shortlisted profiles`,
      );
      return rows;
    } catch (error) {
      console.error("[SHORTLIST_MODEL_ERROR] getByUser failed:", error.message);
      throw error;
    }
  },

  // Check if a specific profile is shortlisted
  isShortlisted: async (userId, profileUserId) => {
    const [rows] = await db.execute(
      "SELECT id FROM shortlists WHERE user_id = ? AND profile_user_id = ?",
      [userId, profileUserId],
    );
    return rows.length > 0;
  },
};

module.exports = Shortlist;
