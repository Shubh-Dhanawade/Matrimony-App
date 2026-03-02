const db = require('../config/db');

const allowedColumns = [
  'user_id', 'full_name', 'father_name', 'mother_maiden_name', 'dob', 'gender',
  'marital_status', 'address', 'birthplace', 'qualification', 'occupation',
  'monthly_income', 'caste', 'sub_caste', 'relative_surname', 'expectations',
  'avatar_url', 'other_comments', 'profile_for', 'status'
];

const filterValidData = (data) => {
  const filtered = {};
  Object.keys(data).forEach(key => {
    if (allowedColumns.includes(key)) {
      let value = data[key];

      // Clean avatar_url to store only relative path
      if (key === 'avatar_url' && value && typeof value === 'string') {
        const uploadsIndex = value.indexOf('uploads/');
        if (uploadsIndex !== -1) {
          value = value.substring(uploadsIndex);
        }
      }

      filtered[key] = value;
    }
  });
  if (!filtered.status) filtered.status = 'Accepted'; // Default to Approved for now to avoid query filtering issues
  return filtered;
};

const Profile = {
  create: async (profileData) => {
    const validData = filterValidData(profileData);
    const fields = Object.keys(validData);
    const values = Object.values(validData);
    const placeholders = fields.map(() => '?').join(', ');

    const query = `INSERT INTO profiles (${fields.join(', ')}) VALUES (${placeholders})`;
    const [result] = await db.execute(query, values);
    return result.insertId;
  },

  findByUserId: async (userId) => {
    const [rows] = await db.execute('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    return rows[0];
  },

  getAll: async (currentUserId, filters = {}) => {
    // Base query without semicolon at the end
    let query = `
     SELECT 
    p.*,
    u.mobile_number,
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

    `;

    const params = [currentUserId, currentUserId, currentUserId];

    // Helper to check if value is valid (not undefined, null, or empty string)
    const isValid = (val) => val !== undefined && val !== null && val.toString().trim() !== '';

    if (isValid(filters.gender)) {
      query += ' AND p.gender = ?';
      params.push(filters.gender);
    }

    if (isValid(filters.ageMin)) {
      query += ' AND TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) >= ?';
      params.push(Number(filters.ageMin));
    }

    if (isValid(filters.ageMax)) {
      query += ' AND TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) <= ?';
      params.push(Number(filters.ageMax));
    }

    if (isValid(filters.qualification)) {
      query += ' AND p.qualification LIKE ?';
      params.push(`%${filters.qualification}%`);
    }

    if (isValid(filters.caste)) {
      query += ' AND p.caste = ?';
      params.push(filters.caste);
    }

    if (isValid(filters.incomeMin)) {
      const minIncome = Number(filters.incomeMin);
      if (!isNaN(minIncome)) {
        query += ' AND p.monthly_income >= ?';
        params.push(minIncome);
      }
    }

    if (isValid(filters.birthplace)) {
      query += ' AND p.birthplace LIKE ?';
      params.push(`%${filters.birthplace}%`);
    }

    // Add logging for debugging
    console.log('[FILTER_DEBUG] Generated Query:', query.replace(/\s+/g, ' ').trim());
    console.log('[FILTER_DEBUG] Query Params:', params);

    try {
      const [rows] = await db.execute(query, params);
      console.log("resukt", rows);

      return rows;
    } catch (error) {
      console.error('[FILTER_ERROR] SQL execution failed:', error.message);
      console.error('[FILTER_ERROR] Failed Query:', query);
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

    console.log(`[SQL_DEBUG] Fetching profiles for userId: ${currentUserId}, Page: ${page}, Limit: ${limit}`);

    // Optimized SQL using subquery for invitation status to comply with ONLY_FULL_GROUP_BY
    // Mapping: Accepted -> Connected, Pending -> Pending, else None.
    let query = `
      SELECT 
        p.*,
        u.is_subscribed,
        u.mobile_number,
        TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
        CASE 
          WHEN inv.status = 'Accepted' THEN 'Connected'
          WHEN inv.status = 'Pending' THEN 'Pending'
          ELSE 'None'
        END AS invitation_status
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

    const params = [currentUserId, currentUserId, currentUserId];

    if (minAge !== null && !isNaN(minAge)) {
      query += ` AND TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) >= ?`;
      params.push(minAge);
    }
    if (maxAge !== null && !isNaN(maxAge)) {
      query += ` AND TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) <= ?`;
      params.push(maxAge);
    }

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    try {
      // Use db.query instead of db.execute for better LIMIT ? OFFSET ? compatibility 
      // in some MySQL environments/prepared statements.
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      console.error('[SQL_ERROR] getLatest failed:', error.message);
      console.error('[SQL_ERROR] Query:', query.replace(/\s+/g, ' ').trim());
      console.error('[SQL_ERROR] Params:', params);
      throw error;
    }
  },

  getSuggested: async (userId) => {
    // Get current user's profile to match against
    const [userProfileRows] = await db.execute('SELECT * FROM profiles WHERE user_id = ?', [userId]);
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
      userProfile.caste || '',
      userProfile.birthplace || '',
      age - 5,
      age + 5
    ]);
    return rows;
  },

  update: async (userId, data) => {
    const validData = filterValidData(data);
    const fields = Object.keys(validData);
    const values = Object.values(validData);

    if (fields.length === 0) return false;

    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const query = `UPDATE profiles SET ${setClause} WHERE user_id = ?`;
    const [result] = await db.execute(query, [...values, userId]);
    return result.affectedRows > 0;
  }
};

module.exports = Profile;
