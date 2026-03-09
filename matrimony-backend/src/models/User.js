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
};

module.exports = User;
