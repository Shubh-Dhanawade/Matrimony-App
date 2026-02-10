const db = require('./src/config/db');

async function probe() {
  try {
    const testUserId = 3; // Use a real ID if possible, or just syntax test
    console.log('--- PROBING DASHBOARD SQL QUERIES ---');

    // Test 1: Profiles
    try {
      console.log('Testing /profiles query...');
      const [p] = await db.execute(`
        SELECT p.*, u.mobile_number, TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age 
        FROM profiles p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.user_id != ? AND p.status = 'Approved'`, [testUserId]);
      console.log('SUCCESS: /profiles query works. Found:', p.length);
    } catch (e) {
      console.error('FAIL: /profiles query ->', e.message);
    }

    // Test 2: Suggested
    try {
      console.log('\nTesting /suggested query...');
      const [u] = await db.execute('SELECT * FROM profiles WHERE user_id = ?', [testUserId]);
      if (u.length > 0) {
          const userProfile = u[0];
          const age = 30; // mock age
          await db.execute(`
            SELECT p.*, TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age 
            FROM profiles p 
            WHERE p.user_id != ? 
            AND p.status = 'Approved'
            AND (
              p.caste = ? 
              OR p.birthplace = ? 
              OR (TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) BETWEEN ? AND ?)
            )
            LIMIT 10`, [testUserId, userProfile.caste, userProfile.birthplace, age - 5, age + 5]);
          console.log('SUCCESS: /suggested query works');
      } else {
        console.log('SKIP: No profile for test user, skipping suggested logic test');
      }
    } catch (e) {
      console.error('FAIL: /suggested query ->', e.message);
    }

    // Test 3: Invitations (Sent)
    try {
      console.log('\nTesting /invitations sent query...');
      await db.execute(
        "SELECT i.*, COALESCE(p.full_name, 'User') as full_name FROM invitations i LEFT JOIN profiles p ON i.receiver_id = p.user_id WHERE i.sender_id = ?",
        [testUserId]
      );
      console.log('SUCCESS: /invitations sent works');
    } catch (e) {
      console.error('FAIL: /invitations sent ->', e.message);
    }

    // Test 4: Invitations (Received)
    try {
        console.log('\nTesting /invitations received query...');
        await db.execute(
          "SELECT i.*, COALESCE(p.full_name, 'User') as full_name FROM invitations i LEFT JOIN profiles p ON i.sender_id = p.user_id WHERE i.receiver_id = ?",
          [testUserId]
        );
        console.log('SUCCESS: /invitations received works');
      } catch (e) {
        console.error('FAIL: /invitations received ->', e.message);
      }

    process.exit(0);
  } catch (error) {
    console.error('PROBE ERROR:', error.message);
    process.exit(1);
  }
}

probe();
