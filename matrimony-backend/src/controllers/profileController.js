const Profile = require("../models/Profile");
const ProfileImage = require("../models/ProfileImage");
const Invitation = require("../models/Invitation");
const Shortlist = require("../models/Shortlist");
const fs = require("fs");
const path = require("path");

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
      const profile = await Profile.findByUserId(req.user.id);
      console.log(`Profile found: ${!!profile}`);
      res.json({ profile, hasProfile: !!profile });
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
      console.log(`Fetching profile for user ID: ${id}`);
      const profile = await Profile.findByUserId(id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      // Only allow viewing approved profiles (except for own profile via different endpoint)
      if (profile.status !== "Approved") {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json({ profile });
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

      res.status(200).json({
        message: "Image uploaded successfully",
        imageUrl: `uploads/${req.file.filename}`, // Return relative path
        filename: req.file.filename,
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

      const enrichedProfiles = rows.map((p) => ({
        ...p,
        photos: photosMap[p.user_id] || [],
      }));

      console.log(`[FEED] Returning ${enrichedProfiles.length} profiles`);

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
      console.log("\n═══════════════════════════════════");
      console.log("[SHORTLIST_DEBUG] Request received");
      console.log("[SHORTLIST_DEBUG] req.user:", req.user);
      console.log("[SHORTLIST_DEBUG] req.body:", req.body);
      console.log("[SHORTLIST_DEBUG] Full request headers:", req.headers);
      console.log("═══════════════════════════════════\n");

      const senderId = req.user?.id;
      const { profileUserId } = req.body;

      console.log(
        `[SHORTLIST_DEBUG] Parsed values: Sender=${senderId}, Target=${profileUserId}`,
      );

      if (!senderId) {
        console.error(
          "[SHORTLIST_ERROR] Sender ID is missing - req.user not properly set",
        );
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

      console.log(
        `[SHORTLIST_DEBUG] Adding shortlist: ${senderId} -> ${profileUserId}`,
      );
      await Shortlist.add(senderId, profileUserId);
      console.log("[SHORTLIST_DEBUG] Shortlist added successfully");
      res.status(201).json({ message: "Profile shortlisted successfully" });
    } catch (error) {
      console.error("[SHORTLIST_ERROR] Full error:", error);
      console.error("[SHORTLIST_ERROR] Message:", error.message);
      console.error("[SHORTLIST_ERROR] Code:", error.code);

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

      // Store relative paths
      const photoPaths = req.files.map((file) => `uploads/${file.filename}`);
      const insertedIds = await ProfileImage.addPhotos(userId, photoPaths);

      console.log(
        `[PHOTO_UPLOAD] User ${userId} uploaded ${photoPaths.length} photos`,
      );

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
};

module.exports = profileController;
