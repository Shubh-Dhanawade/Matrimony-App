const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('Connected to database to fix schema...');

    try {
        // 1. Ensure users table has all required columns
        const columnsToAdd = [
            { name: 'role', type: "VARCHAR(20) DEFAULT 'user'" },
            { name: 'is_paid', type: 'INT DEFAULT 0' },
            { name: 'is_subscribed', type: 'INT DEFAULT 0' },
            { name: 'is_blocked', type: 'INT DEFAULT 0' },
            { name: 'last_login', type: 'DATETIME NULL' },
            { name: 'token_version', type: 'INT DEFAULT 0' }
        ];

        const [existingColumns] = await connection.execute('DESCRIBE users');
        const existingColumnNames = existingColumns.map(c => c.Field);

        for (const col of columnsToAdd) {
            if (!existingColumnNames.includes(col.name)) {
                console.log(`Adding column ${col.name} to users table...`);
                await connection.execute(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
            }
        }

        // 2. Ensure admin user is correctly set
        const adminMobile = '8446430330'; // New support number
        const [adminRows] = await connection.execute('SELECT id FROM users WHERE mobile_number = ?', [adminMobile]);
        
        if (adminRows.length > 0) {
            console.log(`Updating user ${adminMobile} to admin role...`);
            await connection.execute(
                "UPDATE users SET role = 'admin', is_paid = 1, is_subscribed = 1, is_blocked = 0 WHERE mobile_number = ?",
                [adminMobile]
            );
        } else {
            console.log(`Warning: Admin user ${adminMobile} not found in database. Run seed script if needed.`);
        }

        // 3. Ensure profiles table has status column if missing (unlikely but safe)
        const [profileCols] = await connection.execute('DESCRIBE profiles');
        const profileColNames = profileCols.map(c => c.Field);
        if (!profileColNames.includes('status')) {
            console.log('Adding status to profiles table...');
            await connection.execute("ALTER TABLE profiles ADD COLUMN status VARCHAR(20) DEFAULT 'Pending'");
        }

        console.log('Schema fix completed successfully!');
    } catch (error) {
        console.error('Error fixing schema:', error);
    } finally {
        await connection.end();
    }
}

fixSchema();
