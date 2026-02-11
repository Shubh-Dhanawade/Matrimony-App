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
      res.json({ message: 'Profile updated successfully' });
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
  
  uploadImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Generate the full URL for the uploaded file
      // In production, this would be a cloud storage URL
      const host = req.get('host');
      const protocol = req.protocol;
      const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

      res.status(200).json({ 
        message: 'Image uploaded successfully',
        imageUrl: imageUrl,
        filename: req.file.filename
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = profileController;
