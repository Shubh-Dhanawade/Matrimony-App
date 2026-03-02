const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const ProfileImage = {
    /**
     * Insert multiple photo records for a user
     * @param {number} userId - The profile/user ID
     * @param {string[]} photoPaths - Array of relative paths (e.g. 'uploads/filename.jpg')
     * @returns {Promise<number[]>} Array of inserted IDs
     */
    addPhotos: async (userId, photoPaths) => {
        if (!photoPaths || photoPaths.length === 0) return [];

        const values = photoPaths.map(p => [userId, p]);
        const placeholders = values.map(() => '(?, ?)').join(', ');
        const flatValues = values.flat();

        const query = `INSERT INTO multiple_profile_images (user_id, photo_url) VALUES ${placeholders}`;
        const [result] = await db.execute(query, flatValues);

        // Return array of inserted IDs
        const ids = [];
        for (let i = 0; i < photoPaths.length; i++) {
            ids.push(result.insertId + i);
        }
        return ids;
    },

    /**
     * Get all photos for a user, ordered newest first
     * @param {number} userId
     * @returns {Promise<Array<{id: number, photo_url: string, created_at: string}>>}
     */
    getByUserId: async (userId) => {
        const query = `SELECT id, photo_url, created_at 
                   FROM multiple_profile_images 
                   WHERE user_id = ? 
                   ORDER BY created_at DESC`;
        const [rows] = await db.execute(query, [userId]);
        return rows;
    },

    /**
     * Batch fetch photos for multiple profile IDs (avoids N+1 queries)
     * Returns a map: { userId: [photo_url, ...] }
     * @param {number[]} profileIds
     * @returns {Promise<Object>}
     */
    getByProfileIds: async (profileIds) => {
        if (!profileIds || profileIds.length === 0) return {};

        const placeholders = profileIds.map(() => '?').join(', ');
        const query = `SELECT user_id, photo_url 
                   FROM multiple_profile_images 
                   WHERE user_id IN (${placeholders})
                   ORDER BY created_at ASC`;
        const [rows] = await db.execute(query, profileIds);

        // Group by user_id
        const photoMap = {};
        rows.forEach(row => {
            if (!photoMap[row.user_id]) {
                photoMap[row.user_id] = [];
            }
            photoMap[row.user_id].push(row.photo_url);
        });
        return photoMap;
    },

    /**
     * Delete a specific photo by ID, ensuring ownership
     * Also removes the file from disk
     * @param {number} photoId
     * @param {number} userId
     * @returns {Promise<boolean>}
     */
    deleteById: async (photoId, userId) => {
        // First get the photo to find the file path
        const [rows] = await db.execute(
            'SELECT id, photo_url FROM multiple_profile_images WHERE id = ? AND user_id = ?',
            [photoId, userId]
        );

        if (rows.length === 0) return false;

        const photoUrl = rows[0].photo_url;

        // Delete from database
        const [result] = await db.execute(
            'DELETE FROM multiple_profile_images WHERE id = ? AND user_id = ?',
            [photoId, userId]
        );

        // Remove file from disk
        if (result.affectedRows > 0 && photoUrl) {
            const filePath = path.join(__dirname, '../../', photoUrl);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`[PHOTO_DELETE] Removed file: ${filePath}`);
                }
            } catch (err) {
                console.error(`[PHOTO_DELETE] Failed to remove file: ${filePath}`, err.message);
            }
        }

        return result.affectedRows > 0;
    },

    /**
     * Count photos for a user (to enforce max limit)
     * @param {number} userId
     * @returns {Promise<number>}
     */
    countByUserId: async (userId) => {
        const [rows] = await db.execute(
            'SELECT COUNT(*) as count FROM multiple_profile_images WHERE user_id = ?',
            [userId]
        );
        return rows[0].count;
    }
};

module.exports = ProfileImage;
