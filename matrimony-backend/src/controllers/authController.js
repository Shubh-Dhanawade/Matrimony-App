const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = {
  register: async (req, res) => {
    console.log(req.body);
    console.log(res);
    
    
    try {
      const { mobileNumber, password } = req.body;

      // if (!mobileNumber || !password) {
      //   return res.status(400).json({ message: 'Mobile number and password are required' });
      // }

      // const existingUser = await User.findByMobile(mobileNumber);
      // console.log(existingUser);
      
      // if (existingUser) {
      //   return res.status(400).json({ message: 'User already exists' });
      // }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = await User.create(mobileNumber, hashedPassword);

      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
console.log(token);
console.log(res.status);

      res.status(201).json({
        token,
        user: { id: userId, mobileNumber }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
      console.log(error);
      
    }
  },

  login: async (req, res) => {
    try {
      const { mobileNumber, password } = req.body;

      const user = await User.findByMobile(mobileNumber);
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

      res.json({
        token,
        user: { id: user.id, mobileNumber: user.mobile_number }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = authController;
