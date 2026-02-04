const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const invitationController = require('../controllers/invitationController');
const auth = require('../middleware/auth');

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Profile Routes
router.post('/profiles', auth, profileController.createOrUpdate);
router.put('/profiles', auth, profileController.updateProfile);
router.get('/profiles', auth, profileController.getProfiles);
router.get('/profiles/suggested', auth, profileController.getSuggestedMatches);
router.get('/profiles/me', auth, profileController.getMyProfile);

// Invitation Routes
router.post('/invitations', auth, invitationController.sendInvitation);
router.get('/invitations', auth, invitationController.getInvitations);
router.put('/invitations', auth, invitationController.updateStatus);

module.exports = router;
