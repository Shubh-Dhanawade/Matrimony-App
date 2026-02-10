const db = require('./src/config/db');

async function probe() {
  const testUserId = 1; // Assuming user ID 1 exists or just checking query syntax
  
  console.log('--- Probing Dashboard Queries ---');
  
  try {
    console.log('\n[Testing profiles query]');
    await db.execute(`
      SELECT p.*, u.mobile_number, TIMESTAMPDIFF(YEAR, p.dob, CURDATE()) AS age 
      FROM profiles p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.user_id != ? AND p.status = 'Approved'`, [testUserId]);
    console.log('OK: profiles query');
  } catch (e) {
    console.error('FAIL: profiles query ->', e.message);
  }

  try {
    console.log('\n[Testing suggested matches query step 1]');
    const [rows] = await db.execute('SELECT * FROM profiles WHERE user_id = ?', [testUserId]);
    console.log('OK: findByUserId');
    
    if (rows.length > 0) {
      const userProfile = rows[0];
      const age = 30; 
      console.log('[Testing suggested matches query step 2]');
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
      console.log('OK: suggested query');
    } else {
      console.log('SKIP: suggested query (no profile for test user)');
    }
  } catch (e) {
    console.error('FAIL: suggested query ->', e.message);
  }

  try {
    console.log('\n[Testing invitations sent query]');
    await db.execute(
      'SELECT i.*, p.full_name FROM invitations i JOIN profiles p ON i.receiver_id = p.user_id WHERE i.sender_id = ?',
      [testUserId]
    );
    console.log('OK: invitations sent');
  } catch (e) {
    console.error('FAIL: invitations sent ->', e.message);
  }

  process.exit(0);
}

probe();
