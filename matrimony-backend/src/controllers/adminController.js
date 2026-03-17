const db = require('../config/db');

const adminController = {
  getDashboardStats: async (req, res) => {
    try {
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role != 'admin') as totalUsers,
          (SELECT COUNT(*) FROM profiles) as totalProfiles,
          (SELECT COUNT(*) FROM profiles WHERE status = 'Pending') as pendingProfiles,
          (SELECT COUNT(*) FROM profiles WHERE status = 'Approved') as approvedProfiles,
          (SELECT COUNT(*) FROM profiles WHERE status = 'Rejected') as rejectedProfiles,
          (SELECT COUNT(*) FROM users WHERE role != 'admin' AND is_paid = 1) as totalPaidUsers,
          (SELECT COUNT(*) FROM users WHERE role != 'admin' AND is_paid = 0) as totalUnpaidUsers
      `;

      const [rows] = await db.execute(query);
      const stats = rows[0];

      res.json(stats);
    } catch (error) {
      console.error('getDashboardStats Error:', error);
      res.status(500).json({
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  },

  getAllProfiles: async (req, res) => {
    try {
      const { status } = req.query;
      let query = 'SELECT p.*, u.mobile_number FROM profiles p JOIN users u ON p.user_id = u.id';
      const params = [];

      if (status) {
        query += ' WHERE p.status = ?';
        params.push(status);
      }

      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updateProfileStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const [result] = await db.execute(
        'UPDATE profiles SET status = ? WHERE id = ?',
        [status, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      res.json({ message: `Profile status updated to ${status}` });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },


  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Check if user is trying to delete an admin
      const [userRows] = await db.execute('SELECT role FROM users WHERE id = ?', [id]);

      if (userRows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (userRows[0].role === 'admin') {
        return res.status(403).json({ message: 'Cannot delete an administrator account' });
      }

      // 2. Explicitly delete related records to avoid foreign key constraint errors
      try {
        await db.execute('DELETE FROM shortlists WHERE user_id = ? OR profile_user_id = ?', [id, id]);
      } catch (err) { /* ignore if table doesn't exist */ }

      try {
        await db.execute('DELETE FROM invitations WHERE sender_id = ? OR receiver_id = ?', [id, id]);
      } catch (err) { /* ignore */ }

      try {
        await db.execute('DELETE FROM multiple_profile_images WHERE user_id = ?', [id]);
      } catch (err) { /* ignore */ }

      try {
        await db.execute('DELETE FROM profiles WHERE user_id = ?', [id]);
      } catch (err) { /* ignore */ }

      // 3. Delete the user
      const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        message: 'User and all related data deleted permanently',
        deletedId: id
      });

    } catch (error) {
      console.error('deleteUser Error:', error);
      res.status(500).json({
        message: 'Failed to delete user',
        error: error.message
      });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const { search = '', is_paid, profile_status } = req.query;

      let query = `
      SELECT 
        u.id,
        u.mobile_number,
        u.role,
        u.is_blocked,
        u.is_paid,
        u.created_at,
        p.full_name,
        p.address,
        p.birthplace,
        p.status AS profile_status,
        p.avatar_url,
        p.gender
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.role != 'admin'
    `;

      let params = [];

      if (search) {
        query += ` AND (u.mobile_number LIKE ? OR p.full_name LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      if (is_paid !== undefined && is_paid !== '') {
        query += ` AND u.is_paid = ?`;
        params.push(is_paid === 'true' || is_paid === '1' ? 1 : 0);
      }

      if (profile_status) {
        query += ` AND p.status = ?`;
        params.push(profile_status);
      }

      query += ` ORDER BY u.created_at DESC`;

      const [rows] = await db.execute(query, params);

      res.json(rows);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },

  toggleBlockUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { is_blocked } = req.body;

      const [result] = await db.execute(
        'UPDATE users SET is_blocked = ? WHERE id = ?',
        [is_blocked, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: `User ${is_blocked ? 'blocked' : 'unblocked'} successfully` });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  togglePaidStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { is_paid } = req.body;

      const [result] = await db.execute(
        'UPDATE users SET is_paid = ? WHERE id = ?',
        [is_paid ? 1 : 0, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: `User membership status updated to ${is_paid ? 'Paid' : 'Unpaid'}` });
    } catch (error) {
      console.error('togglePaidStatus Error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  resetProfile: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user exists
      const [userRows] = await db.execute('SELECT id FROM users WHERE id = ?', [id]);
      if (userRows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Explicitly delete related profile records
      try { await db.execute('DELETE FROM shortlists WHERE user_id = ? OR profile_user_id = ?', [id, id]); } catch (err) { }
      try { await db.execute('DELETE FROM invitations WHERE sender_id = ? OR receiver_id = ?', [id, id]); } catch (err) { }
      try { await db.execute('DELETE FROM multiple_profile_images WHERE user_id = ?', [id]); } catch (err) { }
      
      const [result] = await db.execute('DELETE FROM profiles WHERE user_id = ?', [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'No profile found to reset for this user' });
      }

      res.json({ message: 'Profile reset successfully. User will need to create a new profile.' });
    } catch (error) {
      console.error('resetProfile Error:', error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = adminController;
