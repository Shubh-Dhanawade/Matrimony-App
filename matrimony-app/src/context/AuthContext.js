import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      console.log('[AUTH_CONTEXT] Loading storage data...');
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      console.log(`[AUTH_CONTEXT] Token in storage: ${storedToken ? 'FOUND' : 'MISSING'}`);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        console.log('[AUTH_CONTEXT] State synchronized with storage');
      }
    } catch (e) {
      console.error('[AUTH_CONTEXT] Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken, userData) => {
    console.log('[AUTH_CONTEXT] Login called, saving token...');
    setToken(newToken);
    setUser(userData);
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    console.log('[AUTH_CONTEXT] Token and User saved to AsyncStorage');
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
