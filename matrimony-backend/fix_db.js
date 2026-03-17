const db = require('./src/config/db');

async function fix() {
  try {
    console.log('Fixing database schema...');

    // 1. Add token_version to users if missing
    try {
        await db.execute("ALTER TABLE users ADD COLUMN token_version INT DEFAULT 0");
        console.log('Added token_version column.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('token_version already exists.');
        else throw e;
    }

    // 2. Add last_login to users if missing
    try {
        await db.execute("ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL");
        console.log('Added last_login column.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('last_login already exists.');
        else throw e;
    }

    // 3. Add account_status to users if missing
    try {
        await db.execute("ALTER TABLE users ADD COLUMN account_status ENUM('active', 'deleted') DEFAULT 'active'");
        console.log('Added account_status column.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') console.log('account_status already exists.');
        else throw e;
    }

    // 4. Create blocks table if missing
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
    console.log('Blocks table checked/created.');

    console.log('Fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  }
}

fix();
