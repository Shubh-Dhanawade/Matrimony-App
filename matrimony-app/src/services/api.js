import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds — prevents UI hanging on slow/unreachable server
  headers: {
    "Content-Type": "application/json",
    "Connection": "keep-alive", // reuse TCP connection between calls
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Compact log — uncomment body only when debugging
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}${token ? '' : ' [NO TOKEN]'}`);
    } catch (e) {
      console.error("[API] Interceptor error:", e);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add a response interceptor for error reporting
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    
    if (status === 401) {
      console.warn(`[AUTH] 🛑 Unauthorized (401) on ${error.config?.url}. Clearing token...`);
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      // Optional: You could trigger an event here if you use an event emitter
    }

    console.error(
      `[API] ❌ ${status || 'ERR'} ${error.config?.url}: ${error.response?.data?.message || error.message}`,
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

// ═══════════════════════════════════════════
//  Account Security API helpers
// ═══════════════════════════════════════════

export const getSecurityStatus = () => {
  return api.get("/security/status");
};

export const logoutAllDevices = () => {
  return api.post("/security/logout-all");
};

export const deleteAccount = () => {
  return api.delete("/security/account");
};

export const updatePrivacy = (setting) => {
  return api.put("/security/privacy", { setting });
};

export const blockUser = (userIdToBlock, reason = "") => {
  return api.post("/security/block", { userIdToBlock, reason });
};

export const unblockUser = (userIdToUnblock) => {
  return api.post("/security/unblock", { userIdToUnblock });
};

export const getBlockedUsers = () => {
  return api.get("/security/blocked-users");
};

