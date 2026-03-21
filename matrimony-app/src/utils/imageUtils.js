import { IMAGE_BASE_URL } from './constants';

// ─── In-memory URI cache ───────────────────────────────────────────────────
// Avoids re-computing the same URL on every render.
// Cleared on app reload (module reset), which is fine.
const _uriCache = new Map();

/**
 * Constructs a full image URI from a path stored in the database.
 * - If the path is already a full URL (starts with http), returned as-is.
 * - If the path contains 'localhost' / '127.0.0.1', rewrites to IMAGE_BASE_URL.
 * - If the path is relative, prepends IMAGE_BASE_URL.
 * - If no path is provided, returns the default avatar.
 *
 * Results are memoized so the same input always returns the same string
 * without recomputing — safe for React Native Image source props.
 *
 * @param {string} path - The image path or URL from the API
 * @returns {string} The full image URI for rendering
 */
export const getProfileImageUri = (path) => {
    // 1. Handle object types (sometimes API returns info as an object)
    let safePath = path;
    if (path && typeof path === 'object') {
        safePath = path.photo_url || path.url || path.avatar || '';
    }

    // 2. Handle missing / empty / literal "null" paths
    if (!safePath || safePath === 'null' || safePath === 'undefined' || String(safePath).trim() === '') {
        return `${IMAGE_BASE_URL}/uploads/userprofile.png`;
    }

    // 2. Return from cache if seen before
    const cached = _uriCache.get(path);
    if (cached) return cached;

    let uri = path;

    // 3. Fix localhost / 127.0.0.1 URLs stored by the backend
    if (typeof path === 'string' && (path.includes('localhost') || path.includes('127.0.0.1'))) {
        const uploadsIndex = path.indexOf('/uploads/');
        if (uploadsIndex !== -1) {
            uri = `${IMAGE_BASE_URL}${path.substring(uploadsIndex)}`;
        } else {
            uri = path
                .replace(/http:\/\/localhost:\d+/g, IMAGE_BASE_URL)
                .replace(/http:\/\/127\.0\.0\.1:\d+/g, IMAGE_BASE_URL);
        }
    } else if (!path.startsWith('http')) {
        // 4. Handle relative paths — ensure leading slash
        uri = `${IMAGE_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    }

    // 5. Cache & return (NO timestamp — let HTTP cache work normally)
    _uriCache.set(path, uri);
    return uri;
};

/**
 * Clears the URI memo cache.
 * Call this after a user uploads a new profile photo so the old cached
 * URI is evicted and the fresh URL is fetched from the server.
 */
export const clearImageUriCache = (path) => {
    if (path) {
        _uriCache.delete(path);
    } else {
        _uriCache.clear();
    }
};
