import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import api from "../../services/api";
import { COLORS, SPACING, FONT_SIZES } from "../../utils/constants";
import { getProfileImageUri } from "../../utils/imageUtils";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";

const STATUS_COLORS = {
  Pending: { bg: "#FFF9C4", text: "#F57F17", icon: "clock-outline" },
  Accepted: { bg: "#E8F5E9", text: "#2E7D32", icon: "check-circle-outline" },
  Connected: { bg: "#E8F5E9", text: "#2E7D32", icon: "handshake" },
  Rejected: { bg: "#FFEBEE", text: "#C62828", icon: "close-circle-outline" },
};

const InvitationsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("received"); // 'received' | 'sent'

  const isPaid = Number(user?.is_paid) === 1 || Number(user?.is_subscribed) === 1;

  const maskName = (profileId) => {
    return `User ${profileId || "Unknown"}`;
  };

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await api.get("/invitations");
      setInvitations(response.data);
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvitations();
  };

  const handleUpdateInvitation = async (invitationId, status, name) => {
    const confirmMsg =
      status === "Accepted"
        ? `Accept interest from ${name}? They will be able to see your full profile.`
        : `Reject interest from ${name}?`;

    Alert.alert(
      status === "Accepted" ? "Accept Interest?" : "Reject Interest?",
      confirmMsg,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: status,
          style: status === "Accepted" ? "default" : "destructive",
          onPress: async () => {
            try {
              await api.put("/invitations", { invitationId, status });
              Alert.alert(
                status === "Accepted" ? "🎉 Matched!" : "✓ Done",
                status === "Accepted"
                  ? `You are now connected with ${name}!`
                  : "Interest rejected.",
              );
              fetchInvitations();
            } catch (error) {
              Alert.alert(t("error"), t("action_failed"));
            }
          },
        },
      ],
    );
  };

  const renderStatusBadge = (status) => {
    const conf = STATUS_COLORS[status] || STATUS_COLORS.Pending;
    return (
      <View style={[styles.statusBadge, { backgroundColor: conf.bg }]}>
        <MaterialCommunityIcons name={conf.icon} size={12} color={conf.text} />
        <Text style={[styles.statusText, { color: conf.text }]}>{status}</Text>
      </View>
    );
  };

  const renderCard = (item, isReceived = false) => {
    const isPending = item.status === "Pending";
    const isAccepted = item.status === "Accepted";

    return (
      <View key={item.id} style={styles.card}>
        {/* Avatar + Info */}
        <View style={styles.cardHeader}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: getProfileImageUri(item.avatar_url) }}
              style={styles.avatar}
            />
            {isAccepted && (
              <View style={styles.avatarBadge}>
                <MaterialCommunityIcons name="check" size={10} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.name}>
              {isAccepted || isPaid
                ? item.full_name
                : maskName(item.other_user_id)}
            </Text>
            <Text style={styles.meta}>
              {item.age ? `${item.age} yrs` : ""}
              {item.age && item.marital_status ? " · " : ""}
              {item.marital_status || ""}
            </Text>
            {renderStatusBadge(item.status)}
          </View>
          {isAccepted && (
            <TouchableOpacity
              style={styles.viewProfileBtn}
              onPress={() =>
                navigation.navigate("ViewFullProfile", {
                  userId: item.other_user_id,
                })
              }
            >
              <MaterialCommunityIcons
                name="account-details"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.viewProfileText}>View</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions for received pending */}
        {isReceived && isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() =>
                handleUpdateInvitation(item.id, "Rejected", item.full_name)
              }
            >
              <MaterialCommunityIcons
                name="close"
                size={16}
                color={COLORS.error}
              />
              <Text style={styles.rejectBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() =>
                handleUpdateInvitation(item.id, "Accepted", item.full_name)
              }
            >
              <MaterialCommunityIcons name="heart" size={16} color="#fff" />
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer info for sent */}
        {!isReceived && (
          <View style={styles.sentFooter}>
            <MaterialCommunityIcons
              name="send-check-outline"
              size={14}
              color="#aaa"
            />
            <Text style={styles.sentFooterText}>
              {isPending
                ? "Waiting for their response…"
                : isAccepted
                  ? "They accepted! You are now connected."
                  : "They declined your interest."}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const data =
    activeTab === "received" ? invitations.received : invitations.sent;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Invitations</Text>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "received" && styles.tabActive]}
            onPress={() => setActiveTab("received")}
          >
            <MaterialCommunityIcons
              name="inbox-arrow-down"
              size={16}
              color={activeTab === "received" ? COLORS.primary : "#888"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "received" && styles.tabTextActive,
              ]}
            >
              Received ({invitations.received.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "sent" && styles.tabActive]}
            onPress={() => setActiveTab("sent")}
          >
            <MaterialCommunityIcons
              name="send-outline"
              size={16}
              color={activeTab === "sent" ? COLORS.primary : "#888"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "sent" && styles.tabTextActive,
              ]}
            >
              Sent ({invitations.sent.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {data.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name={
                activeTab === "received"
                  ? "inbox-arrow-down-outline"
                  : "send-circle-outline"
              }
              size={64}
              color="#ddd"
            />
            <Text style={styles.emptyTitle}>
              {activeTab === "received"
                ? "No Invitations Yet"
                : "No Sent Requests"}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === "received"
                ? "When someone sends you interest, it will appear here."
                : "Profiles you send interest to will appear here."}
            </Text>
          </View>
        ) : (
          data.map((item) => renderCard(item, activeTab === "received"))
        )}
      </ScrollView>
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
    paddingTop: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
  },
  tabTextActive: {
    color: COLORS.primary,
  },

  // Content
  scrollContent: { padding: SPACING.md, paddingBottom: 30 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start" },
  avatarWrap: { position: "relative" },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  cardInfo: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: "bold", color: "#111", marginBottom: 2 },
  meta: { fontSize: 13, color: "#777", marginBottom: 6 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusText: { fontSize: 11, fontWeight: "700" },

  // View profile button
  viewProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  viewProfileText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },

  // Action row (for received pending)
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error || "#f44336",
  },
  rejectBtnText: {
    color: COLORS.error || "#f44336",
    fontWeight: "700",
    fontSize: 13,
  },
  acceptBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  acceptBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Sent footer
  sentFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sentFooterText: { fontSize: 12, color: "#999", flex: 1 },

  // Empty
  emptyContainer: {
    paddingTop: 60,
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginTop: 16,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});

export default InvitationsScreen;
