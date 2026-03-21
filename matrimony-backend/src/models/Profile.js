const db = require("../config/db");

const allowedColumns = [
  "user_id",
  "full_name",
  "father_name",
  "mother_maiden_name",
  "dob",
  "gender",
  "marital_status",
  "address",
  "birthplace",
  "qualification",
  "occupation",
  "monthly_income",
  "caste",
  "sub_caste",
  "relative_surname",
  "expectations",
  "avatar_url",
  "other_comments",
  "profile_for",
  "status",
  "state",
  "district",
  "taluka",
  // New profile fields
  "property",
  "height",
  "color",
  "age",
  "profile_managed_by",
  "phone_number",
  "parents_phone_number",
  "whatsapp_number",
  "company_name",
  "manglik",
  "biodata_file",
  "kundali_file",
  "privacy_setting",
];

const filterValidData = (data) => {
  const filtered = {};
  Object.keys(data).forEach((key) => {
    if (allowedColumns.includes(key)) {
      let value = data[key];

      // Clean avatar_url and biodata_file to store only relative path
      if ((key === "avatar_url" || key === "biodata_file" || key === "kundali_file") && value && typeof value === "string") {
        const uploadsIndex = value.indexOf("uploads/");
        if (uploadsIndex !== -1) {
          value = value.substring(uploadsIndex);
        }
      }

      // Prevent crashing: Do not insert empty strings into ENUM columns
      if (typeof value === "string" && value.trim() === "") {
        if (["manglik", "gender", "marital_status", "status", "profile_for", "profile_managed_by"].includes(key)) {
          return; // Skip adding this field
        }
      }

      filtered[key] = value;
    }
  });
  if (!filtered.status) filtered.status = "Pending";
  return filtered;
};

const Profile = {
  create: async (profileData) => {
    const validData = filterValidData(profileData);
    const fields = Object.keys(validData);
    const values = Object.values(validData);
    const placeholders = fields.map(() => "?").join(", ");

    const query = `INSERT INTO profiles (${fields.join(", ")}) VALUES (${placeholders})`;
    const [result] = await db.execute(query, values);
    return result.insertId;
  },

  findByUserId: async (userId, viewerId = null) => {
    let query = `
      SELECT p.*, u.is_subscribed, u.is_paid, u.mobile_number,
      (SELECT COUNT(*) FROM shortlists s JOIN profiles sp ON s.profile_user_id = sp.user_id WHERE s.user_id = p.user_id AND sp.status = 'Approved') AS shortlist_count
    `;
    const params = [userId];

    if (viewerId) {
      query += `, (SELECT COUNT(*) FROM shortlists WHERE user_id = ? AND profile_user_id = p.user_id) > 0 AS is_shortlisted,
        (
          -- Check for accepted interest in either direction first
          SELECT
            CASE
              WHEN EXISTS (
                SELECT 1 FROM invitations
                WHERE LOWER(status) = 'accepted'
                  AND (
                    (sender_id = ? AND receiver_id = p.user_id)
                    OR (sender_id = p.user_id AND receiver_id = ?)
                  )
              ) THEN 'accepted'
              -- Mutual interest: both sides sent pending
              WHEN EXISTS (
                SELECT 1 FROM invitations WHERE sender_id = ? AND receiver_id = p.user_id AND LOWER(status) = 'pending'
              ) AND EXISTS (
                SELECT 1 FROM invitations WHERE sender_id = p.user_id AND receiver_id = ? AND LOWER(status) = 'pending'
              ) THEN 'mutual'
              -- Single direction pending
              WHEN EXISTS (
                SELECT 1 FROM invitations
                WHERE LOWER(status) = 'pending'
                  AND (
                    (sender_id = ? AND receiver_id = p.user_id)
                    OR (sender_id = p.user_id AND receiver_id = ?)
                  )
              ) THEN 'pending'
              ELSE 'none'
            END
        ) AS invitation_status `;
      // params: is_shortlisted(viewerId), then 6 viewerId values for the CASE, then viewerId for params.unshift below
      params.unshift(viewerId, viewerId, viewerId, viewerId, viewerId, viewerId, viewerId);
    }

    query += `
      FROM profiles p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.user_id = ?
    `;

    console.log(`[PROFILE_DB] Fetching profile ID ${userId} for viewer ${viewerId}`);
    const [rows] = await db.execute(query, params);
    
    if (rows.length > 0) {
      console.log(`[PROFILE_DB] Result status: ${rows[0].invitation_status || 'None'}`);
    }
    
    return rows[0];
  },

  getAll: async (currentUserId, filters = {}) => {
    let query = `
     SELECT 
    p.*,
    u.mobile_number,
    u.is_paid,
    TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
    inv.status AS invitation_status,
    inv.sender_id AS inv_sender_id,
    inv.receiver_id AS inv_receiver_id
FROM profiles p
JOIN users u ON u.id = p.user_id
    LEFT JOIN invitations inv ON inv.id = (
        SELECT i.id 
        FROM invitations i
        WHERE 
            (i.sender_id = ? AND i.receiver_id = p.user_id)
            OR
            (i.receiver_id = ? AND i.sender_id = p.user_id)
        ORDER BY i.id DESC
        LIMIT 1
    )
WHERE p.user_id != ?
      AND p.status = 'Approved'
    `;

    const params = [
      currentUserId,
      currentUserId,
      currentUserId,
    ];

    // Helper to check if value is valid (not undefined, null, or empty string)
    const isValid = (val) =>
      val !== undefined && val !== null && val.toString().trim() !== "";

    if (isValid(filters.gender)) {
      query += " AND p.gender = ?";
      params.push(filters.gender);
    }

    if (isValid(filters.ageMin)) {
      query += " AND TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) >= ?";
      params.push(Number(filters.ageMin));
    }

    if (isValid(filters.ageMax)) {
      query += " AND TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) <= ?";
      params.push(Number(filters.ageMax));
    }

    if (isValid(filters.qualification)) {
      query += " AND p.qualification LIKE ?";
      params.push(`%${filters.qualification}%`);
    }

    if (isValid(filters.caste)) {
      query += " AND p.caste = ?";
      params.push(filters.caste);
    }

    if (isValid(filters.incomeMin)) {
      const minIncome = Number(filters.incomeMin);
      if (!isNaN(minIncome)) {
        query += " AND p.monthly_income >= ?";
        params.push(minIncome);
      }
    }

    if (isValid(filters.birthplace)) {
      query += " AND p.birthplace LIKE ?";
      params.push(`%${filters.birthplace}%`);
    }

    console.log(
      "[FILTER_DEBUG] Generated Query:",
      query.replace(/\s+/g, " ").trim(),
    );
    console.log("[FILTER_DEBUG] Query Params:", params);

    try {
      const [rows] = await db.execute(query, params);
      console.log("resukt", rows);

      return rows;
    } catch (error) {
      console.error("[FILTER_ERROR] SQL execution failed:", error.message);
      console.error("[FILTER_ERROR] Failed Query:", query);
      throw error; // Re-throw to be handled by controller
    }
  },



  getLatest: async (currentUserId, filters = {}) => {
    // Sanitize and provide defaults for pagination
    const page = Math.max(1, parseInt(filters.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(filters.limit) || 10));
    const offset = (page - 1) * limit;

    // Sanitize age filters
    const minAge = filters.minAge ? parseInt(filters.minAge) : null;
    const maxAge = filters.maxAge ? parseInt(filters.maxAge) : null;

    console.log(
      `[SQL_DEBUG] Fetching profiles for userId: ${currentUserId}, Page: ${page}, Limit: ${limit}`,
    );

    let query = `
      SELECT 
        p.*,
        u.is_subscribed,
        u.is_paid,
        u.mobile_number,
        TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
        CASE 
          WHEN LOWER(inv.status) = 'accepted' THEN 'accepted'
          WHEN LOWER(inv.status) = 'pending' THEN 'pending'
          ELSE 'none'
        END AS invitation_status,
        (SELECT COUNT(*) FROM shortlists WHERE user_id = ? AND profile_user_id = p.user_id) > 0 AS is_shortlisted
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN invitations inv ON inv.id = (
        SELECT i.id 
        FROM invitations i
        WHERE 
          (i.sender_id = ? AND i.receiver_id = p.user_id)
          OR
          (i.receiver_id = ? AND i.sender_id = p.user_id)
        ORDER BY i.id DESC
        LIMIT 1
      )
      WHERE p.user_id != ?
        AND p.status = 'Approved'
    `;

    const params = [
      currentUserId, // is_shortlisted subquery
      currentUserId, // inv sender_id
      currentUserId, // inv receiver_id
      currentUserId, // user_id != currentUserId
    ];

    if (minAge !== null && !isNaN(minAge)) {
      query += ` AND TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) >= ?`;
      params.push(minAge);
    }
    if (maxAge !== null && !isNaN(maxAge)) {
      query += ` AND TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) <= ?`;
      params.push(maxAge);
    }

    // Use integer interpolation for LIMIT and OFFSET (safe because they are validated integers)
    query += ` ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    try {
      const [rows] = await db.execute(query, params);
      return { rows, totalCount: rows.length };
    } catch (error) {
      console.error("[SQL_ERROR] getLatest failed:", error.message);
      console.error("[SQL_ERROR] Query:", query.replace(/\s+/g, " ").trim());
      console.error("[SQL_ERROR] Params:", params);
      throw error;
    }
  },

  getSuggested: async (userId) => {
    // Get current user's profile to match against
    const [userProfileRows] = await db.execute(
      "SELECT * FROM profiles WHERE user_id = ?",
      [userId],
    );
    if (userProfileRows.length === 0) return [];

    const userProfile = userProfileRows[0];
    let age = 30; // Default age if DOB is missing or invalid

    if (userProfile.dob) {
      const birthDate = new Date(userProfile.dob);
      if (!isNaN(birthDate.getTime())) {
        age = new Date().getFullYear() - birthDate.getFullYear();
      }
    }

    // Safety check for NaN
    if (isNaN(age)) age = 30;

    const query = `
      SELECT p.*, TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN invitations i 
        ON (
             (i.sender_id = ? AND i.receiver_id = p.user_id)
          OR (i.receiver_id = ? AND i.sender_id = p.user_id)
           )
      WHERE p.user_id != ?
        AND p.status = 'Approved'
        AND i.id IS NULL
        AND (
             p.caste = ?
          OR p.birthplace = ?
          OR TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) BETWEEN ? AND ?
        )`;

    const [rows] = await db.execute(query, [
      userId,
      userId,
      userId,
      userProfile.caste || "",
      userProfile.birthplace || "",
      age - 5,
      age + 5,
    ]);
    return rows;
  },

  update: async (userId, data) => {
    const validData = filterValidData(data);
    const fields = Object.keys(validData);
    const values = Object.values(validData);

    if (fields.length === 0) return false;

    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE profiles SET ${setClause} WHERE user_id = ?`;
    const [result] = await db.execute(query, [...values, userId]);
    return result.affectedRows > 0;
  },

  updatePrivacySetting: async (userId, setting) => {
    const [result] = await db.execute(
      "UPDATE profiles SET privacy_setting = ? WHERE user_id = ?",
      [setting, userId],
    );
    return result.affectedRows > 0;
  },

  blockUser: async (blockerId, blockedUserId, reason = "") => {
    const [result] = await db.execute(
      "INSERT IGNORE INTO blocks (blocker_id, blocked_user_id, reason) VALUES (?, ?, ?)",
      [blockerId, blockedUserId, reason],
    );
    return result.affectedRows > 0;
  },

  unblockUser: async (blockerId, blockedUserId) => {
    const [result] = await db.execute(
      "DELETE FROM blocks WHERE blocker_id = ? AND blocked_user_id = ?",
      [blockerId, blockedUserId],
    );
    return result.affectedRows > 0;
  },

  getBlockedUsers: async (blockerId) => {
    const [rows] = await db.execute(
      `SELECT p.user_id, p.full_name, p.avatar_url 
       FROM blocks b 
       JOIN profiles p ON b.blocked_user_id = p.user_id 
       WHERE b.blocker_id = ?`,
      [blockerId],
    );
    return rows;
  },

  isBlocked: async (userId, otherUserId) => {
    const [rows] = await db.execute(
      "SELECT 1 FROM blocks WHERE (blocker_id = ? AND blocked_user_id = ?) OR (blocker_id = ? AND blocked_user_id = ?)",
      [userId, otherUserId, otherUserId, userId],
    );
    return rows.length > 0;
  },
};

module.exports = Profile;
