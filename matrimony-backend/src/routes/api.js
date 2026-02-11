const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const invitationController = require('../controllers/invitationController');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

const upload = require('../middleware/multer');

// Profile Routes
router.post('/profiles', auth, profileController.createOrUpdate);
router.put('/profiles', auth, profileController.updateProfile);
router.get('/profiles', auth, profileController.getProfiles);
router.get('/profiles/suggested', auth, profileController.getSuggestedMatches);
router.get('/profiles/me', auth, profileController.getMyProfile);
router.post('/upload/profile-image', auth, upload.single('image'), profileController.uploadImage);

// Invitation Routes
router.post('/invitations', auth, invitationController.sendInvitation);
router.get('/invitations', auth, invitationController.getInvitations);
router.put('/invitations', auth, invitationController.updateStatus);

// Admin Routes
router.get('/admin/stats', auth, admin, adminController.getDashboardStats);
router.get('/admin/profiles', auth, admin, adminController.getAllProfiles);
router.patch('/admin/profiles/:id/status', auth, admin, adminController.updateProfileStatus);
router.get('/admin/users', auth, admin, adminController.getAllUsers);
router.patch('/admin/users/:id/block', auth, admin, adminController.toggleBlockUser);

module.exports = router;
