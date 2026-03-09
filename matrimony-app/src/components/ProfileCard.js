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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { API_BASE_URL, COLORS, SPACING, FONT_SIZES } from "../utils/constants";
import { getProfileImageUri } from "../utils/imageUtils";
import { formatLastActive } from "../utils/dateUtils";

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

// ─── Helper: mask all name parts except the last, which shows only first letter ───
// Example: "Om Karan Sharma" → "Om Karan S."
const getMaskedName = (fullName) => {
  if (!fullName) return "Unknown";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return `${parts[0][0]}.`;
  const lastName = parts[parts.length - 1];
  const otherNames = parts.slice(0, -1).join(" ");
  return `${otherNames} ${lastName[0]}.`;
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
}) => {
  const [isFullProfileViewed, setIsFullProfileViewed] = useState(false);
  const [isPreviewUnlockedState, setIsPreviewUnlockedState] = useState(false);
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
      delay: 200, // delay slightly so card is already sliding in
    }).start();
  }, [profile.user_id]);

  // Auto-unlock preview if subscribed OR already connected
  const isConnected = profile.invitation_status === "Connected";

  // Derived: is the preview unlocked? (Always true for subscribers/connected)
  const isPreviewUnlocked = isSubscribed;

  // Derived: is the photo blurred?
  const isBlurred = !isPreviewUnlocked;

  // STEP 6 — Displayed name: full name if connected, subscribed, or fully viewed, else masked
  const displayName =
    isConnected || isFullProfileViewed || isSubscribed
      ? profile.full_name
      : getMaskedName(profile.full_name);

  console.log(
    `[ProfileCard] Profile: ${profile.full_name}, Status: ${profile.invitation_status}, Subscribed: ${isSubscribed}`,
  );

  // Build photos array: use profile.photos if available, fallback to avatar_url
  const photos = React.useMemo(() => {
    if (profile.photos && profile.photos.length > 0) {
      return profile.photos.map((url) => getProfileImageUri(url));
    }
    return [getProfileImageUri(profile.avatar_url)];
  }, [profile.photos, profile.avatar_url]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  // Unlock Preview: remove blur
  const handleUnlockPreview = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsPreviewUnlockedState(true);
  };

  // STEP 3 — View Full Profile: mark viewed (shows full name on card) + navigate
  const handleViewFullProfile = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFullProfileViewed(true);
    if (onViewProfile) {
      onViewProfile(profile.user_id);
    }
  };

  // Track active photo on scroll
  const onMomentumScrollEnd = useCallback((event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    setActivePhotoIndex(index);
  }, []);

  // Render a single gallery photo
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
          {/* Horizontal Photo Gallery */}
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
            getItemLayout={(_, index) => ({
              length: CARD_WIDTH,
              offset: CARD_WIDTH * index,
              index,
            })}
          />

          {/* Pagination Dots */}
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

          {/* Bottom Gradient Overlay */}
          <LinearGradient
            colors={[
              "transparent",
              "rgba(255, 255, 255, 0.5)",
              "rgba(0,0,0,1)",
            ]}
            style={styles.gradientOverlay}
            pointerEvents="none"
          />

          {/* Top Right "Last Active" Badge */}
          {profile.last_active_at ? (
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
          ) : null}

          {/* ── STEP 1: Blur overlay + Unlock Preview button ── */}
          {!isPreviewUnlocked && (
            <BlurView
              intensity={70}
              tint="dark"
              style={StyleSheet.absoluteFill}
            >
              <View style={styles.blurOverlay}>
                <View style={styles.blurContent}>
                  <MaterialCommunityIcons
                    name="eye-off-outline"
                    size={50}
                    color="#fff"
                  />
                  <Text style={styles.blurText}>
                    Photo visible to paid members only
                  </Text>
                  <TouchableOpacity
                    style={styles.upgradeBtn}
                    onPress={handleUnlockPreview}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.upgradeBtnText}>Unlock Preview</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          )}

          {/* ── STEP 2: View Full Profile button (after unlock, before viewed, NOT for subscribers) ── */}
          {isPreviewUnlocked &&
            !isFullProfileViewed &&
            !isConnected &&
            !isSubscribed && (
              <TouchableOpacity
                style={styles.viewProfileBtn}
                onPress={handleViewFullProfile}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="account-details"
                  size={18}
                  color="#fff"
                />
                <Text style={styles.viewProfileBtnText}>View Full Profile</Text>
              </TouchableOpacity>
            )}

          {/* Details Overlay (Bottom Left) */}
          <Animated.View
            style={[styles.detailsContainer, { opacity: contentFadeAnim }]}
            pointerEvents="box-none"
          >
            <View style={styles.verifiedRow}>
              {profile.is_verified && (
                <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={12}
                    color="#fff"
                  />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
              {isConnected && (
                <View style={styles.connectedBadge}>
                  <MaterialCommunityIcons
                    name="handshake"
                    size={12}
                    color="#fff"
                  />
                  <Text style={styles.verifiedText}>Connected</Text>
                </View>
              )}
            </View>

            {/* Name and Age */}
            <Text style={styles.nameText} numberOfLines={1}>
              {displayName}, {profile.age}
            </Text>

            {profile.profile_managed_by && (
              <Text style={styles.managedByText}>
                👤 {profile.profile_managed_by}
              </Text>
            )}

            {/* Location — always shown */}
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={14}
                color="#ddd"
              />
              <Text style={styles.infoText}>
                {profile.address || profile.birthplace || "Location Hidden"}
              </Text>
            </View>

            {/* Education / occupation — shown if subscribed or connected */}
            {isPreviewUnlocked && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="briefcase-outline"
                  size={14}
                  color="#ddd"
                />
                <Text style={styles.infoText} numberOfLines={1}>
                  {profile.occupation ||
                    profile.qualification ||
                    "Not specified"}
                </Text>
              </View>
            )}

            {/* Phone — only shown when connected */}
            {isConnected && profile.mobile_number ? (
              <View style={[styles.infoRow, { marginTop: 6 }]}>
                <MaterialCommunityIcons
                  name="phone"
                  size={14}
                  color="#4CAF50"
                />
                <Text
                  style={[
                    styles.infoText,
                    { color: "#4CAF50", fontWeight: "700" },
                  ]}
                >
                  {profile.mobile_number}
                </Text>
              </View>
            ) : null}
          </Animated.View>

          {/* ── Action Buttons ── */}
          <View style={styles.actionContainer} pointerEvents="box-none">
            <ActionButton
              icon="chevron-left"
              label="Prev"
              color="#757575"
              disabled={isFirst}
              onPress={() => onAction("prev", profile)}
            />
            <ActionButton
              icon="close"
              label="Skip"
              color="#FF5252"
              onPress={() => onAction("skip", profile)}
            />
            <ActionButton
              icon="star"
              label="Shortlist"
              color="#FFB300"
              onPress={() => onAction("shortlist", profile)}
            />
            <ActionButton
              icon="chevron-right"
              label="Next"
              color="#fff"
              isPrimary
              disabled={isLast}
              onPress={() => onAction("next", profile)}
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
  color,
  onPress,
  isPrimary,
  size = 52,
  disabled = false,
}) => {
  const animatedValue = new Animated.Value(1);

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(animatedValue, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.7}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={disabled ? null : onPress}
      style={[styles.actionBtnWrapper, disabled && { opacity: 0.4 }]}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.circleBtn,
          { width: size, height: size, borderRadius: size / 2 },
          isPrimary && styles.primaryBtn,
          disabled && {
            backgroundColor: "rgba(255,255,255,0.1)",
            elevation: 0,
          },
          { transform: [{ scale: animatedValue }] },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={size * 0.5}
          color={
            disabled ? "rgba(255,255,255,0.2)" : isPrimary ? "#fff" : color
          }
        />
      </Animated.View>
      <Text
        style={[
          styles.actionLabel,
          isPrimary && !disabled && { color: COLORS.primary },
          disabled && { color: "rgba(255,255,255,0.2)" },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  imageContainer: {
    flex: 1,
    position: "relative",
  },
  galleryImage: {
    width: CARD_WIDTH,
    height: "100%",
    resizeMode: "cover",
  },

  // Pagination dots
  paginationContainer: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  paginationDotActive: {
    backgroundColor: "#fff",
    width: 22,
    borderRadius: 4,
    borderColor: "#fff",
  },

  // Blur overlay (STEP 1)
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  blurContent: {
    alignItems: "center",
    padding: 20,
  },
  blurText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 15,
    fontWeight: "600",
  },
  upgradeBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  upgradeBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  // Last Active Top Badge
  lastActiveBadge: {
    position: "absolute",
    top: 15,
    right: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    zIndex: 15, // ensures it sits above images but below popups
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  lastActiveText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },

  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "45%",
  },

  // "View Full Profile" button pinned to top left (STEP 2)
  viewProfileBtn: {
    position: "absolute",
    top: 15,
    left: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(233,30,99,0.85)", // slightly more transparent pink
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 20,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.4)",
    elevation: 5,
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  viewProfileBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 11,
    marginLeft: 4,
  },

  // Details overlay
  detailsContainer: {
    position: "absolute",
    bottom: 95,
    left: 20,
    right: 20,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  verifiedText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
    marginLeft: 2,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  nameText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  managedByText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    marginBottom: 6,
    fontWeight: "500",
    fontStyle: "italic",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  infoText: {
    color: "#ddd",
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "500",
  },

  // Action buttons
  actionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 5,
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  actionBtnWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  circleBtn: {
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    marginBottom: 8,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
  },
  actionLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export default memo(ProfileCard);
