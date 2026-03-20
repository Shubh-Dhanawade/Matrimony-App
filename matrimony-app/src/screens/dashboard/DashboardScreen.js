import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  MARITAL_STATUS_OPTIONS,
} from "../../utils/constants";
import { getProfileImageUri } from "../../utils/imageUtils";
import Swiper from "react-native-deck-swiper";
import ProfileCard from "../../components/ProfileCard";
import useHardwareBack from "../../hooks/useHardwareBack";
import { useTranslation } from "react-i18next";

const { height } = Dimensions.get("window");

const DashboardScreen = ({ navigation }) => {
  const { t } = useTranslation();
  useHardwareBack();
  const { logout, user } = useAuth();
  const isPaidViewer = Number(user?.is_paid) === 1 || Number(user?.is_subscribed) === 1;
  const [myProfile, setMyProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const swiperRef = React.useRef(null);

  const [filters, setFilters] = useState({
    ageMin: "",
    ageMax: "",
    caste: "",
    qualification: "",
    monthly_income: "",
    birthplace: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      console.log("[DASHBOARD] Fetching data for user dashboard...");

      const requests = [
        api.get("/profiles", { params: filters }),
        api.get("/profiles/suggested"),
        api.get("/profiles/me"),
      ];

      const [pRes, sRes, mRes] = await Promise.all(requests);

      setProfiles(pRes.data);
      setSuggested(sRes.data);
      setMyProfile(mRes.data.profile);
      console.log("[DASHBOARD] Data fetch completed successfully");
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert(t("error"), t("error_fetch_profiles"));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const handleSwipedLeft = (index) => {
    const profile = profiles[index];
    if (profile) {
      api
        .post("/profiles/ignore", { receiverId: profile.user_id })
        .catch((err) => console.error("Ignore error:", err));
    }
  };

  const handleSwipedRight = (index) => {
    const profile = profiles[index];
    if (profile) {
      api
        .post("/profiles/interest", { receiverId: profile.user_id })
        .then(() =>
          Alert.alert(
            t("interested_title"),
            t("interested_msg", { name: profile.full_name }),
          ),
        )
        .catch((err) => console.error("Interest error:", err));
    }
  };

  const handleSendInvitation = async (receiverUserId) => {
    try {
      await api.post("/invitations", {
        receiverId: receiverUserId,
      });
      Alert.alert(t("success"), t("invitation_sent_success")); // Need key
      fetchData();
    } catch (error) {
      Alert.alert(
        t("error"),
        error.response?.data?.message || t("action_failed"),
      );
    }
  };

  const handleUpdateInvitation = async (invitationId, status) => {
    try {
      await api.put("/invitations", { invitationId, status });
      Alert.alert("Success", `Invitation ${status.toLowerCase()}!`);
      fetchData();
    } catch (error) {
      Alert.alert("Error", "Failed to update invitation");
    }
  };

  const renderFilterModal = () => (
    <Modal visible={showFilters} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t("filter_profiles")}</Text>
          <ScrollView>
            <Text style={styles.label}>{t("age_range")}</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder={t("min")}
                keyboardType="numeric"
                value={filters.ageMin}
                onChangeText={(v) => setFilters({ ...filters, ageMin: v })}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t("max")}
                keyboardType="numeric"
                value={filters.ageMax}
                onChangeText={(v) => setFilters({ ...filters, ageMax: v })}
              />
            </View>
            <Text style={styles.label}>{t("caste")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("enter_caste")}
              value={filters.caste}
              onChangeText={(v) => setFilters({ ...filters, caste: v })}
            />
            <Text style={styles.label}>{t("qualification")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("qualification_placeholder")}
              value={filters.qualification}
              onChangeText={(v) => setFilters({ ...filters, qualification: v })}
            />
            <Text style={styles.label}>{t("min_income")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("amount")}
              keyboardType="numeric"
              value={filters.incomeMin}
              onChangeText={(v) => setFilters({ ...filters, incomeMin: v })}
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() =>
                setFilters({
                  ageMin: "",
                  ageMax: "",
                  caste: "",
                  qualification: "",
                  incomeMin: "",
                  birthplace: "",
                })
              }
            >
              <Text style={styles.clearBtnText}>{t("clear_all")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyBtnText}>{t("apply")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderUserSummary = () =>
    myProfile && (
      <TouchableOpacity
        style={styles.summaryCard}
        onPress={() => navigation.navigate("ProfileView")}
      >
        <Image
          source={{ uri: getProfileImageUri(myProfile.avatar_url) }}
          style={styles.summaryAvatar}
        />
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryName}>{myProfile.full_name}</Text>
          <Text style={styles.summaryDetail}>
            {myProfile.age} yrs | {myProfile.marital_status}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate("Registration", { isEdit: true })}
        >
          <Text style={styles.editBtnText}>{t("edit")}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );

  // Placeholder for suggested profiles if needed
  const renderSuggested = () =>
    suggested.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("quick_picks")}</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={suggested}
          keyExtractor={(item) => `suggested-${item.user_id}`}
          renderItem={({ item }) => (
            <ProfileCard
              profile={item}
              isSuggested
              onViewProfile={(userId) =>
                navigation.navigate("ViewFullProfile", { userId })
              }
            />
          )}
        />
      </View>
    );

  if (loading && !myProfile) {
    return (
      <ActivityIndicator
        style={styles.loader}
        size="large"
        color={COLORS.primary}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {renderFilterModal()}

      <View style={{ flex: 1 }}>
        <View style={styles.swiperContainer}>
          {profiles.length > 0 ? (
            <Swiper
              cards={profiles}
              renderCard={(card) => (
                <ProfileCard
                  profile={card}
                  isSubscribed={isPaidViewer}
                  isPaid={isPaidViewer}
                  onUpgrade={() => navigation.navigate("Payment")}
                  isFirst={profiles.indexOf(card) === 0}
                  isLast={profiles.indexOf(card) === profiles.length - 1}
                  onViewProfile={(userId) =>
                    navigation.navigate("ViewFullProfile", { userId })
                  }
                  onAction={(action, p) => {
                    if (action === "shortlist" || action === "next") {
                      swiperRef.current?.swipeRight();
                    } else if (action === "skip") {
                      swiperRef.current?.swipeLeft();
                    } else if (action === "prev") {
                      swiperRef.current?.swipeBack();
                    } else if (action === "refresh") {
                      fetchData();
                    }
                  }}
                />
              )}
              onSwipedLeft={handleSwipedLeft}
              onSwipedRight={handleSwipedRight}
              ref={swiperRef}
              cardIndex={0}
              backgroundColor={"transparent"}
              stackSize={3}
              overlap={10}
              infinite={false}
              overlayLabels={{
                left: {
                  title: t("ignored") || "IGNORED",
                  style: {
                    label: {
                      backgroundColor: "red",
                      color: "white",
                      fontSize: 24,
                    },
                    wrapper: {
                      flexDirection: "column",
                      alignItems: "flex-end",
                      justifyContent: "flex-start",
                      marginTop: 30,
                      marginLeft: -30,
                    },
                  },
                },
                right: {
                  title: t("interested") || "INTEREST",
                  style: {
                    label: {
                      backgroundColor: "green",
                      color: "white",
                      fontSize: 24,
                    },
                    wrapper: {
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "flex-start",
                      marginTop: 30,
                      marginLeft: 30,
                    },
                  },
                },
              }}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t("no_more_profiles_show")}</Text>
            </View>
          )}
        </View>

        <View style={{ marginTop: 20 }}>{renderSuggested()}</View>
      </View>
    </SafeAreaView>
  );
};

export const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, 
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.error,
  },
  logoutBtnText: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.sm,
    fontWeight: "bold",
  },

  tabs: { flexDirection: "row" },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: { fontWeight: "600", color: COLORS.textSecondary },
  activeTabText: { color: COLORS.primary },

  scrollContent: { padding: SPACING.md },

  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  summaryAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  summaryInfo: { flex: 1, marginLeft: SPACING.md },
  summaryName: {
    color: COLORS.surface,
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
  },
  summaryDetail: {
    color: COLORS.surface,
    opacity: 0.9,
    fontSize: FONT_SIZES.sm,
  },
  editBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editBtnText: { color: COLORS.surface, fontWeight: "bold" },

  section: { marginBottom: SPACING.lg },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  listHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  filterLink: { color: COLORS.primary, fontWeight: "bold" },

  invSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countText: { color: COLORS.surface, fontSize: 10, fontWeight: "bold" },

  invCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  invHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  invAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
  },
  invInfo: { flex: 1, marginLeft: SPACING.md },
  invName: { fontSize: FONT_SIZES.md, fontWeight: "bold", color: COLORS.text },
  invMeta: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: "#FFF9C4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pendingBadgeText: {
    color: "#FBC02D",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  invBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  actionRow: { flexDirection: "row", gap: SPACING.md },
  modernBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtn: { backgroundColor: COLORS.success },
  rejectBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  btnText: {
    color: COLORS.surface,
    fontWeight: "bold",
    fontSize: FONT_SIZES.sm,
  },

  statusContainer: { alignItems: "center", paddingVertical: 4 },
  matchBadge: {
    backgroundColor: "#FCE4EC",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: SPACING.sm,
  },
  matchBadgeText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: FONT_SIZES.sm,
  },
  viewProfileBtn: { paddingVertical: 4 },
  viewProfileText: {
    color: "black",
    fontWeight: "bold",
    fontSize: FONT_SIZES.sm,
    textDecorationLine: "underline",
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  emptyContainer: {
    padding: SPACING.xl,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 12,
  },
  subTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: { flexDirection: "row" },
  modalActions: { flexDirection: "row", marginTop: SPACING.xl },
  clearBtn: { flex: 1, padding: 16, alignItems: "center" },
  applyBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyBtnText: {
    color: COLORS.surface,
    fontWeight: "bold",
    fontSize: FONT_SIZES.md,
  },
  clearBtnText: { color: COLORS.textSecondary, fontWeight: "bold" },

  loader: { flex: 1, justifyContent: "center" },
  emptyMessage: {
    textAlign: "center",
    marginTop: 30,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  emptyText: { color: COLORS.textSecondary, fontStyle: "italic" },
  swiperContainer: {
    height: height * 0.78,
    marginTop: 0,
  },
});

export default DashboardScreen;
