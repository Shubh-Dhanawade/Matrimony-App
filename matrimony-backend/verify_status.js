const db = require('./src/config/db');

async function verify() {
  try {
    const [rows] = await db.execute('SHOW COLUMNS FROM profiles');
    const hasStatus = rows.some(c => c.Field === 'status');
    
    if (hasStatus) {
      console.log('SUCCESS: status column found.');
      const [data] = await db.execute('SELECT status, COUNT(*) as count FROM profiles GROUP BY status');
      console.table(data);
    } else {
      console.log('FAILURE: status column still missing.');
    }
    process.exit(0);
  } catch (e) {
    console.error('Verify failed:', e.message);
    process.exit(1);
  }
}
verify();
