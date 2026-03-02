const db = require('./src/config/db');

async function fixPaths() {
    try {
        console.log('Starting image path cleanup...');

        // Select all profiles with a non-empty avatar_url
        const [profiles] = await db.execute('SELECT id, avatar_url FROM profiles WHERE avatar_url IS NOT NULL AND avatar_url != ""');

        let updatedCount = 0;

        for (const profile of profiles) {
            let originalPath = profile.avatar_url;

            // Look for "uploads/" in the string
            const uploadsIndex = originalPath.indexOf('uploads/');

            if (uploadsIndex !== -1) {
                const cleanPath = originalPath.substring(uploadsIndex);

                if (cleanPath !== originalPath) {
                    console.log(`Fixing ID ${profile.id}: "${originalPath}" -> "${cleanPath}"`);
                    await db.execute('UPDATE profiles SET avatar_url = ? WHERE id = ?', [cleanPath, profile.id]);
                    updatedCount++;
                }
            }
        }

        console.log(`\nCleanup finished. Updated ${updatedCount} profile(s).`);
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

fixPaths();
