import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      console.log('[AUTH_CONTEXT] Loading storage data...');
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);

        // If it's a regular user, check profile
        if (parsedUser.role !== 'admin') {
          await checkProfileStatus();
        }
      }
    } catch (e) {
      console.error('[AUTH_CONTEXT] Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const checkProfileStatus = async () => {
    try {
      const api = (await import('../services/api')).default;
      const response = await api.get('/profiles/me');
      setHasProfile(response.data.hasProfile);
      return response.data.hasProfile;
    } catch (error) {
      console.error('[AUTH_CONTEXT] Profile check error:', error);
      // Default to true to avoid redirect loops on server error, 
      // but you might want to handle this differently
      setHasProfile(true);
      return true;
    }
  };

  const login = async (newToken, userData) => {
    console.log('[AUTH_CONTEXT] Login called, saving token...');
    setToken(newToken);
    setUser(userData);
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));

    // Check profile immediately after login if not admin
    if (userData.role !== 'admin') {
      await checkProfileStatus();
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setHasProfile(true);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!token,
      hasProfile,
      checkProfileStatus,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
