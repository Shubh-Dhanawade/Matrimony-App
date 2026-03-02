import { IMAGE_BASE_URL } from './constants';

/**
 * Constructs a full image URI from a path stored in the database.
 * If the path is already a full URL (starts with http), it's returned as-is.
 * If the path is relative, it's prepended with the IMAGE_BASE_URL.
 * If no path is provided, it returns a placeholder.
 * 
 * @param {string} path - The image path or URL
 * @returns {string} The full image URI
 */
export const getProfileImageUri = (path) => {
    if (!path) {
        return `${IMAGE_BASE_URL}/uploads/userprofile.png`;
    }

    if (path.startsWith('http')) {
        return path;
    }

    // Ensure we don't have double slashes if IMAGE_BASE_URL ends with / and path starts with /
    const relativePath = path.startsWith('/') ? path : `/${path}`;

    return `${IMAGE_BASE_URL}${relativePath}`;
};
