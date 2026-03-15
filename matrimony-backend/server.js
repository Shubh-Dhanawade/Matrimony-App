const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const apiRoutes = require("./src/routes/api");

const path = require("path");

// Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api", apiRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Matrimony App API" });
});

// Port and Host
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
  console.log(`Access from device: http://192.168.0.176:${PORT}`);
});
