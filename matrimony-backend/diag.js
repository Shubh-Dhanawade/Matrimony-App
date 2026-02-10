const db = require('./src/config/db');

async function checkSchema() {
  try {
    console.log('Checking database connection...');
    const [rows] = await db.execute('DESCRIBE profiles');
    console.log('Profiles table structure:');
    console.table(rows);
    
    const hasStatus = rows.some(row => row.Field === 'status');
    console.log('Has status column:', hasStatus);

    const [userRows] = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log('User count row:', userRows[0]);

    process.exit(0);
  } catch (error) {
    console.error('Diagnostic failed:', error);
    process.exit(1);
  }
}

checkSchema();
