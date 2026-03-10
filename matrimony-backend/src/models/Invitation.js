const db = require("../config/db");

const Invitation = {
  send: async (senderId, receiverId) => {
    const [existing] = await db.execute(
      "SELECT * FROM invitations WHERE sender_id = ? AND receiver_id = ?",
      [senderId, receiverId],
    );
    if (existing.length > 0) throw new Error("Invitation already sent");

    const [result] = await db.execute(
      "INSERT INTO invitations (sender_id, receiver_id) VALUES (?, ?)",
      [senderId, receiverId],
    );
    return result.insertId;
  },

  cancel: async (user1, user2) => {
    const [result] = await db.execute(
      "DELETE FROM invitations WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
      [user1, user2, user2, user1]
    );
    return result.affectedRows > 0;
  },

  updateStatus: async (invitationId, status, receiverId) => {
    const [result] = await db.execute(
      "UPDATE invitations SET status = ? WHERE id = ? AND receiver_id = ?",
      [status, invitationId, receiverId],
    );
    return result.affectedRows > 0;
  },

  getReceived: async (userId) => {
    const [rows] = await db.execute(
      `SELECT i.*, 
              COALESCE(p.full_name, 'User') as full_name, 
              p.avatar_url, 
              p.user_id as other_user_id,
              TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
              p.marital_status
       FROM invitations i 
       LEFT JOIN profiles p ON i.sender_id = p.user_id 
       WHERE i.receiver_id = ?
         AND (p.status = 'Approved' OR p.id IS NULL)`,
      [userId],
    );
    return rows;
  },

  getSent: async (userId) => {
    const [rows] = await db.execute(
      `SELECT i.*, 
              COALESCE(p.full_name, 'User') as full_name, 
              p.avatar_url, 
              p.user_id as other_user_id,
              TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age,
              p.marital_status
       FROM invitations i 
       LEFT JOIN profiles p ON i.receiver_id = p.user_id 
       WHERE i.sender_id = ?
         AND (p.status = 'Approved' OR p.id IS NULL)`,
      [userId],
    );
    return rows;
  },
};

module.exports = Invitation;
