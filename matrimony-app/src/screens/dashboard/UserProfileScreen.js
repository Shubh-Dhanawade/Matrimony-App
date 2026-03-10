import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { COLORS, SPACING, FONT_SIZES } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";
import { getProfileImageUri } from "../../utils/imageUtils";
import LanguageSelector from "../../components/LanguageSelector";
import api from "../../services/api";

const UserProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMyProfile();
      refreshUser();
    }, []),
  );

  const fetchMyProfile = async () => {
    try {
      const response = await api.get("/profiles/me");
      setProfile(response.data.profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t("confirm_logout"), t("logout_message"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("logout"), style: "destructive", onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: getProfileImageUri(profile?.avatar_url) }}
            style={styles.avatar}
          />
          <TouchableOpacity
            style={styles.editIcon}
            onPress={() =>
              navigation.navigate("Registration", { isEdit: true })
            }
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{profile?.full_name || t("my_profile")}</Text>
        <Text style={styles.status}>
          {Number(user?.is_subscribed) === 1
            ? t("premium_member")
            : t("free_member")}
        </Text>
        {profile?.profile_managed_by && (
          <Text
            style={[
              styles.status,
              { fontStyle: "italic", fontSize: 13, marginTop: 2 },
            ]}
          >
            {t("profile_managed_by")}: {t(profile.profile_managed_by) || profile.profile_managed_by}
          </Text>
        )}
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity
          style={styles.shortlistCartBtn}
          onPress={() => navigation.navigate("Shortlist")}
          activeOpacity={0.8}
        >
          <View style={styles.cartIconContainer}>
            <MaterialCommunityIcons name="star" size={28} color="#fff" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {profile?.shortlist_count || "0"}
              </Text>
            </View>
          </View>
          <View style={styles.cartTextContainer}>
            <Text style={styles.cartTitle}>{t("shortlisted_profiles")}</Text>
            <Text style={styles.cartSub}>
              {t("manage_saved_profiles")}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionContainer}>
        <LanguageSelector />
      </View>

      <View style={styles.contactInfoContainer}>
        <Text style={styles.sectionTitle}>
          {t("contact_details") || "Contact Details"}
        </Text>
        <Text style={styles.contactText}>
          📞 {t("phone_number_req") ? t("phone_number_req").replace(' *', '') : "Phone"}: {profile?.phone_number || "N/A"}
        </Text>
        <Text style={styles.contactText}>
          💬 {t("whatsapp_number") ? t("whatsapp_number").replace(' Number', '').replace(' number', '') : "WhatsApp"}: {profile?.whatsapp_number || "N/A"}
        </Text>
      </View>

      <View style={styles.menu}>
        <MenuItem
          icon="account-outline"
          label={t("edit_personal_info")}
          onPress={() => navigation.navigate("Registration", { isEdit: true })}
        />
        <MenuItem
          icon="shield-check-outline"
          label={t("account_security")}
          onPress={() => { }}
        />
        {Number(user?.is_subscribed) !== 1 && (
          <MenuItem
            icon="crown-outline"
            label={t("upgrade_to_premium")}
            onPress={() => navigation.navigate("Upgrade")}
            color="#E91E63"
          />
        )}
        <MenuItem
          icon="help-circle-outline"
          label={t("help_support")}
          onPress={() => { }}
        />
        <MenuItem
          icon="logout"
          label={t("logout")}
          onPress={handleLogout}
          color="#F44336"
        />
      </View>
    </ScrollView>
  );
};

const StatBox = ({ label, value, icon, onPress }) => (
  <TouchableOpacity
    style={styles.statBox}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.7}
  >
    <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const MenuItem = ({ icon, label, onPress, color = "#333" }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color={color} />
    <Text style={[styles.menuLabel, { color }]}>{label}</Text>
    <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    backgroundColor: "#fff",
    padding: 30,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eee",
  },
  editIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  name: { fontSize: 24, fontWeight: "bold", color: "#333" },
  status: { fontSize: 16, color: COLORS.textSecondary, marginTop: 5 },
  statsRow: {
    paddingHorizontal: SPACING.md,
    marginTop: 15,
    marginBottom: 5,
  },
  shortlistCartBtn: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cartIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FFB300",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  cartTextContainer: {
    flex: 1,
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  cartSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statBox: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "bold", color: "#333", marginTop: 5 },
  statLabel: { fontSize: 12, color: "#666" },
  menu: { backgroundColor: "#fff", marginTop: 10, paddingVertical: 10 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },
  menuLabel: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: "500" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionContainer: {
    marginTop: 10,
    paddingHorizontal: SPACING.md,
  },
  contactInfoContainer: {
    backgroundColor: "#fff",
    padding: 20,
    marginHorizontal: SPACING.md,
    marginTop: 10,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  contactText: { fontSize: 16, color: "#555", marginBottom: 5 },
});

export default UserProfileScreen;
