import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  async (config) => {
    try {
      console.log(`\n[AXIOS] ═══════════════════════════════════════`);
      console.log(
        `[AXIOS] 📤 REQUEST: ${config.method.toUpperCase()} ${config.url}`,
      );
      const token = await AsyncStorage.getItem("token");
      console.log(
        `[AXIOS] 🔐 Token: ${token ? "FOUND (" + token.substring(0, 15) + "...)" : "❌ MISSING"}`,
      );

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`[AXIOS] ✅ Authorization header attached`);
      } else {
        console.log(
          `[AXIOS] ⚠️ No token found - request will fail if auth required`,
        );
      }

      console.log(
        `[AXIOS] 📦 Request body:`,
        JSON.stringify(config.data || {}),
      );
      console.log(`[AXIOS] ═══════════════════════════════════════\n`);
    } catch (e) {
      console.error("[AXIOS] ❌ Interceptor error:", e);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add a response interceptor for better error reporting
api.interceptors.response.use(
  (response) => {
    console.log(
      `[AXIOS] ✅ RESPONSE [${response.status}]: ${response.config.url}`,
    );
    return response;
  },
  (error) => {
    console.error(
      `[AXIOS] ❌ ERROR [${error.response?.status || "NO STATUS"}]: ${error.config?.url}`,
    );
    console.error(
      `[AXIOS] Error message:`,
      error.response?.data?.message || error.message,
    );
    return Promise.reject(error);
  },
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
  const token = await AsyncStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/profiles/photos`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
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
