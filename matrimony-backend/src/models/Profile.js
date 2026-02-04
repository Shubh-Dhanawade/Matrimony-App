const db = require('../config/db');

const allowedColumns = [
  'user_id', 'full_name', 'father_name', 'mother_maiden_name', 'dob', 'gender',
  'marital_status', 'address', 'birthplace', 'qualification', 'occupation',
  'monthly_income', 'caste', 'sub_caste', 'relative_surname', 'expectations',
  'avatar_url', 'other_comments'
];

const filterValidData = (data) => {
  const filtered = {};
  Object.keys(data).forEach(key => {
    if (allowedColumns.includes(key)) {
      filtered[key] = data[key];
    }
  });
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
    let query = `
      SELECT p.*, u.mobile_number, TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age 
      FROM profiles p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.user_id != ?`;
    const params = [currentUserId];

    if (filters.gender) {
      query += ' AND gender = ?';
      params.push(filters.gender);
    }

    if (filters.ageMin) {
      query += ' AND TIMESTAMPDIFF(YEAR, dob, CURDATE()) >= ?';
      params.push(filters.ageMin);
    }
    if (filters.ageMax) {
      query += ' AND TIMESTAMPDIFF(YEAR, dob, CURDATE()) <= ?';
      params.push(filters.ageMax);
    }
    if (filters.qualification) {
      query += ' AND qualification LIKE ?';
      params.push(`%${filters.qualification}%`);
    }
    if (filters.caste) {
      query += ' AND caste = ?';
      params.push(filters.caste);
    }
    if (filters.incomeMin) {
      query += ' AND monthly_income >= ?';
      params.push(filters.incomeMin);
    }

    const [rows] = await db.execute(query, params);
    return rows;
  },

  getSuggested: async (userId) => {
    // Get current user's profile to match against
    const [userProfileRows] = await db.execute('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    if (userProfileRows.length === 0) return [];
    
    const userProfile = userProfileRows[0];
    const age = userProfile.dob ? (new Date().getFullYear() - new Date(userProfile.dob).getFullYear()) : 30;

    const query = `
      SELECT p.*, TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age 
      FROM profiles p 
      WHERE p.user_id != ? 
      AND (
        p.caste = ? 
        OR p.birthplace = ? 
        OR (TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) BETWEEN ? AND ?)
      )
      LIMIT 10`;
    
    const [rows] = await db.execute(query, [
      userId, 
      userProfile.caste, 
      userProfile.birthplace, 
      age - 5, age + 5
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
