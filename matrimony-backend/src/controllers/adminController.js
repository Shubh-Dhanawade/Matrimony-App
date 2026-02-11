const db = require('../config/db');

const adminController = {
  getDashboardStats: async (req, res) => {
    try {
      // Get total users
      const [userRows] = await db.execute('SELECT COUNT(*) as count FROM users');
      const totalUsers = userRows[0].count;

      // Get total profiles
      const [profileRows] = await db.execute('SELECT COUNT(*) as count FROM profiles');
      const totalProfiles = profileRows[0].count;

      // Check if status column exists in profiles table
      const [columns] = await db.execute("SHOW COLUMNS FROM invitations LIKE 'status'");

      let pendingProfiles = 0;
      let approvedProfiles = 0;

      if (columns.length > 0) {
        // Query for statuses only if the column exists
        const [pendingRows] = await db.execute("SELECT COUNT(*) as count FROM invitations WHERE status = 'Pending'");
        pendingProfiles = pendingRows[0].count;

        // Correct ENUM value is 'Approved', not 'Accepted'
        const [approvedRows] = await db.execute("SELECT COUNT(*) as count FROM invitations WHERE status = 'Accepted'");
        approvedProfiles = approvedRows[0].count;
      }

      res.json({
        totalUsers,
        totalProfiles,
        pendingProfiles,
        approvedProfiles,
        _debug: { hasStatusColumn: columns.length > 0 }
      });
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

  getAllUsers: async (req, res) => {
    try {
      const { search = '' } = req.query;

      let query = `
      SELECT 
        u.id,
        u.mobile_number,
        u.role,
        u.is_blocked,
        u.created_at,
        p.full_name,
        p.address,
        p.birthplace
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.role != 'admin'
    `;

      let params = [];

      if (search) {
        query += ` AND (u.mobile_number LIKE ? OR p.full_name LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
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
  updateProfileStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      await db.execute(
        'UPDATE profiles SET status = ? WHERE id = ?',
        [status, id]
      );

      res.json({ message: 'Profile status updated successfully' });

    } catch (error) {
      console.error(error);
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

      // 2. Delete the user (cascading will handle profiles and invitations)
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
  }
};

module.exports = adminController;
