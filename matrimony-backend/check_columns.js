const db = require('./src/config/db');

async function check() {
  try {
    const [rows] = await db.execute('SHOW COLUMNS FROM users');
    console.log('--- USERS TABLE COLUMNS ---');
    rows.forEach(r => console.log(r.Field, r.Type, r.Default));
    
    // Check if account_status and last_login exist, if not add them for consistency if that's what user wants
    const hasStatus = rows.some(r => r.Field === 'account_status');
    const hasLastLogin = rows.some(r => r.Field === 'last_login');
    
    if (!hasStatus) {
        console.log('Adding account_status column...');
        await db.execute("ALTER TABLE users ADD COLUMN account_status ENUM('active', 'deleted') DEFAULT 'active'");
    }
    if (!hasLastLogin) {
        console.log('Adding last_login column...');
        await db.execute("ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL");
    }

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

check();
