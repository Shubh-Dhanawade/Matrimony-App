const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authMiddleware = async (req, res, next) => {
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

    // Verify token version for "Logout from all devices"
    try {
      const [userRows] = await db.execute("SELECT * FROM users WHERE id = ?", [decoded.id]);
      if (userRows.length === 0) {
        return res.status(401).json({ message: "User no longer exists" });
      }

      const user = userRows[0];
      
      // Handle missing token_version column gracefully
      if (user.token_version !== undefined && decoded.tokenVersion !== undefined && decoded.tokenVersion < user.token_version) {
        console.log("[AUTH_DEBUG] ❌ Token Version Mismatch: Token invalidated");
        return res.status(401).json({ message: "Session expired. Please log in again." });
      }
      
      // Update last_active_at only if profiles table has it
      db.execute("UPDATE profiles SET last_active_at = NOW() WHERE user_id = ?", [
        decoded.id,
      ]).catch((err) => {
          // Ignore error if column missing
          if (!err.message.includes("Unknown column")) {
            console.error("[AUTH_MIDDLEWARE] Failed to update last_active_at:", err.message);
          }
      });

      req.user = decoded;
    } catch (dbError) {
      console.error("[AUTH_DEBUG] ❌ Database check failed:", dbError.message);
      // If column is missing, we allow the request to proceed but log the issue
      if (dbError.message.includes("Unknown column")) {
        console.warn("[AUTH_DEBUG] ⚠️ Proceeding without security checks due to missing columns:", dbError.message);
        req.user = decoded;
      } else {
        throw dbError; // Rethrow other DB errors to be caught by the outer catch
      }
    }

    console.log("[AUTH_DEBUG] ═════════════════════════════════════════\n");
    next();
  } catch (error) {
    console.error("[AUTH_DEBUG] ❌ AUTH ERROR:", error);
    console.log("[AUTH_DEBUG] ═════════════════════════════════════════\n");
    res.status(401).json({ 
      message: "Authentication failed", 
      debug: error.message 
    });
  }
};

module.exports = authMiddleware;
