import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import api from "../../services/api";
import { COLORS, SPACING, FONT_SIZES } from "../../utils/constants";
import { getProfileImageUri } from "../../utils/imageUtils";
import { useAuth } from "../../context/AuthContext";

const STATUS_CONFIG = {
  None: {
    label: "Follow",
    icon: "heart-outline",
    color: "#fff",
    bg: COLORS.primary,
    disabled: false,
  },
  Pending: {
    label: "Pending…",
    icon: "clock-outline",
    color: "#F57F17",
    bg: "#FFF9C4",
    disabled: true,
  },
  Connected: {
    label: "Connected",
    icon: "handshake",
    color: "#2E7D32",
    bg: "#E8F5E9",
    disabled: true,
  },
};

const ShortlistedScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isPaid = Number(user?.is_paid) === 1 || Number(user?.is_subscribed) === 1;

  const fetchShortlisted = useCallback(async () => {
    try {
      console.log("[SHORTLIST_SCREEN] Fetching shortlisted profiles...");
      const res = await api.get("/profiles/shortlisted");
      console.log(
        "[SHORTLIST_SCREEN] Received:",
        res.data.length || "no data",
        "profiles",
      );
      setProfiles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("[SHORTLIST_SCREEN] ❌ Fetch error:", err);
      console.error(
        "[SHORTLIST_SCREEN] Error details:",
        err.response?.data || err.message,
      );
      Alert.alert(
        "Error",
        "Failed to load shortlisted profiles. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh whenever screen gets focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchShortlisted();
    }, [fetchShortlisted]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchShortlisted();
  };

  const handleRemove = (profile) => {
    Alert.alert(
      "Remove from Shortlist",
      `Remove ${profile.full_name || "this profile"} from your shortlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(
                `[SHORTLIST_SCREEN] Removing profile ${profile.user_id}...`,
              );
              await api.delete(`/profiles/shortlist/${profile.user_id}`);
              console.log(`[SHORTLIST_SCREEN] ✅ Removed successfully`);
              setProfiles((prev) =>
                prev.filter((p) => p.user_id !== profile.user_id),
              );
              Alert.alert("Removed", "Profile removed from your shortlist.");
            } catch (err) {
              console.error("[SHORTLIST_SCREEN] ❌ Remove error:", err);
              Alert.alert("Error", "Could not remove. Please try again.");
            }
          },
        },
      ],
    );
  };

  const handleFollow = async (profile) => {
    if (profile.invitation_status !== "None") {
      Alert.alert(
        "Already Connected",
        `You have already ${profile.invitation_status === "Pending" ? "sent an interest to" : "connected with"} this profile.`,
      );
      return;
    }
    try {
      await api.post("/profiles/interest", { receiverId: profile.user_id });
      Alert.alert(
        "💌 Interest Sent",
        `Your request has been sent to ${profile.full_name || "this profile"}.`,
      );
      fetchShortlisted();
    } catch (err) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to send interest.",
      );
    }
  };

  const handleUnfollow = async (profile) => {
    Alert.alert(
      "Cancel Request",
      `Are you sure you want to withdraw your interest from ${profile.full_name || "this user"}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Withdraw",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/profiles/interest/${profile.user_id}`);
              Alert.alert(
                "Request Cancelled",
                `You have withdrawn your interest.`
              );
              fetchShortlisted();
            } catch (err) {
              Alert.alert(
                "Error",
                err?.response?.data?.message || "Failed to cancel request."
              );
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const invStatus = item.invitation_status || "None";
    const statusConf = STATUS_CONFIG[invStatus] || STATUS_CONFIG.None;
    const isConnected = invStatus === "Connected";

    const avatarUri =
      item.photos?.length > 0
        ? getProfileImageUri(item.photos[0])
        : getProfileImageUri(item.avatar_url);

    return (
      <View style={styles.card}>
        {/* Avatar */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("ViewFullProfile", { userId: item.user_id })
          }
          activeOpacity={0.85}
        >
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          {isConnected && (
            <View style={styles.connectedBadge}>
              <MaterialCommunityIcons name="check" size={10} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        {/* Profile Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {isConnected || isPaid
              ? item.full_name
              : maskName(item.user_id)}
            , {item.age}
          </Text>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="map-marker" size={13} color="#999" />
            <Text style={styles.meta} numberOfLines={1}>
              {item.address || item.birthplace || "Location hidden"}
            </Text>
          </View>
          {item.occupation || item.qualification ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons
                name="briefcase-outline"
                size={13}
                color="#999"
              />
              <Text style={styles.meta} numberOfLines={1}>
                {item.occupation || item.qualification}
              </Text>
            </View>
          ) : null}
          {isConnected && item.mobile_number ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="phone" size={13} color="#4CAF50" />
              <Text
                style={[styles.meta, { color: "#4CAF50", fontWeight: "700" }]}
              >
                {item.mobile_number}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Actions column */}
        <View style={styles.actionsCol}>
          {isPaid && (
            <TouchableOpacity
              style={[
                styles.followBtn,
                { backgroundColor: isConnected ? "#4CAF50" : invStatus === "Pending" ? "#FF9800" : COLORS.primary },
              ]}
              onPress={() => (invStatus === "Pending" || isConnected) ? handleUnfollow(item) : handleFollow(item)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={
                  isConnected
                    ? "check-circle"
                    : invStatus === "Pending"
                    ? "clock-outline"
                    : "heart-outline"
                }
                size={14}
                color="#fff"
              />
              <Text style={[styles.followBtnText, { color: "#fff" }]}>
                {isConnected ? t("remove_interest") : invStatus === "Pending" ? t("cancel_request") : t("send_interest")}
              </Text>
            </TouchableOpacity>
          )}

          {/* View Profile button - Enabled only when Connected */}
          <TouchableOpacity
            style={[
              styles.viewBtn,
              invStatus !== "Connected" && styles.viewBtnDisabled,
            ]}
            onPress={() => {
              if (invStatus === "Connected") {
                navigation.navigate("ViewFullProfile", {
                  userId: item.user_id,
                });
              } else {
                Alert.alert(
                  "Not Connected",
                  "You must send an interest and be accepted by this user to view their full profile.",
                );
              }
            }}
            disabled={invStatus !== "Connected"}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.viewBtnText,
                invStatus !== "Connected" && styles.viewBtnDisabledText,
              ]}
            >
              {t("full_profile")}
            </Text>
          </TouchableOpacity>

          {/* Remove from shortlist */}
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemove(item)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="bookmark-remove"
              size={18}
              color="#ccc"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const maskName = (profileId) => {
    return `User ${profileId || "Unknown"}`;
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Shortlist</Text>
        <Text style={styles.headerSub}>
          {profiles.length === 0
            ? "No profiles saved yet"
            : `${profiles.length} profile${profiles.length > 1 ? "s" : ""} saved`}
        </Text>
      </View>

      {profiles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="star-circle-outline"
            size={80}
            color="#ddd"
          />
          <Text style={styles.emptyTitle}>Your shortlist is empty</Text>
          <Text style={styles.emptySub}>
            Tap ⭐ Short List on any profile in the feed to save them here.
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => navigation.navigate("ProfilesFeed")}
          >
            <Text style={styles.exploreBtnText}>Browse Profiles</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => `shortlist-${item.user_id}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  headerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // List
  listContent: { padding: SPACING.md, paddingBottom: 30 },
  separator: { height: 1, backgroundColor: COLORS.border },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },

  // Avatar
  avatarWrap: { position: "relative" },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  connectedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  // Info
  info: {
    flex: 1,
    marginHorizontal: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  meta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },

  // Actions
  actionsCol: {
    alignItems: "center",
    gap: 8,
  },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  viewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  viewBtnText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },
  viewBtnDisabled: {
    borderColor: "#ccc",
    opacity: 0.6,
  },
  viewBtnDisabledText: {
    color: "#999",
  },
  removeBtn: {
    padding: 4,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 16,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 21,
  },
  exploreBtn: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exploreBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default ShortlistedScreen;
