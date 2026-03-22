import axios from 'axios';

// The Backend base URL as used in the React Native app
export const API_BASE_URL =  "https://cagelike-nonpatriotic-noelia.ngrok-free.dev/api"; 
// Using localhost assuming backend runs locally, or one can change it to the IP

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    // Basic auth logic - grab token from localStorage instead of AsyncStorage
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
