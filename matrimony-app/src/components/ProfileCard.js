import React, { memo, useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  FlatList,
  Alert,
} from "react-native";
import { Image } from "expo-image";
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

// Helper: show only first name for unpaid users
const getMaskedName = (fullName, profileId) => {
  if (!fullName) return `User ${profileId || "Unknown"}`;
  const firstChild = fullName.split(" ")[0];
  return firstChild || `User ${profileId || "Unknown"}`;
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
  language, // used to force re-render on language change via memo
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

  const isProfileSubscribed = profile.is_subscribed === 1;

  const rawStatus = (profile.invitation_status || "none").toLowerCase();
  const isConnected = rawStatus === "connected" || rawStatus === "accepted";
  const isPending = rawStatus === "pending";
  const isPreviewUnlocked = Number(isPaid) === 1; // Payment unlocks photo clarity
  const isBlurred = !isPreviewUnlocked;

  // Name masking: Full name only if paid
  const displayName = isPreviewUnlocked
    ? profile.full_name
    : getMaskedName(profile.full_name, profile.user_id);

  const photos = React.useMemo(() => {
    if (profile.photos && profile.photos.length > 0) {
      return profile.photos.map((url) => getProfileImageUri(url));
    }
    // Fallback to avatar_url
    return [getProfileImageUri(profile.avatar_url)];
  }, [profile.photos, profile.avatar_url]);

  // Handlers
  const handleUnlockPreview = () => {
    if (onUpgrade) {
      onUpgrade();
    }
  };

  const handleFollow = async () => {
    if (rawStatus !== "none" && rawStatus !== "") {
      Alert.alert(
        t("connected"),
        isPending
          ? (t("waiting_for_acceptance") || "Waiting for Acceptance")
          : t("connected"),
      );
      return;
    }
    try {
      await api.post("/profiles/interest", { receiverId: profile.user_id });
      Alert.alert(
        t("interest_sent"),
        t("interest_sent_msg").replace("{{name}}", profile.full_name || t("not_specified")),
      );
      if (onAction) onAction("refresh", profile);
    } catch (err) {
      Alert.alert(
        t("error"),
        err?.response?.data?.message || t("action_failed"),
      );
    }
  };

  const handleShortlist = async () => {
    try {
      if (profile.is_shortlisted) {
        // Toggle OFF (Unshortlist)
        await api.delete(`/profiles/shortlist/${profile.user_id}`);
        Alert.alert(
          t("remove"),
          t("shortlisted_msg").replace("{{name}}", profile.full_name || t("profile"))
        );
      } else {
        // Toggle ON (Shortlist)
        await api.post("/profiles/shortlist", { profileUserId: profile.user_id });
        Alert.alert(
          t("shortlisted_title"),
          t("profile_shortlisted_msg")
        );
      }
      if (onAction) onAction("refresh", profile);
    } catch (err) {
      const msg = err?.response?.data?.message;
      Alert.alert(t("error"), msg || t("action_failed"));
    }
  };

  const handleUnfollow = async () => {
    Alert.alert(
      t("cancel_request"),
      t("unsaved_changes_msg").replace(
        "Are you sure you want to go back? Unsaved changes will be lost.",
        `${t("cancel_request")} ${profile.full_name || ""}`
      ) || `${t("cancel_request")} ${profile.full_name || ""}`,
      [
        { text: t("no") || "No", style: "cancel" },
        {
          text: t("yes") || "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/profiles/interest/${profile.user_id}`);
              Alert.alert(
                t("success"),
                t("remove_interest")
              );
              if (onAction) onAction("refresh", profile);
            } catch (err) {
              Alert.alert(
                t("error"),
                err?.response?.data?.message || t("action_failed")
              );
            }
          }
        }
      ]
    );
  };

  const handleViewFullProfile = () => {
    if (!isPreviewUnlocked) {
      if (onUpgrade) onUpgrade();
      return;
    }

    // Per Requirement 3, 4 & 8: Paid users can navigate to reach the state-based locking UI on the detail screen
    if (onViewProfile) onViewProfile(profile.user_id);
  };

  const onMomentumScrollEnd = useCallback((event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    setActivePhotoIndex(index);
  }, []);

  // Per-photo error recovery: track which indices failed so we can swap to fallback
  const [failedIndices, setFailedIndices] = useState({});

  // Reset indices and photo index when profile changes to avoid state "leaks" (Requirement 4)
  useEffect(() => {
    setFailedIndices({});
    setActivePhotoIndex(0);
    // Reset FlatList position if possible
    if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ animated: false, offset: 0 });
    }
  }, [profile.user_id, profile.id]);

  const FALLBACK_AVATAR = require('../../assets/userprofile.png');

  const renderPhoto = useCallback(
    ({ item, index }) => {
      const hasFailed = failedIndices[index];
      return (
        <Image
          source={hasFailed ? FALLBACK_AVATAR : { uri: item }}
          placeholder={FALLBACK_AVATAR}
          contentFit="cover"
          transition={300}
          cachePolicy="disk"
          style={styles.galleryImage}
          blurRadius={isBlurred ? 20 : 0}
          onError={() => {
            setFailedIndices(prev => ({ ...prev, [index]: true }));
          }}
        />
      );
    },
    [isBlurred, failedIndices, FALLBACK_AVATAR],
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
                  (!isPreviewUnlocked || !isConnected) && styles.viewFullProfileBtnLocked
                ]}
                onPress={handleViewFullProfile}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={isConnected && isPreviewUnlocked ? "account-details" : "lock"}
                  size={16}
                  color={isConnected && isPreviewUnlocked ? "#fff" : "rgba(255,255,255,0.7)"}
                />
                <Text style={[
                  styles.viewFullProfileText,
                  (!isConnected || !isPreviewUnlocked) && styles.viewFullProfileTextLocked
                ]}>
                  {!isPreviewUnlocked 
                    ? (t("unlock") || "Unlock")
                    : isConnected 
                      ? t("full_profile") 
                      : isPending 
                        ? (t("pending") || "Pending")
                        : (t("locked") || "Locked")}
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
                    {formatLastActive(profile.last_active_at, t)}
                  </Text>
                </View>
              )}
            </View>
          </View>


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
                size={12}
                color="#ddd"
              />
              <Text style={styles.infoText}>
                {profile.address || profile.birthplace || t("location")}
              </Text>
            </View>

            {isPreviewUnlocked && (
              <>
                <View style={[styles.infoRow, { justifyContent: 'space-between' }]}>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="human-male-height" size={12} color="#ddd" />
                    <Text style={styles.infoText}>{profile.height || t('not_specified')}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="account-group" size={12} color="#ddd" />
                    <Text style={styles.infoText}>{profile.caste || t('not_specified')}</Text>
                  </View>
                </View>

                <View style={[styles.infoRow, { justifyContent: 'space-between' }]}>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="school" size={12} color="#ddd" />
                    <Text style={styles.infoText} numberOfLines={1}>{profile.qualification || profile.occupation || t('not_specified')}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="currency-inr" size={12} color="#ddd" />
                    <Text style={styles.infoText}>{profile.monthly_income ? `₹${profile.monthly_income}` : t('not_specified')}</Text>
                  </View>
                </View>
              </>
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

          {/* Blur Overlay - Moved here to be on top of Gradient/Details */}
          {!isPreviewUnlocked && (
            <BlurView
              intensity={70}
              tint="dark"
              style={StyleSheet.absoluteFill}
            >
                <TouchableOpacity 
                  style={styles.blurOverlay} 
                  onPress={handleUnlockPreview}
                  activeOpacity={0.9}
                >
                  <MaterialCommunityIcons
                    name="eye-off-outline"
                    size={50}
                    color="#fff"
                  />
                  <Text style={styles.blurText}>
                    {t("upgrade_to_view_profiles") || "Upgrade to View Profiles"}
                  </Text>
                  <View style={styles.upgradeBtn}>
                    <Text style={styles.upgradeBtnText}>{t("upgrade_to_view_profiles") || "Upgrade to View Profiles"}</Text>
                  </View>
                </TouchableOpacity>
            </BlurView>
          )}

          {/* Action Row - Prev | Skip | Shortlist | Next */}
          <View style={styles.actionContainer}>
            <ActionButton
              icon="chevron-left"
              label={t("prev")}
              disabled={!!isFirst}
              onPress={() => onAction("prev", profile)}
              size={52}
            />

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
                  ? (t("connected") || "Connected")
                  : isPending
                    ? (t("pending") || "Pending")
                    : (t("send_interest") || t("interested") || "Interest")
              }
              isActive={isConnected || isPending}
              onPress={isPending || isConnected ? handleUnfollow : handleFollow}
              size={52}
            />

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
  const iconColor = "#fff"; // Explicitly white for both states
  const bgColor = isActive 
    ? (icon === 'check-circle' ? '#4CAF50' : COLORS.primary) 
    : isPressed 
      ? COLORS.primary 
      : "rgba(255,255,255,0.15)";
  const borderColor = showAsActive ? (icon === 'check-circle' ? '#4CAF50' : COLORS.primary) : "rgba(255,255,255,0.3)";

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
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 2,
  },
  managedByText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    marginBottom: 4,
    fontStyle: "italic",
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  infoItem: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10 },
  infoText: { color: "#eee", fontSize: 12, marginLeft: 4, fontWeight: "500", flex: 1 },

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
