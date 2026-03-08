const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

async function init() {
  let connection;
  try {
    console.log("Connecting to database...");
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "Root",
      database: process.env.DB_NAME || "matrimony_db",
    });

    console.log("Checking for tables...");

    // Ensure users table exists (required for foreign keys)
    const [usersTable] = await connection.execute("SHOW TABLES LIKE 'users'");
    if (usersTable.length === 0) {
      console.log("Creating users table...");
      await connection.execute(`
        CREATE TABLE users (
          id int NOT NULL AUTO_INCREMENT,
          mobile_number varchar(15) NOT NULL,
          password varchar(255) NOT NULL,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          role varchar(20) NOT NULL DEFAULT 'user',
          is_blocked tinyint(1) DEFAULT '0',
          is_subscribed tinyint(1) NOT NULL DEFAULT '0',
          PRIMARY KEY (id),
          UNIQUE KEY mobile_number (mobile_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `);
    }

    // Ensure profiles table exists
    const [profilesTable] = await connection.execute(
      "SHOW TABLES LIKE 'profiles'",
    );
    if (profilesTable.length === 0) {
      console.log("Creating profiles table...");
      await connection.execute(`
            CREATE TABLE profiles (
                id int NOT NULL AUTO_INCREMENT,
                user_id int NOT NULL,
                full_name varchar(100) NOT NULL,
                father_name varchar(100) DEFAULT NULL,
                mother_maiden_name varchar(100) DEFAULT NULL,
                dob date DEFAULT NULL,
                marital_status enum('Single','Married','Divorced','Widowed') DEFAULT 'Single',
                address text,
                birthplace varchar(100) DEFAULT NULL,
                qualification varchar(100) DEFAULT NULL,
                occupation varchar(100) DEFAULT NULL,
                monthly_income decimal(12,2) DEFAULT NULL,
                caste varchar(50) DEFAULT NULL,
                sub_caste varchar(50) DEFAULT NULL,
                relative_surname varchar(100) DEFAULT NULL,
                expectations text,
                avatar_url text,
                other_comments text,
                gender enum('Male','Female','Other') NOT NULL,
                profile_for varchar(50) NOT NULL,
                status enum('Pending','Approved','Rejected') DEFAULT 'Pending',
                created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                state varchar(100) NOT NULL,
                district varchar(100) NOT NULL,
                taluka varchar(100) NOT NULL,
                age int DEFAULT NULL,
                last_active_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY user_id (user_id),
                CONSTRAINT profiles_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
    }

    // Now ensure shortlists table exists
    const [shortlistsTable] = await connection.execute(
      "SHOW TABLES LIKE 'shortlists'",
    );
    if (shortlistsTable.length === 0) {
      console.log("Creating shortlists table...");
      await connection.execute(`
        CREATE TABLE shortlists (
          id int NOT NULL AUTO_INCREMENT,
          user_id int NOT NULL,
          profile_user_id int NOT NULL,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uniq_shortlist (user_id, profile_user_id),
          KEY profile_user_id (profile_user_id),
          CONSTRAINT shortlists_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          CONSTRAINT shortlists_ibfk_2 FOREIGN KEY (profile_user_id) REFERENCES users (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
      `);
      console.log("Shortlists table created successfully.");
    } else {
      console.log("Shortlists table already exists.");
    }

    console.log("Initialization complete.");
  } catch (error) {
    console.error("Initialization failed:", error);
  } finally {
    if (connection) await connection.end();
  }
}

init();
