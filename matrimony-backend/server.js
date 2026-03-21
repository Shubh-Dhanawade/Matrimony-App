const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const apiRoutes = require("./src/routes/api");
const path = require("path");

// ── Gzip compression ─────────────────────────────────────────────────────
// Shrinks JSON responses by ~60–70%, hugely faster on mobile data connections
let compression;
try {
  compression = require("compression");
  app.use(compression({ threshold: 512 })); // compress responses > 512 bytes
  console.log("[SERVER] Compression enabled");
} catch (e) {
  console.warn("[SERVER] 'compression' package not installed – run: npm i compression");
}

// ── CORS ─────────────────────────────────────────────────────────────────
app.use(cors());

// ── Body parsers ─────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Static uploads with long-term HTTP cache headers ─────────────────────
// Images are named with timestamps/UUIDs so they are immutable once saved.
// Cache them on the device for 30 days to avoid re-downloading on every screen.
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "30d",          // Cache-Control: max-age=2592000
    etag: true,             // ETag for conditional requests
    lastModified: true,     // Last-Modified header
    immutable: false,       // Don't set immutable — we allow profile photo updates
    fallthrough: false,     // Return 404 if file not found (don't pass to next handler)
  }),
);

// ── Lean request logger — logs only slow requests (>300ms) and errors ────
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    if (res.statusCode >= 400 || ms > 300) {
      console.log(`[${res.statusCode}] ${req.method} ${req.url} — ${ms}ms`);
    }
  });
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────
app.use("/api", apiRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Matrimony App API", status: "ok" });
});

// ── Port ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5472;
// const HOST = "0.0.0.0"; // Bind to all interfaces so Android device on LAN can connect

// Automated Schema Migration Check
const runAutoMigration = async () => {
  try {
    const db = require("./src/config/db");
    console.log("[DB_MIGRATION] Checking schema...");

    const [cols] = await db.execute("SHOW COLUMNS FROM users");
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes("token_version")) {
      console.log("[DB_MIGRATION] Adding 'token_version' to users...");
      await db.execute("ALTER TABLE users ADD COLUMN token_version INT DEFAULT 0");
    }
    if (!colNames.includes("last_login")) {
      console.log("[DB_MIGRATION] Adding 'last_login' to users...");
      await db.execute("ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL");
    }
    if (!colNames.includes("account_status")) {
      console.log("[DB_MIGRATION] Adding 'account_status' to users...");
      await db.execute("ALTER TABLE users ADD COLUMN account_status ENUM('active', 'deleted') DEFAULT 'active'");
    }
    if (!colNames.includes("premium_start_date")) {
      console.log("[DB_MIGRATION] Adding 'premium_start_date' to users...");
      await db.execute("ALTER TABLE users ADD COLUMN premium_start_date DATETIME NULL");
    }
    if (!colNames.includes("premium_end_date")) {
      console.log("[DB_MIGRATION] Adding 'premium_end_date' to users...");
      await db.execute("ALTER TABLE users ADD COLUMN premium_end_date DATETIME NULL");
    }

    // Check blocks table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS blocks (
          id int NOT NULL AUTO_INCREMENT,
          blocker_id int NOT NULL,
          blocked_user_id int NOT NULL,
          reason text NULL,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY unique_block (blocker_id, blocked_user_id),
          KEY blocker_id (blocker_id),
          KEY blocked_user_id (blocked_user_id),
          CONSTRAINT blocks_ibfk_1 FOREIGN KEY (blocker_id) REFERENCES users (id) ON DELETE CASCADE,
          CONSTRAINT blocks_ibfk_2 FOREIGN KEY (blocked_user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4
    `);

    console.log("[DB_MIGRATION] Schema check complete.");
  } catch (err) {
    console.error("[DB_MIGRATION] Error during auto-migration:", err.message);
  }
};

app.listen(PORT, async () => {
  await runAutoMigration();
  // console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Access from device: http://192.168.0.113:${PORT}`);
});
