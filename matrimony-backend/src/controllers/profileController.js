const Profile = require("../models/Profile");
const ProfileImage = require("../models/ProfileImage");
const Invitation = require("../models/Invitation");
const Shortlist = require("../models/Shortlist");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");
const { optimizeImage } = require("../utils/imageOptimizer");

const profileController = {
  createOrUpdate: async (req, res) => {
    try {
      const userId = req.user.id;
      const data = { ...req.body };

      // ── Required fields guard ─────────────────────────────────────────
      const REQUIRED = [
        "full_name",
        "dob",
        "age",
        "gender",
        "marital_status",
        "occupation",
        "caste",
        "address",
      ];
      const missing = REQUIRED.filter(
        (f) => !data[f] || String(data[f]).trim() === "",
      );
      if (missing.length > 0) {
        return res.status(400).json({
          message: `Please fill all required fields: ${missing.join(", ")}`,
          missingFields: missing,
        });
      }

      // Handle monthly_income numeric conversion
      if (data.monthly_income !== undefined) {
        if (data.monthly_income === "" || data.monthly_income === null) {
          data.monthly_income = 0;
        } else {
          const income = Number(data.monthly_income);
          if (isNaN(income)) {
            return res
              .status(400)
              .json({ message: "Invalid monthly income value" });
          }
          data.monthly_income = income;
        }
      }

      const profileData = { ...data, user_id: userId };

      // Check if profile exists
      const existing = await Profile.findByUserId(userId);
      if (existing) {
        // Implementation for update could be added here
        return res.status(400).json({ message: "Profile already exists" });
      }

      await Profile.create(profileData);
      res.status(201).json({ message: "Profile created successfully" });
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
      console.log(
        `Fetching all profiles for user ${currentUserId} with filters:`,
        filters,
      );
      const profiles = await Profile.getAll(currentUserId, filters);
      console.log(`Found ${profiles.length} profiles`);
      res.json(profiles);
    } catch (error) {
      console.error("Error in getProfiles:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getMyProfile: async (req, res) => {
    try {
      console.log(`Fetching profile for current user: ${req.user.id}`);
      
      // Re-fetch user to get latest premium flags
      const user = await User.findById(req.user.id);
      const profile = await Profile.findByUserId(req.user.id);
      
      const isPaid = Number(user?.is_paid) === 1;

      res.json({ 
        profile, 
        hasProfile: !!profile,
        is_paid: isPaid,
        is_premium: isPaid,
        premium_end_date: user?.premium_end_date
      });
    } catch (error) {
      console.error("Error in getMyProfile:", error);
      res.status(500).json({ message: error.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const data = { ...req.body };

      // ── Required fields guard ─────────────────────────────────────────
      const REQUIRED = [
        "full_name",
        "dob",
        "age",
        "gender",
        "marital_status",
        "occupation",
        "caste",
        "address",
      ];
      const missing = REQUIRED.filter(
        (f) => !data[f] || String(data[f]).trim() === "",
      );
      if (missing.length > 0) {
        return res.status(400).json({
          message: `Please fill all required fields: ${missing.join(", ")}`,
          missingFields: missing,
        });
      }

      // Handle monthly_income numeric conversion
      if (data.monthly_income !== undefined) {
        if (data.monthly_income === "" || data.monthly_income === null) {
          data.monthly_income = 0;
        } else {
          const income = Number(data.monthly_income);
          if (isNaN(income)) {
            return res
              .status(400)
              .json({ message: "Invalid monthly income value" });
          }
          data.monthly_income = income;
        }
      }

      const success = await Profile.update(userId, data);
      if (!success)
        return res.status(404).json({ message: "Profile not found" });

      const updatedProfile = await Profile.findByUserId(userId);
      res.json({
        message: "Profile updated successfully",
        profile: updatedProfile,
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
      console.error("Error in getSuggestedMatches:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getProfileById: async (req, res) => {
    try {
      const { id } = req.params;
      const viewerId = req.user.id;
      console.log(`[PROFILE_VIEW] Fetching profile ID: ${id}, Viewer: ${viewerId}`);

      // Fetch viewer's user record to check paid status
      const viewerUser = await User.findById(viewerId);
      const isPaid = Number(viewerUser?.is_paid) === 1;

      // Fetch the profile with bidirectional invitation_status
      const profile = await Profile.findByUserId(id, viewerId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      const isOwnProfile = String(viewerId) === String(id);

      // invitation_status comes from Profile.findByUserId subquery (already bidirectional)
      // Also handle mutual interest: if BOTH have sent pending, treat as connected
      const rawStatus = (profile.invitation_status || "none").toLowerCase();
      const isConnected = rawStatus === "accepted" || rawStatus === "mutual";

      console.log(`[PROFILE_VIEW_LOG] ID: ${id}, Viewer: ${viewerId}, isPaid: ${isPaid}, DBStatus: ${rawStatus}, isConnected: ${isConnected}`);

      if (!isOwnProfile) {
        // Block unapproved profiles from non-owners
        if (profile.status !== "Approved") {
          return res.status(404).json({ message: "Profile not found" });
        }

        // Strict Policy: BOTH paid AND connected (accepted interest in either direction)
        if (!isPaid || !isConnected) {
          return res.status(403).json({ 
            message: !isPaid 
              ? "Premium Membership Required. Upgrade to view full profiles." 
              : "You need to connect to view full profile",
            access_denied: true,
            is_paid: isPaid,
            is_connected: isConnected,
            invitation_status: rawStatus
          });
        }
      }

      // Return profile with explicit flags for the frontend
      res.json({ 
        profile,
        is_paid: isPaid,
        is_premium: isPaid,
        premium_end_date: viewerUser?.premium_end_date,
        is_connected: isConnected,
        invitation_status: rawStatus
      });
    } catch (error) {
      console.error("Error in getProfileById:", error);
      res.status(500).json({ message: error.message });
    }
  },

  uploadImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Optimization: Post-processing to shrink and orient
      await optimizeImage(req.file.path);

      res.status(200).json({
        message: "Image uploaded successfully",
        imageUrl: `uploads/${req.file.filename}`, // Return relative path
        filename: req.file.filename,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  uploadBiodata: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const relativePath = `uploads/biodata/${req.file.filename}`;
      res.status(200).json({
        message: "Biodata uploaded successfully",
        biodataUrl: relativePath,
        filename: req.file.filename,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  uploadKundali: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const relativePath = `uploads/kundali/${req.file.filename}`;
      res.status(200).json({
        message: "Kundali uploaded successfully",
        kundaliUrl: relativePath,
        filename: req.file.filename,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  uploadBiodata: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const relativePath = `uploads/biodata/${req.file.filename}`;
      res.status(200).json({
        message: 'Biodata uploaded successfully',
        biodataUrl: relativePath,
        filename: req.file.filename
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  uploadKundali: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const relativePath = `uploads/kundali/${req.file.filename}`;
      res.status(200).json({
        message: 'Kundali uploaded successfully',
        kundaliUrl: relativePath,
        filename: req.file.filename
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getLatestProfiles: async (req, res) => {
    try {
      const currentUserId = req.user.id;
      const { minAge, maxAge } = req.query;

      console.log(`[FEED] Fetching all profiles for user ${currentUserId}`);

      // Use a high limit to get all profiles at once.
      // Pagination is handled client-side via index navigation.
      const { rows } = await Profile.getLatest(currentUserId, {
        page: 1,
        limit: 100,
        minAge,
        maxAge,
      });

      // Batch fetch photos (avoids N+1)
      const profileIds = rows.map((p) => p.user_id);
      const photosMap =
        profileIds.length > 0
          ? await ProfileImage.getByProfileIds(profileIds)
          : {};

      const viewerUser = await User.findById(currentUserId);
      const isViewerPaid = Number(viewerUser?.is_paid) === 1;

      const enrichedProfiles = rows.map((p) => {
        const photos = photosMap[p.user_id] || [];
        
        // Requirement 1: If viewer is unpaid, hide sensitive info in feed
        let name = p.full_name;
        if (!isViewerPaid && name) {
          name = name.split(" ")[0]; // Only first name
        }

        return {
          ...p,
          full_name: name,
          photos: photos,
        };
      });

      console.log(`[FEED] Returning ${enrichedProfiles.length} profiles. Paid: ${isViewerPaid}`);

      // Return a plain array — simple and backward-compatible
      res.status(200).json(enrichedProfiles);
    } catch (error) {
      console.error("[FEED_ERROR] Failed to fetch latest profiles:", error);
      res.status(500).json({
        message: "Internal server error while fetching profiles feed",
        error: error.message,
      });
    }
  },

  sendInterest: async (req, res) => {
    try {
      const { receiverId } = req.body;
      const senderId = req.user.id;

      const authUser = await User.findById(senderId);
      if (!authUser || Number(authUser.is_paid) !== 1) {
        return res.status(403).json({ message: "Only paid users can access this feature." });
      }

      if (!receiverId) {
        return res.status(400).json({ message: "Receiver ID is required" });
      }
      if (senderId == receiverId) {
        return res
          .status(400)
          .json({ message: "You cannot send interest to yourself" });
      }

      await Invitation.send(senderId, receiverId);
      res.status(201).json({ message: "Interest sent successfully" });
    } catch (error) {
      console.error("[INTEREST_ERROR]", error);
      // If invitation already exists, return a friendly message
      if (error.message === "Invitation already sent") {
        return res
          .status(409)
          .json({ message: "You have already sent interest to this person" });
      }
      res
        .status(500)
        .json({ message: error.message || "Internal server error" });
    }
  },

  removeInterest: async (req, res) => {
    try {
      const { receiverId } = req.params;
      const senderId = req.user.id;

      if (!receiverId) {
        return res.status(400).json({ message: "Receiver ID is required" });
      }

      const success = await Invitation.cancel(senderId, receiverId);
      if (!success) {
        return res.status(404).json({ message: "Invitation not found or already cancelled." });
      }

      res.status(200).json({ message: "Interest withdrawn successfully." });
    } catch (error) {
      console.error("[CANCEL_INTEREST_ERROR]", error);
      res.status(500).json({ message: error.message || "Internal server error" });
    }
  },

  ignoreProfile: async (req, res) => {
    try {
      const { receiverId } = req.body;
      const senderId = req.user.id;
      // In a real app, we'd have an 'ignores' table.
      // For this demo, we'll just return success to unblock UI.
      res.json({ message: "Profile ignored" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ═══════════════════════════════════════════
  //  SHORTLIST
  // ═══════════════════════════════════════════

  shortlistProfile: async (req, res) => {
    try {
      const senderId = req.user?.id;
      const { profileUserId } = req.body;

      console.log(
        `[SHORTLIST_DEBUG] Parsed values: Sender=${senderId}, Target=${profileUserId}`,
      );

      if (!senderId) {
        return res
          .status(401)
          .json({ message: "Authentication failed - User ID missing" });
      }

      if (!profileUserId) {
        console.error(
          "[SHORTLIST_ERROR] Profile User ID is missing from request body",
        );
        return res.status(400).json({ message: "Profile user ID is required" });
      }

      if (String(senderId) === String(profileUserId)) {
        console.log("[SHORTLIST_DEBUG] User tried to shortlist themselves");
        return res
          .status(400)
          .json({ message: "You cannot shortlist yourself" });
      }

      await Shortlist.add(senderId, profileUserId);
      res.status(201).json({ message: "Profile shortlisted successfully" });
    } catch (error) {
      if (error.message === "Profile already shortlisted") {
        return res.status(409).json({ message: "Already shortlisted" });
      }

      // Specific database errors
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          message: "Invalid profile user ID - profile does not exist",
          details: error.code,
        });
      }

      res.status(500).json({
        message: `Shortlist failed: ${error.message}`,
        details: error.code,
      });
    }
  },

  getShortlisted: async (req, res) => {
    try {
      const userId = req.user.id;
      const profiles = await Shortlist.getByUser(userId);

      // Batch fetch photos
      const profileIds = profiles.map((p) => p.user_id);
      const photosMap =
        profileIds.length > 0
          ? await ProfileImage.getByProfileIds(profileIds)
          : {};

      const enriched = profiles.map((p) => ({
        ...p,
        photos: photosMap[p.user_id] || [],
      }));

      res.status(200).json(enriched);
    } catch (error) {
      console.error(
        "[SHORTLIST_ERROR] Failed to fetch shortlisted profiles:",
        error,
      );
      res.status(500).json({ message: error.message });
    }
  },

  removeShortlist: async (req, res) => {
    try {
      const userId = req.user.id;
      const { profileUserId } = req.params;

      const removed = await Shortlist.remove(userId, profileUserId);
      if (!removed) {
        return res.status(404).json({ message: "Shortlist entry not found" });
      }
      res.json({ message: "Removed from shortlist" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // ═══════════════════════════════════════════
  //  MULTIPLE PROFILE PHOTOS
  // ═══════════════════════════════════════════

  uploadMultiplePhotos: async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const userId = req.user.id;

      // Enforce max 5 total photos per user
      const existingCount = await ProfileImage.countByUserId(userId);
      if (existingCount + req.files.length > 5) {
        return res.status(400).json({
          message: `You can have at most 5 photos. You currently have ${existingCount}.`,
        });
      }

      // Optimization: Resizing and compression
      await Promise.all(req.files.map((file) => optimizeImage(file.path)));

      // Store relative paths
      const photoPaths = req.files.map((file) => `uploads/${file.filename}`);
      const insertedIds = await ProfileImage.addPhotos(userId, photoPaths);

      res.status(201).json({
        message: "Photos uploaded successfully",
        photos: photoPaths.map((p, i) => ({
          id: insertedIds[i],
          photo_url: p,
        })),
      });
    } catch (error) {
      console.error("[PHOTO_UPLOAD_ERROR]", error);
      res.status(500).json({ message: error.message });
    }
  },

  getProfilePhotos: async (req, res) => {
    try {
      const { id } = req.params;
      const photos = await ProfileImage.getByUserId(id);

      res.status(200).json({ photos });
    } catch (error) {
      console.error("[PHOTO_FETCH_ERROR]", error);
      res.status(500).json({ message: error.message });
    }
  },

  deleteProfilePhoto: async (req, res) => {
    try {
      const { photoId } = req.params;
      const userId = req.user.id;

      const deleted = await ProfileImage.deleteById(Number(photoId), userId);
      if (!deleted) {
        return res
          .status(404)
          .json({ message: "Photo not found or unauthorized" });
      }

      console.log(`[PHOTO_DELETE] User ${userId} deleted photo ${photoId}`);
      res.status(200).json({ message: "Photo deleted successfully" });
    } catch (error) {
      console.error("[PHOTO_DELETE_ERROR]", error);
      res.status(500).json({ message: error.message });
    }
  },

  unlockPreview: async (req, res) => {
    try {
      const userId = req.user.id;

      console.log(`[UNLOCK_PREVIEW] User ${userId} unlocking preview...`);
      const success = await User.updateSubscription(userId, true);

      if (!success) {
        return res
          .status(500)
          .json({ message: "Failed to update subscription" });
      }

      console.log(`[UNLOCK_PREVIEW] ✅ User ${userId} subscribed successfully`);
      res.status(200).json({
        message: "Preview unlocked successfully",
        is_subscribed: 1,
      });
    } catch (error) {
      console.error("[UNLOCK_PREVIEW_ERROR]", error);
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = profileController;
