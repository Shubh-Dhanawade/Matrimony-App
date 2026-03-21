import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);
  const [profileStatus, setProfileStatus] = useState(null); // null | 'Pending' | 'Approved' | 'Rejected'

  const [invitationCount, setInvitationCount] = useState(0);

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
          await refreshInvitationsCount();
        }
      }
    } catch (e) {
      console.error("[AUTH_CONTEXT] Load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const refreshInvitationsCount = async () => {
    try {
      const api = (await import("../services/api")).default;
      const response = await api.get("/invitations");
      const { received } = response.data;
      const pendingCount = received.filter(inv => inv.status.toLowerCase() === 'pending').length;
      setInvitationCount(pendingCount);
      console.log("[AUTH_CONTEXT] Invitations refreshed count:", pendingCount);
    } catch (error) {
      console.error("[AUTH_CONTEXT] Refresh invitations count error:", error);
    }
  };

  const checkProfileStatus = async () => {
    try {
      const api = (await import("../services/api")).default;
      const response = await api.get("/profiles/me");
      const { hasProfile: hp, profile, is_paid, is_premium, premium_end_date } = response.data;
      const status = profile?.status || null;
      
      setHasProfile(hp);
      setProfileStatus(hp ? status : null);

      // Update local user state with premium info
      if (user) {
        const updatedUser = { ...user, is_paid, is_premium, premium_end_date };
        setUser(updatedUser);
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      }

      return { hasProfile: hp, profileStatus: status };
    } catch (error) {
      console.error("[AUTH_CONTEXT] Profile check error:", error);
      if (error.response?.status === 401) {
        console.warn("[AUTH_CONTEXT] 🛑 Refresh failed with 401. Logging out...");
        await logout();
      }
      setHasProfile(true);
      return { hasProfile: true, profileStatus: null };
    }
  };

  const login = async (newToken, userData, deviceInfo = null) => {
    console.log("[AUTH_CONTEXT] Login called, saving token...");
    setToken(newToken);
    setUser(userData);
    await AsyncStorage.setItem("token", newToken);
    await AsyncStorage.setItem("user", JSON.stringify(userData));

    // Check profile immediately after login if not admin
    if (userData.role !== "admin") {
      await checkProfileStatus();
      await refreshInvitationsCount();
    }
  };

  const logoutAllDevices = async () => {
    try {
      const { logoutAllDevices: apiLogoutAll } = await import("../services/api");
      await apiLogoutAll();
      await logout();
    } catch (error) {
      console.error("[AUTH_CONTEXT] Logout all devices error:", error);
      throw error;
    }
  };

  const deleteMyAccount = async () => {
    try {
      const { deleteAccount: apiDeleteAccount } = await import("../services/api");
      await apiDeleteAccount();
      await logout();
    } catch (error) {
      console.error("[AUTH_CONTEXT] Delete account error:", error);
      throw error;
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

      let currentUserObject = { ...user };

      if (authRes.data.user) {
        let userData = authRes.data.user;

        // Merge profile info if exists
        if (profileRes.data.profile) {
          userData = { ...userData, ...profileRes.data.profile };
        }
        currentUserObject = userData;
      }

      // Also refresh status
      if (profileRes.data.hasProfile) {
        setHasProfile(true);
        setProfileStatus(profileRes.data.profile?.status || null);
        
        // Merge premium info into final state (Requirement 4)
        currentUserObject = { 
          ...currentUserObject, 
          is_paid: profileRes.data.is_paid,
          is_premium: profileRes.data.is_premium,
          premium_end_date: profileRes.data.premium_end_date
        };
      }

      setUser(currentUserObject);
      await AsyncStorage.setItem("user", JSON.stringify(currentUserObject));
      console.log("[AUTH_CONTEXT] User and Profile refreshed");
      await refreshInvitationsCount();

    } catch (error) {
      console.error("[AUTH_CONTEXT] Refresh error:", error);
      if (error.response?.status === 401) {
        console.warn("[AUTH_CONTEXT] 🛑 Refresh failed with 401. Logging out...");
        await logout();
      }
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
        logoutAllDevices,
        deleteMyAccount,
        refreshUser,
        updateUser,
        invitationCount,
        refreshInvitationsCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
