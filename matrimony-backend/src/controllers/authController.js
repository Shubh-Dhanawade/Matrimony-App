const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authController = {
  register: async (req, res) => {
    try {
      const { mobileNumber, password, role = "user" } = req.body;
      console.log(
        `Registration attempt for: ${mobileNumber}, Role requested: ${role}`,
      );

      if (!mobileNumber || !password) {
        return res
          .status(400)
          .json({ message: "Mobile number and password are required" });
      }

      const existingUser = await User.findByMobile(mobileNumber);
      if (existingUser) {
        console.log(`Registration failed: User ${mobileNumber} already exists`);
        return res.status(400).json({ message: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = await User.create(mobileNumber, hashedPassword, role);
      const tokenVersion = 0;

      const token = jwt.sign(
        { id: userId, role: role, tokenVersion: tokenVersion },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" },
      );

      console.log(
        `Registration successful for: ${mobileNumber}, User ID: ${userId}`,
      );

      res.status(201).json({
        token,
        user: { id: userId, mobileNumber, role, is_subscribed: 0, is_paid: 0 },
      });
    } catch (error) {
      console.error("Registration error:", error);
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
        return res.status(400).json({ message: "Invalid credentials" });
      }

      console.log(
        `User found: ${user.mobile_number}, hashed password from DB: ${user.password.substring(0, 10)}...`,
      );

      const isMatch = await bcrypt.compare(password, user.password);
      console.log(`Password match result: ${isMatch}`);

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      if (user.account_status === "deleted") {
        return res.status(403).json({
          message: "Your account has been deleted. Please contact support.",
        });
      }

      if (user.is_blocked) {
        console.log(`Login failed: User ${mobileNumber} is blocked`);
        return res
          .status(403)
          .json({ message: "Your account has been blocked by admin" });
      }

      // Record last login timestamp
      await User.updateLastLogin(user.id);

      const token = jwt.sign(
        { id: user.id, role: user.role, tokenVersion: user.token_version },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" },
      );

      console.log(`Login successful for: ${mobileNumber}, Role: ${user.role}`);

      res.json({
        token,
        user: {
          id: user.id,
          mobileNumber: user.mobile_number,
          role: user.role,
          is_subscribed: user.is_subscribed,
          is_paid: user.is_paid,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getMe: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        user: {
          id: user.id,
          mobileNumber: user.mobile_number,
          role: user.role,
          is_subscribed: user.is_subscribed,
          is_paid: user.is_paid,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  requestUpgrade: async (req, res) => {
    try {
      const userId = req.user.id;
      const db = require("../config/db");
      
      // Update is_subscribed flag
      await db.execute("UPDATE users SET is_subscribed = 1 WHERE id = ?", [
        userId,
      ]);
      
      res.json({ 
        message: "Payment request submitted successfully",
        success: true
      });
    } catch (error) {
      console.error("Upgrade request error:", error);
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = authController;
