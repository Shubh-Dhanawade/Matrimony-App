const Invitation = require('../models/Invitation');
const User = require('../models/User');

const invitationController = {
  sendInvitation: async (req, res) => {
    try {
      const { receiverId } = req.body;
      const senderId = req.user.id;

      if (!receiverId) {
        return res.status(400).json({ message: 'Receiver ID is required' });
      }

      if (senderId == receiverId) {
        return res.status(400).json({ message: 'You cannot send invitation to yourself' });
      }

      // Check if receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: 'Receiver user not found' });
      }

      await Invitation.send(senderId, receiverId);
      res.status(201).json({ message: 'Invitation sent successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { invitationId, status } = req.body; // status: 'Accepted' or 'Rejected'
      const receiverId = req.user.id;

      const success = await Invitation.updateStatus(invitationId, status, receiverId);
      if (!success) {
        return res.status(400).json({ message: 'Failed to update invitation status' });
      }

      res.json({ message: `Invitation ${status.toLowerCase()} successfully` });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getInvitations: async (req, res) => {
    try {
      const userId = req.user.id;
      const sent = await Invitation.getSent(userId);
      const received = await Invitation.getReceived(userId);
      res.json({ sent, received });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = invitationController;
