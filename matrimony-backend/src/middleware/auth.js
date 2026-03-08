const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  console.log("\n[AUTH_DEBUG] ═════════════════════════════════════════");
  console.log("[AUTH_DEBUG] Incoming request:", req.method, req.path);
  console.log("[AUTH_DEBUG] Auth Header:", authHeader ? "PRESENT" : "MISSING");

  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    console.log("[AUTH_DEBUG] ❌ Authorization Denied: No token in header");
    console.log("[AUTH_DEBUG] ═════════════════════════════════════════\n");
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || "secret";
    console.log(
      "[AUTH_DEBUG] Using JWT_SECRET:",
      jwtSecret.substring(0, 10) + "...",
    );
    const decoded = jwt.verify(token, jwtSecret);
    console.log("[AUTH_DEBUG] ✅ Token Verified. User ID:", decoded.id);
    req.user = decoded;
    // Fire-and-forget: update last_active_at without awaiting to avoid blocking the API request
    db.execute("UPDATE profiles SET last_active_at = NOW() WHERE user_id = ?", [
      decoded.id,
    ]).catch((err) =>
      console.error(
        "[AUTH_MIDDLEWARE] Failed to update last_active_at:",
        err.message,
      ),
    );

    console.log("[AUTH_DEBUG] ═════════════════════════════════════════\n");
    next();
  } catch (error) {
    console.log("[AUTH_DEBUG] ❌ Token Invalid:", error.message);
    console.log("[AUTH_DEBUG] ═════════════════════════════════════════\n");
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = authMiddleware;
