const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = {
  register: async (req, res) => {
    try {
      const { mobileNumber, password, role = 'user' } = req.body;
      console.log(`Registration attempt for: ${mobileNumber}, Role requested: ${role}`);

      if (!mobileNumber || !password) {
        return res.status(400).json({ message: 'Mobile number and password are required' });
      }

      const existingUser = await User.findByMobile(mobileNumber);
      if (existingUser) {
        console.log(`Registration failed: User ${mobileNumber} already exists`);
        return res.status(400).json({ message: 'User already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = await User.create(mobileNumber, hashedPassword, role);

      const token = jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

      console.log(`Registration successful for: ${mobileNumber}, User ID: ${userId}`);

      res.status(201).json({
        token,
        user: { id: userId, mobileNumber, role }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { mobileNumber, password } = req.body;
      console.log(`Login attempt for: ${mobileNumber}`);

      const user = await User.findByMobile(mobileNumber);
      if (!user) {
        console.log(`Login failed: User ${mobileNumber} not found`);
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      console.log(`User found: ${user.mobile_number}, hashed password from DB: ${user.password.substring(0, 10)}...`);

      const isMatch = await bcrypt.compare(password, user.password);
      console.log(`Password match result: ${isMatch}`);

      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      if (user.is_blocked) {
        console.log(`Login failed: User ${mobileNumber} is blocked`);
        return res.status(403).json({ message: 'Your account has been blocked by admin' });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

      console.log(`Login successful for: ${mobileNumber}, Role: ${user.role}`);

      res.json({
        token,
        user: { id: user.id, mobileNumber: user.mobile_number, role: user.role }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: error.message });
    }
  },

  simulateUpgrade: async (req, res) => {
    try {
      const userId = req.user.id;
      // Assuming 'db' is available in this scope, e.g., imported or passed
      // For this example, we'll assume it's available.
      // In a real application, you might import it or pass it via middleware context.
      const db = require('../config/db'); // Added for context, assuming db is available
      await db.execute('UPDATE users SET is_subscribed = 1 WHERE id = ?', [userId]);
      const [rows] = await db.execute('SELECT id, mobile_number, role, is_blocked, is_subscribed FROM users WHERE id = ?', [userId]);
      res.json({ message: 'Upgraded successfully', user: rows[0] });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = authController;
