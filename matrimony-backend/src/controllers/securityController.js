const User = require("../models/User");
const Profile = require("../models/Profile");

const securityController = {
  getSecurityStatus: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const profile = await Profile.findByUserId(req.user.id);
      
      res.json({
        lastLogin: user.last_login,
        accountStatus: user.account_status,
        privacySetting: profile?.privacy_setting || 'Public'
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  logoutAll: async (req, res) => {
    try {
      await User.incrementTokenVersion(req.user.id);
      res.json({ message: "Logged out from all other devices successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteAccount: async (req, res) => {
    try {
      await User.softDelete(req.user.id);
      // Also invalidate token by incrementing token_version
      await User.incrementTokenVersion(req.user.id);
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updatePrivacy: async (req, res) => {
    try {
      const { setting } = req.body;
      const validSettings = ['Public', 'Only Connected Users', 'Paid Members Only'];
      
      if (!validSettings.includes(setting)) {
        return res.status(400).json({ message: "Invalid privacy setting" });
      }

      await Profile.updatePrivacySetting(req.user.id, setting);
      res.json({ message: "Privacy setting updated successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  blockUser: async (req, res) => {
    try {
      const { userIdToBlock, reason } = req.body;
      if (!userIdToBlock) {
        return res.status(400).json({ message: "User ID to block is required" });
      }

      await Profile.blockUser(req.user.id, userIdToBlock, reason);
      res.json({ message: "User blocked successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  unblockUser: async (req, res) => {
    try {
      const { userIdToUnblock } = req.body;
      if (!userIdToUnblock) {
        return res.status(400).json({ message: "User ID to unblock is required" });
      }

      await Profile.unblockUser(req.user.id, userIdToUnblock);
      res.json({ message: "User unblocked successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getBlockedUsers: async (req, res) => {
    try {
      const blockedUsers = await Profile.getBlockedUsers(req.user.id);
      res.json({ blockedUsers });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = securityController;
