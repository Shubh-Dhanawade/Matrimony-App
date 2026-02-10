const db = require('./src/config/db');

async function migrate() {
  try {
    console.log('Checking for status column in profiles...');
    const [columns] = await db.execute('SHOW COLUMNS FROM profiles');
    const hasStatus = columns.some(c => c.Field === 'status');
    
    if (!hasStatus) {
      console.log('Adding status column to profiles...');
      await db.execute("ALTER TABLE profiles ADD COLUMN status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Approved'");
      console.log('Status column added successfully.');
    } else {
      console.log('Status column already exists.');
    }

    console.log('Checking for is_blocked column in users...');
    const [userColumns] = await db.execute('SHOW COLUMNS FROM users LIKE "is_blocked"');
    if (userColumns.length === 0) {
      console.log('Adding is_blocked column to users...');
      await db.execute('ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE');
      console.log('is_blocked column added successfully.');
    } else {
      console.log('is_blocked column already exists.');
    }

    console.log('Checking for role column in users...');
    const [roleColumns] = await db.execute('SHOW COLUMNS FROM users LIKE "role"');
    if (roleColumns.length === 0) {
      console.log('Adding role column to users...');
      await db.execute("ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'");
      console.log('role column added successfully.');
    } else {
      console.log('role column already exists.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
