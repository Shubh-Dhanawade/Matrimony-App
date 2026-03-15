import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { COLORS, SPACING } from "../../utils/constants";
import { getBlockedUsers, unblockUser } from "../../services/api";
import { getProfileImageUri } from "../../utils/imageUtils";

const BlockedUsersScreen = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const response = await getBlockedUsers();
      setBlockedUsers(response.data.blockedUsers);
    } catch (error) {
      console.error("Error fetching blocked users:", error);
      Alert.alert(t("error"), t("failed_to_load_blocked_users"));
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = (userId) => {
    Alert.alert(
      t("unblock_title") || "Unblock User",
      t("unblock_confirm") || "Are you sure you want to unblock this user?",
      [
        { text: t("cancel"), style: "cancel" },
        { 
          text: t("unblock") || "Unblock", 
          onPress: async () => {
            try {
              await unblockUser(userId);
              setBlockedUsers(prev => prev.filter(u => u.user_id !== userId));
            } catch (error) {
              Alert.alert(t("error"), t("failed_to_unblock_user"));
            }
          } 
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.userCard}>
      <Image
        source={{ uri: getProfileImageUri(item.avatar_url) }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name}</Text>
      </View>
      <TouchableOpacity 
        style={styles.unblockBtn} 
        onPress={() => handleUnblock(item.user_id)}
      >
        <Text style={styles.unblockBtnText}>{t("unblock") || "Unblock"}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {blockedUsers.length > 0 ? (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.user_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-off-outline" size={64} color={COLORS.border} />
          <Text style={styles.emptyText}>{t("no_blocked_users") || "No blocked users"}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F9FA" },
  listContent: { padding: SPACING.md },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#eee" },
  userInfo: { flex: 1, marginLeft: SPACING.md },
  userName: { fontSize: 16, fontWeight: "500", color: COLORS.text },
  unblockBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  unblockBtnText: { color: COLORS.primary, fontWeight: "600" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.xl },
  emptyText: { marginTop: SPACING.md, fontSize: 16, color: COLORS.textSecondary },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default BlockedUsersScreen;
