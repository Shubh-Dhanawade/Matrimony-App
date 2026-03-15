const express = require("express");
const router = express.Router();
const securityController = require("../controllers/securityController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.get("/status", securityController.getSecurityStatus);
router.post("/logout-all", securityController.logoutAll);
router.delete("/account", securityController.deleteAccount);
router.put("/privacy", securityController.updatePrivacy);
router.post("/block", securityController.blockUser);
router.post("/unblock", securityController.unblockUser);
router.get("/blocked-users", securityController.getBlockedUsers);

module.exports = router;
