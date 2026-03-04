import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  async (config) => {
    try {
      console.log(`[AXIOS_TRACE] Request to: ${config.url}`);
      const token = await AsyncStorage.getItem('token');
      console.log(`[AXIOS_TRACE] Token from storage: ${token ? 'FOUND (starts with ' + token.substring(0, 10) + '...)' : 'MISSING'}`);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`[AXIOS_TRACE] Authorization header attached`);
      } else {
        console.log(`[AXIOS_TRACE] No token found in AsyncStorage. Header NOT attached.`);
      }
    } catch (e) {
      console.error('[AXIOS_TRACE] Interceptor error:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

// ═══════════════════════════════════════════
//  Multiple Profile Photos API helpers
// ═══════════════════════════════════════════

/**
 * Upload multiple profile photos via FormData
 * @param {FormData} formData - Must contain 'photos' field with image files
 */
export const uploadProfilePhotos = async (formData) => {
  // Use native fetch instead of Axios — Axios cannot correctly handle
  // multipart FormData boundaries in React Native
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/profiles/photos`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      // Do NOT set Content-Type — fetch sets it automatically with the correct boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw { response: { data: errData } }; // mimic Axios error shape
  }

  return { data: await response.json() };
};

/**
 * Fetch all photos for a user
 * @param {number} userId
 */
export const getProfilePhotos = (userId) => {
  return api.get(`/profiles/${userId}/photos`);
};

/**
 * Delete a specific photo by ID
 * @param {number} photoId
 */
export const deleteProfilePhoto = (photoId) => {
  return api.delete(`/profiles/photos/${photoId}`);
};
