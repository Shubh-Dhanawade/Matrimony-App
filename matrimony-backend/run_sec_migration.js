const db = require('./src/config/db');

async function runMigration() {
  try {
    console.log('Starting Security Features Migration...');

    // 1. Update users table
    console.log('Checking users table columns...');
    const [userColumns] = await db.execute('SHOW COLUMNS FROM users');
    const hasLastLogin = userColumns.some(c => c.Field === 'last_login_at');
    const hasTokenVersion = userColumns.some(c => c.Field === 'token_version');

    if (!hasLastLogin) {
      console.log('Adding login activity columns to users...');
      await db.execute(`
        ALTER TABLE users 
        ADD COLUMN last_login_at TIMESTAMP NULL,
        ADD COLUMN last_login_device VARCHAR(255) NULL,
        ADD COLUMN last_login_location VARCHAR(255) NULL
      `);
    }

    if (!hasTokenVersion) {
      console.log('Adding token_version column to users...');
      await db.execute('ALTER TABLE users ADD COLUMN token_version INT DEFAULT 0');
    }

    // 2. Update profiles table
    console.log('Checking profiles table columns...');
    const [profileColumns] = await db.execute('SHOW COLUMNS FROM profiles');
    const hasPrivacy = profileColumns.some(c => c.Field === 'privacy_setting');

    if (!hasPrivacy) {
      console.log('Adding privacy_setting column to profiles...');
      await db.execute(`
        ALTER TABLE profiles
        ADD COLUMN privacy_setting ENUM('Public', 'Only Connected Users', 'Paid Members Only') DEFAULT 'Public'
      `);
    }

    // 3. Create blocks table
    console.log('Creating blocks table if not exists...');
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

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
