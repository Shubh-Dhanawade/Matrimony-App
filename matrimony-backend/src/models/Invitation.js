const db = require("../config/db");

const Invitation = {
  send: async (senderId, receiverId) => {
    // Check if sender already sent to this receiver
    const [existing] = await db.execute(
      "SELECT * FROM invitations WHERE sender_id = ? AND receiver_id = ?",
      [senderId, receiverId],
    );
    if (existing.length > 0) throw new Error("Invitation already sent");

    // Check if the OTHER person already sent a pending interest to me (mutual interest!)
    const [reverse] = await db.execute(
      "SELECT * FROM invitations WHERE sender_id = ? AND receiver_id = ? AND LOWER(status) = 'pending'",
      [receiverId, senderId],
    );

    if (reverse.length > 0) {
      // Mutual interest detected — auto-accept both sides
      console.log(`[MUTUAL_INTEREST] Auto-accepting: ${senderId} <-> ${receiverId}`);
      // Accept the existing reverse invitation
      await db.execute(
        "UPDATE invitations SET status = 'accepted' WHERE id = ?",
        [reverse[0].id],
      );
      // Insert new invitation as accepted too
      const [result] = await db.execute(
        "INSERT INTO invitations (sender_id, receiver_id, status) VALUES (?, ?, 'accepted')",
        [senderId, receiverId],
      );
      return result.insertId;
    }

    // Normal case: insert as pending
    const [result] = await db.execute(
      "INSERT INTO invitations (sender_id, receiver_id, status) VALUES (?, ?, ?)",
      [senderId, receiverId, 'pending'],
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
    const normalizedStatus = status.toLowerCase(); // Requirement 3: Lowercase status
    const [result] = await db.execute(
      "UPDATE invitations SET status = ? WHERE id = ? AND receiver_id = ?",
      [normalizedStatus, invitationId, receiverId],
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
