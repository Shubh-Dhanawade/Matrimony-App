const Profile = require('../models/Profile');

const profileController = {
  createOrUpdate: async (req, res) => {
    try {
      const userId = req.user.id;
      const data = { ...req.body };

      // Handle monthly_income numeric conversion
      if (data.monthly_income !== undefined) {
        if (data.monthly_income === '' || data.monthly_income === null) {
          data.monthly_income = 0;
        } else {
          const income = Number(data.monthly_income);
          if (isNaN(income)) {
            return res.status(400).json({ message: 'Invalid monthly income value' });
          }
          data.monthly_income = income;
        }
      }

      const profileData = { ...data, user_id: userId };

      // Check if profile exists
      const existing = await Profile.findByUserId(userId);
      if (existing) {
        // Implementation for update could be added here
        return res.status(400).json({ message: 'Profile already exists' });
      }

      await Profile.create(profileData);
      res.status(201).json({ message: 'Profile created successfully' });
      console.log(profileData);

    } catch (error) {
      res.status(500).json({ message: error.message });
      console.log(error);

    }
  },

  getProfiles: async (req, res) => {
    try {
      const filters = req.query;
      const currentUserId = req.user.id;
      console.log(`Fetching all profiles for user ${currentUserId} with filters:`, filters);
      const profiles = await Profile.getAll(currentUserId, filters);
      console.log(`Found ${profiles.length} profiles`);
      res.json(profiles);
    } catch (error) {
      console.error('Error in getProfiles:', error);
      res.status(500).json({ message: error.message });
    }
  },

  getMyProfile: async (req, res) => {
    try {
      console.log(`Fetching profile for current user: ${req.user.id}`);
      const profile = await Profile.findByUserId(req.user.id);
      console.log(`Profile found: ${!!profile}`);
      res.json({ profile, hasProfile: !!profile });
    } catch (error) {
      console.error('Error in getMyProfile:', error);
      res.status(500).json({ message: error.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const data = { ...req.body };

      // Handle monthly_income numeric conversion
      if (data.monthly_income !== undefined) {
        if (data.monthly_income === '' || data.monthly_income === null) {
          data.monthly_income = 0;
        } else {
          const income = Number(data.monthly_income);
          if (isNaN(income)) {
            return res.status(400).json({ message: 'Invalid monthly income value' });
          }
          data.monthly_income = income;
        }
      }

      const success = await Profile.update(userId, data);
      if (!success) return res.status(404).json({ message: 'Profile not found' });

      const updatedProfile = await Profile.findByUserId(userId);
      res.json({
        message: 'Profile updated successfully',
        profile: updatedProfile
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getSuggestedMatches: async (req, res) => {
    try {
      console.log(`Fetching suggested matches for user: ${req.user.id}`);
      const profiles = await Profile.getSuggested(req.user.id);
      console.log(`Found ${profiles.length} suggested profiles`);
      res.json(profiles);
    } catch (error) {
      console.error('Error in getSuggestedMatches:', error);
      res.status(500).json({ message: error.message });
    }
  },

  getProfileById: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Fetching profile for user ID: ${id}`);
      const profile = await Profile.findByUserId(id);
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      res.json({ profile });
    } catch (error) {
      console.error('Error in getProfileById:', error);
      res.status(500).json({ message: error.message });
    }
  },

  uploadImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      res.status(200).json({
        message: 'Image uploaded successfully',
        imageUrl: `uploads/${req.file.filename}`, // Return relative path
        filename: req.file.filename
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getLatestProfiles: async (req, res) => {
    try {
      const currentUserId = req.user.id;
      // Extract filters from query parameters
      const {
        page = 1,
        limit = 10,
        minAge,
        maxAge
      } = req.query;

      console.log(`[FEED] Fetching latest profiles for user ${currentUserId}`);

      const profiles = await Profile.getLatest(currentUserId, {
        page: Number(page),
        limit: Number(limit),
        minAge,
        maxAge
      });

      console.log(`[FEED] Found ${profiles.length} profiles`);

      res.status(200).json(profiles);
    } catch (error) {
      console.error('[FEED_ERROR] Failed to fetch latest profiles:', error);
      res.status(500).json({
        message: 'Internal server error while fetching profiles feed',
        error: error.message
      });
    }
  },

  sendInterest: async (req, res) => {
    // This can reuse invitation logic or be a specific "interest" table
    // For now, let's reuse sendInvitation logic as requested
    return invitationController.sendInvitation(req, res);
  },

  ignoreProfile: async (req, res) => {
    try {
      const { receiverId } = req.body;
      const senderId = req.user.id;
      // In a real app, we'd have an 'ignores' table. 
      // For this demo, we'll just return success to unblock UI.
      res.json({ message: 'Profile ignored' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = profileController;
