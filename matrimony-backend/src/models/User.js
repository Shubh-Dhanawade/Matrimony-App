const db = require('../config/db');

const User = {
  findByMobile: async (mobileNumber) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE mobile_number = ?', [mobileNumber]);
    return rows[0];
  },

  create: async (mobileNumber, hashedPassword) => {
    const [result] = await db.execute(
      'INSERT INTO users (mobile_number, password) VALUES (?, ?)',
      [mobileNumber, hashedPassword]
    );
    return result.insertId;
  },

  findById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }
};

module.exports = User;
