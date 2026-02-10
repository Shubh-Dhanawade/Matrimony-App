const db = require('./src/config/db');

async function surgicalMigrate() {
  try {
    console.log('--- SURGICAL MIGRATION: ADD STATUS COLUMN ---');
    
    // 1. Check if column exists
    const [columns] = await db.execute('SHOW COLUMNS FROM profiles');
    const hasStatus = columns.some(c => c.Field === 'status');
    
    if (!hasStatus) {
      console.log('Column "status" is missing. Adding it now...');
      await db.execute("ALTER TABLE profiles ADD COLUMN status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Approved'");
      console.log('Column "status" added successfully.');
    } else {
      console.log('Column "status" already exists.');
    }

    // 2. Ensure all existing profiles are 'Approved' so they show on dashboard
    console.log('Updating existing profiles to "Approved" status...');
    await db.execute("UPDATE profiles SET status = 'Approved' WHERE status IS NULL OR status = ''");
    
    // 3. Verify
    const [verifyCols] = await db.execute('SHOW COLUMNS FROM profiles');
    console.table(verifyCols);

    console.log('\n--- MIGRATION COMPLETE ---');
    console.log('You can now refresh your dashboard.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

surgicalMigrate();
