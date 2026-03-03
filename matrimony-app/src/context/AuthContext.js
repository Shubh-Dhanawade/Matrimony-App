import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);
  const [profileStatus, setProfileStatus] = useState(null); // null | 'Pending' | 'Approved' | 'Rejected'

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      console.log("[AUTH_CONTEXT] Loading storage data...");
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);

        // If it's a regular user, check profile
        if (parsedUser.role !== "admin") {
          await checkProfileStatus();
        }
      }
    } catch (e) {
      console.error("[AUTH_CONTEXT] Load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const checkProfileStatus = async () => {
    try {
      const api = (await import("../services/api")).default;
      const response = await api.get("/profiles/me");
      const hp = response.data.hasProfile;
      const status = response.data.profile?.status || null;
      setHasProfile(hp);
      setProfileStatus(hp ? status : null);
      return { hasProfile: hp, profileStatus: status };
    } catch (error) {
      console.error("[AUTH_CONTEXT] Profile check error:", error);
      setHasProfile(true);
      return { hasProfile: true, profileStatus: null };
    }
  };

  const login = async (newToken, userData) => {
    console.log("[AUTH_CONTEXT] Login called, saving token...");
    setToken(newToken);
    setUser(userData);
    await AsyncStorage.setItem("token", newToken);
    await AsyncStorage.setItem("user", JSON.stringify(userData));

    // Check profile immediately after login if not admin
    if (userData.role !== "admin") {
      await checkProfileStatus();
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setHasProfile(true);
    setProfileStatus(null);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
  };

  const updateUser = async (updatedData) => {
    try {
      const newUser = { ...user, ...updatedData };
      setUser(newUser);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      console.log("[AUTH_CONTEXT] User updated locally");
    } catch (e) {
      console.error("[AUTH_CONTEXT] Update user error:", e);
    }
  };

  const refreshUser = async () => {
    try {
      const api = (await import("../services/api")).default;

      // Get latest user info
      const authRes = await api.get("/auth/me");
      // Get latest profile info (especially avatar_url)
      const profileRes = await api.get("/profiles/me");

      if (authRes.data.user) {
        let userData = authRes.data.user;

        // Merge profile info if exists
        if (profileRes.data.profile) {
          userData = { ...userData, ...profileRes.data.profile };
        }

        setUser(userData);
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        console.log("[AUTH_CONTEXT] User and Profile refreshed");
      }

      // Also refresh status
      if (profileRes.data.hasProfile) {
        setHasProfile(true);
        setProfileStatus(profileRes.data.profile?.status || null);
      }
    } catch (error) {
      console.error("[AUTH_CONTEXT] Refresh error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        hasProfile,
        profileStatus,
        checkProfileStatus,
        login,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
