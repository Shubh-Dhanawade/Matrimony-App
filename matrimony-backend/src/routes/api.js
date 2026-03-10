const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const profileController = require("../controllers/profileController");
const invitationController = require("../controllers/invitationController");
const adminController = require("../controllers/adminController");
const locationController = require("../controllers/locationController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// Location Routes (public - no auth needed)
router.get("/ping", (req, res) => res.send("pong-success"));
router.get("/location/states", locationController.getStates);
router.get("/location/districts/:stateId", locationController.getDistricts);
router.get("/location/talukas/:districtId", locationController.getTalukas);

// Auth Routes
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/me", auth, authController.getMe);

const upload = require("../middleware/multer");

// Profile Routes
router.post("/profiles", auth, profileController.createOrUpdate);
router.put("/profiles", auth, profileController.updateProfile);
router.get("/profiles", auth, profileController.getProfiles);
router.get("/profiles/suggested", auth, profileController.getSuggestedMatches);
router.get("/profiles/me", auth, profileController.getMyProfile);
router.get("/profiles/latest", auth, profileController.getLatestProfiles);
router.post("/profiles/interest", auth, profileController.sendInterest);
router.delete("/profiles/interest/:receiverId", auth, profileController.removeInterest);
router.post("/profiles/ignore", auth, profileController.ignoreProfile);
router.post("/profiles/shortlist", auth, profileController.shortlistProfile);
router.get("/profiles/shortlisted", auth, profileController.getShortlisted);
router.post("/profiles/unlock-preview", auth, profileController.unlockPreview);
router.delete(
  "/profiles/shortlist/:profileUserId",
  auth,
  profileController.removeShortlist,
);

// Multiple Profile Photos Routes (must be before :id to avoid param conflicts)
router.post(
  "/profiles/photos",
  auth,
  upload.array("photos", 5),
  profileController.uploadMultiplePhotos,
);
router.delete(
  "/profiles/photos/:photoId",
  auth,
  profileController.deleteProfilePhoto,
);

// Parameterized profile routes (keep :id routes last)
router.get("/profiles/:id", auth, profileController.getProfileById);
router.get("/profiles/:id/photos", auth, profileController.getProfilePhotos);

router.post(
  "/upload/profile-image",
  auth,
  upload.single("image"),
  profileController.uploadImage,
);

router.post(
  "/upload/biodata",
  auth,
  upload.single("biodata"),
  profileController.uploadBiodata,
);

router.post(
  "/upload/kundali",
  auth,
  upload.single("kundali"),
  profileController.uploadKundali,
);

// Invitation Routes
router.post("/invitations", auth, invitationController.sendInvitation);
router.get("/invitations", auth, invitationController.getInvitations);
router.put("/invitations", auth, invitationController.updateStatus);

// Admin Routes
router.get("/admin/stats", auth, admin, adminController.getDashboardStats);
router.get("/admin/profiles", auth, admin, adminController.getAllProfiles);
router.patch(
  "/admin/profiles/:id/status",
  auth,
  admin,
  adminController.updateProfileStatus,
);
router.get("/admin/users", auth, admin, adminController.getAllUsers);
router.patch(
  "/admin/users/:id/block",
  auth,
  admin,
  adminController.toggleBlockUser,
);
router.delete("/admin/users/:id", auth, admin, adminController.deleteUser);
router.patch("/admin/users/:id/paid", auth, admin, adminController.togglePaidStatus);
router.patch("/admin/users/me/subscribe", auth, authController.simulateUpgrade);

module.exports = router;
