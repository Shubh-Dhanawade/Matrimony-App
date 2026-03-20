const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

async function migrate() {
  let connection;
  try {
    console.log("Connecting to database...");
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "Root",
      database: process.env.DB_NAME || "matrimony_db",
    });

    console.log("Adding is_paid and payment_requested columns...");
    
    // Add is_paid if not exists
    try {
      await connection.execute("ALTER TABLE users ADD COLUMN is_paid TINYINT(1) DEFAULT 0");
      console.log("Added is_paid column.");
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log("is_paid column already exists.");
      } else {
        throw err;
      }
    }

    // Add payment_requested if not exists
    try {
      await connection.execute("ALTER TABLE users ADD COLUMN payment_requested TINYINT(1) DEFAULT 0");
      console.log("Added payment_requested column.");
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log("payment_requested column already exists.");
      } else {
        throw err;
      }
    }

    console.log("Migration complete.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
