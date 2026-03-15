import React, { memo, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  FlatList,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import { COLORS, SPACING, FONT_SIZES } from "../utils/constants";
import { getProfileImageUri } from "../utils/imageUtils";
import { formatLastActive } from "../utils/dateUtils";
import api from "../services/api";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = height * 0.75;
const CARD_WIDTH = width * 0.92;

// Helper: mask all name parts except the first name for unpaid users
const getMaskedName = (profileId) => {
  return `User ${profileId || "Unknown"}`;
};

const ProfileCard = ({
  profile,
  isFirst,
  isLast,
  isSubscribed,
  onUpgrade,
  onAction,
  onViewProfile,
  navigation,
  isPaid,
}) => {
  const { t } = useTranslation();
  const [isFullProfileViewed, setIsFullProfileViewed] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const flatListRef = useRef(null);
  const contentFadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in content whenever profile changes
  React.useEffect(() => {
    contentFadeAnim.setValue(0);
    Animated.timing(contentFadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      delay: 200,
    }).start();
  }, [profile.user_id]);

  const isConnected = profile.invitation_status === "Connected";
  const isPending = profile.invitation_status === "Pending";
  const isPreviewUnlocked = isPaid || isConnected;
  const isBlurred = !isPreviewUnlocked;

  const displayName =
    isConnected || isPaid
      ? profile.full_name
      : getMaskedName(profile.user_id);

  const photos = React.useMemo(() => {
    if (profile.photos && profile.photos.length > 0) {
      return profile.photos.map((url) => getProfileImageUri(url));
    }
    return [getProfileImageUri(profile.avatar_url)];
  }, [profile.photos, profile.avatar_url]);

  // Handlers
  const handleUnlockPreview = () => {
    Alert.alert(
      "Upgrade Required",
      "Only available for paid users. Please upgrade your plan."
    );
    if (onUpgrade) {
      onUpgrade();
    }
  };

  const handleFollow = async () => {
    if (profile.invitation_status !== "None") {
      Alert.alert(
        "Already Connected",
        `You have already ${isPending ? "sent an interest to" : "connected with"} this profile.`,
      );
      return;
    }
    try {
      await api.post("/profiles/interest", { receiverId: profile.user_id });
      Alert.alert(
        "💌 Interest Sent",
        `Your request has been sent to ${profile.full_name || "this profile"}.`,
      );
      if (onAction) onAction("refresh", profile);
    } catch (err) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to send interest.",
      );
    }
  };

  const handleShortlist = async () => {
    try {
      if (profile.is_shortlisted) {
        // Toggle OFF (Unshortlist)
        await api.delete(`/profiles/shortlist/${profile.user_id}`);
        Alert.alert(
          "Removed",
          `${profile.full_name || "Profile"} has been removed from your shortlist.`
        );
      } else {
        // Toggle ON (Shortlist)
        await api.post("/profiles/shortlist", { profileUserId: profile.user_id });
        Alert.alert(
          "⭐ Saved",
          `${profile.full_name || "Profile"} has been added to your shortlist.`
        );
      }
      if (onAction) onAction("refresh", profile);
    } catch (err) {
      const msg = err?.response?.data?.message;
      Alert.alert("Error", msg || "Failed to update shortlist.");
    }
  };

  const handleUnfollow = async () => {
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
              if (onAction) onAction("refresh", profile);
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

  const handleViewFullProfile = () => {
    if (!isConnected) {
      Alert.alert(
        "Locked",
        "Send an interest to this profile and wait for acceptance to view the full profile.",
      );
      return;
    }
    if (onViewProfile) onViewProfile(profile.user_id);
  };

  const onMomentumScrollEnd = useCallback((event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    setActivePhotoIndex(index);
  }, []);

  const renderPhoto = useCallback(
    ({ item }) => (
      <Image
        source={{ uri: item }}
        style={styles.galleryImage}
        blurRadius={isBlurred ? 20 : 0}
      />
    ),
    [isBlurred],
  );

  const keyExtractor = useCallback((_, index) => `photo-${index}`, []);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {/* Photo Gallery */}
          <FlatList
            ref={flatListRef}
            data={photos}
            renderItem={renderPhoto}
            keyExtractor={keyExtractor}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumScrollEnd}
            bounces={false}
          />

          {/* Pagination */}
          {photos.length > 1 && (
            <View style={styles.paginationContainer}>
              {photos.map((_, index) => (
                <View
                  key={`dot-${index}`}
                  style={[
                    styles.paginationDot,
                    index === activePhotoIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Top Info Bar */}
          <View style={styles.topActionsRow}>
            {/* View Full Profile (Left) */}
            <View style={styles.topLeftActions}>
              <TouchableOpacity
                style={[
                  styles.viewFullProfileBtn,
                  !isConnected && styles.viewFullProfileBtnLocked
                ]}
                onPress={handleViewFullProfile}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={isConnected ? "account-details" : "lock"}
                  size={16}
                  color={isConnected ? "#fff" : "rgba(255,255,255,0.7)"}
                />
                <Text style={[
                  styles.viewFullProfileBtnText,
                  !isConnected && { color: "rgba(255,255,255,0.7)" }
                ]}>
                  {t("full_profile")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.topRightActions}>
              {/* Last Seen Badge */}
              {profile.last_active_at && (
                <View style={styles.lastActiveBadge}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={12}
                    color="#fff"
                  />
                  <Text style={styles.lastActiveText}>
                    {formatLastActive(profile.last_active_at)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Blur Overlay */}
          {!isPreviewUnlocked && (
            <BlurView
              intensity={70}
              tint="dark"
              style={StyleSheet.absoluteFill}
            >
              <View style={styles.blurOverlay}>
                <MaterialCommunityIcons
                  name="eye-off-outline"
                  size={50}
                  color="#fff"
                />
                <Text style={styles.blurText}>
                  {t("photo_visible_paid_only")}
                </Text>
                <TouchableOpacity
                  style={styles.upgradeBtn}
                  onPress={handleUnlockPreview}
                >
                  <Text style={styles.upgradeBtnText}>{t("unlock_preview")}</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          )}

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.9)"]}
            style={styles.gradientOverlay}
          />

          {/* Details Overlay */}
          <Animated.View
            style={[styles.detailsContainer, { opacity: contentFadeAnim }]}
          >
            <View style={styles.verifiedRow}>
              {profile.is_verified && (
                <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={12}
                    color="#fff"
                  />
                  <Text style={styles.verifiedText}>{t("verified")}</Text>
                </View>
              )}
              {isConnected && (
                <View style={styles.connectedSmallBadge}>
                  <MaterialCommunityIcons
                    name="handshake"
                    size={12}
                    color="#fff"
                  />
                  <Text style={styles.verifiedText}>{t("connected")}</Text>
                </View>
              )}
            </View>
            <Text style={styles.nameText}>
              {displayName}, {profile.age}
            </Text>
            {profile.profile_managed_by && (
              <Text style={styles.managedByText}>
                👤 {t("profile_managed_by")}: {t(profile.profile_managed_by) || profile.profile_managed_by}
              </Text>
            )}

            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={14}
                color="#ddd"
              />
              <Text style={styles.infoText}>
                {profile.address || profile.birthplace || t("location")}
              </Text>
            </View>

            {isPreviewUnlocked && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="briefcase-outline"
                  size={14}
                  color="#ddd"
                />
                <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                  {profile.company_name
                    ? ` ${profile.occupation || t("not_specified")}`
                    : profile.occupation ||
                    profile.qualification ||
                    t("not_specified")}
                </Text>
              </View>
            )}

            {isConnected && profile.mobile_number && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="phone"
                  size={14}
                  color="#4CAF50"
                />
                <Text
                  style={[
                    styles.infoText,
                    { color: "#4CAF50", fontWeight: "bold" },
                  ]}
                >
                  {profile.mobile_number}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Action Row - Prev | Skip | Shortlist | Next */}
          <View style={styles.actionContainer}>
            <ActionButton
              icon="chevron-left"
              label={t("prev")}
              disabled={!!isFirst}
              onPress={() => onAction("prev", profile)}
              size={52}
            />

            {isPaid && (
              <ActionButton
                icon={
                  isConnected
                    ? "check-circle"
                    : isPending
                      ? "clock-outline"
                      : "heart-outline"
                }
                label={
                  isConnected
                    ? t("remove_interest")
                    : isPending
                      ? t("cancel_request")
                      : t("send_interest")
                }
                isActive={isConnected || isPending}
                onPress={isPending || isConnected ? handleUnfollow : handleFollow}
                size={52}
              />
            )}

            <ActionButton
              icon={profile.is_shortlisted ? "star" : "star-outline"}
              label={t("shortlist")}
              isActive={profile.is_shortlisted}
              onPress={handleShortlist}
              size={52}
            />

            <ActionButton
              icon="chevron-right"
              label={t("next")}
              isActive={true} // Next is always highlighted per requirements
              disabled={!!isLast}
              onPress={() => onAction("next", profile)}
              size={52}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const ActionButton = ({
  icon,
  label,
  onPress,
  isActive = false,
  size = 52,
  disabled = false,
}) => {
  const animatedValue = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    if (!disabled) {
      setIsPressed(true);
      Animated.spring(animatedValue, {
        toValue: 0.9,
        useNativeDriver: true,
      }).start();
    }
  };
  const handlePressOut = () => {
    if (!disabled) {
      setIsPressed(false);
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  // Determine if the button should show as highlighted (primary color)
  const showAsActive = isActive || isPressed;
  const iconColor = showAsActive ? "#fff" : "#fff"; // Default icon is white
  const bgColor = showAsActive ? COLORS.primary : "rgba(255,255,255,0.15)";
  const borderColor = showAsActive ? COLORS.primary : "rgba(255,255,255,0.3)";

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.8}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={disabled ? null : onPress}
      style={[styles.actionBtnWrapper, disabled && { opacity: 0.3 }]}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.circleBtn,
          { width: size, height: size, borderRadius: size / 2 },
          { backgroundColor: bgColor, borderColor: borderColor },
          showAsActive && { elevation: 8 },
          { transform: [{ scale: animatedValue }] },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={size * 0.5}
          color={iconColor}
        />
      </Animated.View>
      <Text
        style={[
          styles.actionLabel,
          showAsActive && !disabled && { color: COLORS.primary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  card: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
  },
  imageContainer: { flex: 1, position: "relative" },
  galleryImage: { width: CARD_WIDTH, height: "100%", resizeMode: "cover" },

  paginationContainer: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    zIndex: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 4,
  },
  paginationDotActive: { backgroundColor: "#fff", width: 22 },

  topActionsRow: {
    position: "absolute",
    top: 15,
    left: 15,
    right: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 20,
  },
  topLeftActions: { flexDirection: "row", alignItems: "center" },
  topRightActions: { flexDirection: "row", alignItems: "center", gap: 8 },

  lastActiveBadge: {
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  lastActiveText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },

  followBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 6,
  },
  followBtnDisabled: { backgroundColor: "rgba(0,0,0,0.5)", elevation: 0 },
  followBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 5,
  },

  viewFullProfileBtn: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 6,
  },
  viewFullProfileBtnLocked: {
    backgroundColor: "rgba(0,0,0,0.5)",
    elevation: 0,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  viewFullProfileBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 11,
    marginLeft: 5,
  },

  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  blurText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 15,
    fontWeight: "600",
    paddingHorizontal: 20,
  },
  upgradeBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  upgradeBtnText: { color: "#fff", fontWeight: "bold" },

  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "45%",
  },
  detailsContainer: { position: "absolute", bottom: 100, left: 20, right: 20 },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    gap: 6,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  connectedSmallBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 3,
  },

  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 2,
  },
  managedByText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginBottom: 8,
    fontStyle: "italic",
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  infoText: { color: "#eee", fontSize: 14, marginLeft: 6, fontWeight: "500", flex: 1 },

  actionContainer: {
    position: "absolute",
    bottom: 15,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionBtnWrapper: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  },
  circleBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    elevation: 8,
  },
  actionLabel: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export default memo(ProfileCard);
