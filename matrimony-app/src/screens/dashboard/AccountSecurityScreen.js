import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { COLORS, SPACING, FONT_SIZES } from "../../utils/constants";
import { getSecurityStatus, updatePrivacy, logoutAllDevices, deleteAccount } from "../../services/api";

const AccountSecurityScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { logout, logoutAllDevices: authLogoutAll, deleteMyAccount: authDeleteAccount } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [securityData, setSecurityData] = useState(null);
  const [privacyOptions] = useState([
    { label: t("privacy_public") || "Public (Everyone)", value: "Public" },
    { label: t("privacy_connected") || "Only Connected Users", value: "Only Connected Users" },
    { label: t("privacy_paid") || "Paid Members Only", value: "Paid Members Only" },
  ]);

  useEffect(() => {
    fetchSecurityStatus();
  }, []);

  const fetchSecurityStatus = async () => {
    try {
      const response = await getSecurityStatus();
      setSecurityData(response.data);
    } catch (error) {
      console.error("Error fetching security status:", error);
      Alert.alert(t("error"), t("failed_to_load_security_data"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrivacy = async (value) => {
    try {
      setLoading(true);
      await updatePrivacy(value);
      setSecurityData(prev => ({ ...prev, privacySetting: value }));
      Alert.alert(t("success"), t("privacy_updated_success") || "Privacy setting updated");
    } catch (error) {
      Alert.alert(t("error"), t("failed_to_update_privacy"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = () => {
    Alert.alert(
      t("logout_all_title") || "Logout From All Devices",
      t("logout_all_confirm") || "Are you sure you want to log out from all other devices?",
      [
        { text: t("cancel"), style: "cancel" },
        { 
          text: t("logout"), 
          style: "destructive", 
          onPress: async () => {
            try {
              setLoading(true);
              await authLogoutAll();
              // AuthContext's logoutAllDevices will call API and then local logout
            } catch (error) {
              Alert.alert(t("error"), t("failed_to_logout_all") || "Failed to logout from all devices");
              setLoading(false);
            }
          } 
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("delete_account_title") || "Delete My Account",
      t("delete_account_confirm") || "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: t("cancel"), style: "cancel" },
        { 
          text: t("delete"), 
          style: "destructive", 
          onPress: async () => {
            try {
              setLoading(true);
              await authDeleteAccount();
            } catch (error) {
              Alert.alert(t("error"), t("failed_to_delete_account") || "Failed to delete account");
              setLoading(false);
            }
          } 
        },
      ]
    );
  };

  if (loading && !securityData) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.container}>
        {/* Login Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("login_activity") || "Login Activity"}</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.textSecondary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{t("last_login_time") || "Last Login Time"}</Text>
                <Text style={styles.infoValue}>
                  {securityData?.lastLogin ? new Date(securityData.lastLogin).toLocaleString() : t("never") || "Never"}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color={COLORS.textSecondary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{t("account_status") || "Account Status"}</Text>
                <Text style={[
                  styles.infoValue, 
                  { color: securityData?.accountStatus === 'active' ? 'green' : COLORS.error, textTransform: 'capitalize' }
                ]}>
                  {securityData?.accountStatus || "N/A"}
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.logoutAllBtn} onPress={handleLogoutAll}>
            <MaterialCommunityIcons name="logout-variant" size={20} color="#fff" />
            <Text style={styles.logoutAllBtnText}>{t("logout_from_all_devices") || "Logout From All Devices"}</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("privacy_settings") || "Privacy Settings"}</Text>
          <View style={styles.card}>
            {privacyOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.radioOption}
                onPress={() => handleUpdatePrivacy(option.value)}
              >
                <MaterialCommunityIcons
                  name={securityData?.privacySetting === option.value ? "radiobox-marked" : "radiobox-blank"}
                  size={24}
                  color={securityData?.privacySetting === option.value ? COLORS.primary : COLORS.textSecondary}
                />
                <Text style={styles.radioLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Blocked Users Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.card, styles.menuItem]} 
            onPress={() => navigation.navigate("BlockedUsers")}
          >
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons name="account-cancel-outline" size={24} color={COLORS.text} />
              <Text style={styles.menuItemLabel}>{t("blocked_users_list") || "Blocked Users List"}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.border} />
          </TouchableOpacity>
        </View>

        {/* Delete Account Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <MaterialCommunityIcons name="delete-forever-outline" size={24} color={COLORS.error} />
            <Text style={styles.deleteBtnText}>{t("delete_my_account") || "Delete My Account"}</Text>
          </TouchableOpacity>
          <Text style={styles.deleteNote}>
            {t("delete_account_note") || "This action will permanently delete your profile, interests, and activity history."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F9FA" },
  container: { flex: 1, padding: SPACING.md },
  section: { marginBottom: SPACING.xl },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  infoTextContainer: { marginLeft: SPACING.md },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, fontWeight: "500", color: COLORS.text, marginTop: 2 },
  logoutAllBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.md,
  },
  logoutAllBtnText: { color: "#fff", fontWeight: "bold", marginLeft: SPACING.sm },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },
  radioLabel: { marginLeft: SPACING.md, fontSize: 16, color: COLORS.text },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuItemLeft: { flexDirection: "row", alignItems: "center" },
  menuItemLabel: { marginLeft: SPACING.md, fontSize: 16, fontWeight: "500", color: COLORS.text },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
  },
  deleteBtnText: { color: COLORS.error, fontWeight: "bold", marginLeft: SPACING.sm },
  deleteNote: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default AccountSecurityScreen;
