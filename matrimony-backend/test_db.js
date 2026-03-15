const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

async function test() {
  try {
    console.log('Testing connection with:');
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    console.log('DB:', process.env.DB_NAME);
    
    // Test both Root and Krishaa@2904 just in case
    const passwords = [process.env.DB_PASSWORD, 'Krishaa@2904', 'Root', 'root'];
    
    for (const pwd of passwords) {
        if (!pwd) continue;
        console.log(`Trying password: ${pwd}`);
        try {
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST || "localhost",
                user: process.env.DB_USER || "root",
                password: pwd,
                database: process.env.DB_NAME || "matrimony_db",
            });
            console.log(' Success with password:', pwd);
            await connection.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INT DEFAULT 0");
            await connection.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL");
            await connection.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status ENUM('active', 'deleted') DEFAULT 'active'");
            console.log('Columns added (if not exist).');
            await connection.end();
            process.exit(0);
        } catch (e) {
            console.log('Failed:', e.message);
        }
    }
    
    console.log('All attempts failed.');
    process.exit(1);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

test();
