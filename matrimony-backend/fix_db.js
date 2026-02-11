const db = require('./src/config/db');

async function fixDb() {
  try {
    console.log('--- STARTING DATABASE REPAIR ---');
    
    // 1. Ensure users table has role and is_blocked
    console.log('Ensuring users table columns...');
    const [userCols] = await db.execute('SHOW COLUMNS FROM users');
    const userColNames = userCols.map(c => c.Field);
    
    if (!userColNames.includes('role')) {
      console.log('Adding role to users...');
      await db.execute("ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'");
    }
    if (!userColNames.includes('is_blocked')) {
      console.log('Adding is_blocked to users...');
      await db.execute("ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE");
    }

    // 2. Ensure profiles table has status
    console.log('\nEnsuring profiles table columns...');
    const [profileCols] = await db.execute('SHOW COLUMNS FROM profiles');
    const profileColNames = profileCols.map(c => c.Field);
    
    if (!profileColNames.includes('status')) {
      console.log('Adding status to profiles...');
      await db.execute("ALTER TABLE profiles ADD COLUMN status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Approved'");
    } else {
      // If status exists, set all Pending to Approved so they show up on dashboard
      console.log('Updating profiles to Approved status...');
      await db.execute("UPDATE profiles SET status = 'Approved' WHERE status = 'Pending' OR status IS NULL");
    }

    // 3. Fix monthly_income if it has bad data
    if (profileColNames.includes('monthly_income')) {
       console.log('Ensuring monthly_income is clean...');
       await db.execute("UPDATE profiles SET monthly_income = 0 WHERE monthly_income IS NULL");
    }

    // 4. Verify Invitations Table
    console.log('\nVerifying invitations table...');
    const [invCols] = await db.execute('SHOW COLUMNS FROM invitations');
    const invColNames = invCols.map(c => c.Field);
    console.log('Invitations columns:', invColNames.join(', '));

    console.log('\n--- DATABASE REPAIR COMPLETED ---');
    console.log('Please restart your backend server now.');
    process.exit(0);
  } catch (error) {
    console.error('CRITICAL REPAIR ERROR:', error.message);
    process.exit(1);
  }
}

fixDb();
