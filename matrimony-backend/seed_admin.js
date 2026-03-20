const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

async function seedAdmin() {
  let connection;
  try {
    console.log("Connecting to database...");
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "Root",
      database: process.env.DB_NAME || "matrimony_db",
    });

    const mobileNumber = "8446430330";
    const password = "admin123";
    const role = "admin";

    console.log(`Checking if admin user ${mobileNumber} exists...`);
    const [rows] = await connection.execute(
      "SELECT * FROM users WHERE mobile_number = ?",
      [mobileNumber],
    );

    if (rows.length > 0) {
      console.log("Admin user already exists. Updating role to admin...");
      await connection.execute(
        "UPDATE users SET role = 'admin' WHERE mobile_number = ?",
        [mobileNumber],
      );
      console.log("Admin role updated successfully.");
    } else {
      console.log("Creating new admin user...");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await connection.execute(
        "INSERT INTO users (mobile_number, password, role) VALUES (?, ?, ?)",
        [mobileNumber, hashedPassword, role],
      );
      console.log("Admin user created successfully.");
    }

    console.log("-----------------------------------------");
    console.log("ADMIN CREDENTIALS:");
    console.log(`Mobile: ${mobileNumber}`);
    console.log(`Password: ${password}`);
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    if (connection) await connection.end();
  }
}

seedAdmin();
