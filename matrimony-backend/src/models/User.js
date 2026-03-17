const db = require("../config/db");

const User = {
  findByMobile: async (mobileNumber) => {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE mobile_number = ?",
      [mobileNumber],
    );
    return rows[0];
  },

  create: async (mobileNumber, hashedPassword, role = "user") => {
    const [result] = await db.execute(
      "INSERT INTO users (mobile_number, password, role) VALUES (?, ?, ?)",
      [mobileNumber, hashedPassword, role],
    );
    return result.insertId;
  },

  findById: async (id) => {
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  },

  updateSubscription: async (id, isSubscribed) => {
    const [result] = await db.execute(
      "UPDATE users SET is_subscribed = ? WHERE id = ?",
      [isSubscribed ? 1 : 0, id],
    );
    return result.affectedRows > 0;
  },

  updateLastLogin: async (id) => {
    const [result] = await db.execute(
      "UPDATE users SET last_login = NOW() WHERE id = ?",
      [id],
    );
    return result.affectedRows > 0;
  },

  softDelete: async (id) => {
    const [result] = await db.execute(
      "UPDATE users SET account_status = 'deleted' WHERE id = ?",
      [id],
    );
    return result.affectedRows > 0;
  },

  incrementTokenVersion: async (id) => {
    const [result] = await db.execute(
      "UPDATE users SET token_version = token_version + 1 WHERE id = ?",
      [id],
    );
    return result.affectedRows > 0;
  },

  deleteById: async (id) => {
    // Cascade delete will handle profiles, invitations, shortlists, etc.
    const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },
};

module.exports = User;
