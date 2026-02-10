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
