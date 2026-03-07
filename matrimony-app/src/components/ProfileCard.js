import React, { memo, useState, useRef, useCallback } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_BASE_URL, COLORS, SPACING, FONT_SIZES } from '../utils/constants';
import { getProfileImageUri } from '../utils/imageUtils';
import { formatLastActive } from '../utils/dateUtils';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.65;
const CARD_WIDTH = width * 0.92;

// ─── Helper: mask all name parts except the last, which shows only first letter ───
// Example: "Om Karan Sharma" → "Om Karan S."
const getMaskedName = (fullName) => {
  if (!fullName) return 'Unknown';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return `${parts[0][0]}.`;
  const lastName = parts[parts.length - 1];
  const otherNames = parts.slice(0, -1).join(' ');
  return `${otherNames} ${lastName[0]}.`;
};

const ProfileCard = ({ profile, isSubscribed, onUpgrade, onAction, onViewProfile, navigation }) => {
  // STEP 4 — Two-state logic
  const [isPreviewUnlocked, setIsPreviewUnlocked] = useState(false);
  const [isFullProfileViewed, setIsFullProfileViewed] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const flatListRef = useRef(null);

  // Build photos array: use profile.photos if available, fallback to avatar_url
  const photos = React.useMemo(() => {
    if (profile.photos && profile.photos.length > 0) {
      return profile.photos.map((url) => getProfileImageUri(url));
    }
    return [getProfileImageUri(profile.avatar_url)];
  }, [profile.photos, profile.avatar_url]);

  // Derived: is the photo blurred?
  const isBlurred = !isPreviewUnlocked;

  // ── Handlers ──────────────────────────────────────────────────────────────

  // STEP 2 — Unlock Preview: remove blur, reveal "View Full Profile" button
  const handleUnlockPreview = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsPreviewUnlocked(true);
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
  const renderPhoto = useCallback(({ item }) => (
    <Image
      source={{ uri: item }}
      style={styles.galleryImage}
      blurRadius={isBlurred ? 20 : 0}
    />
  ), [isBlurred]);

  const keyExtractor = useCallback((_, index) => `photo-${index}`, []);

  // STEP 6 — Displayed name follows state rules
  const displayName = isFullProfileViewed
    ? profile.full_name
    : getMaskedName(profile.full_name);

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
            colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,1)']}
            style={styles.gradientOverlay}
            pointerEvents="none"
          />

          {/* Top Right "Last Active" Badge */}
          {profile.last_active_at ? (
            <View style={styles.lastActiveBadge}>
              <MaterialCommunityIcons name="clock-outline" size={12} color="#fff" />
              <Text style={styles.lastActiveText}>
                {formatLastActive(profile.last_active_at)}
              </Text>
            </View>
          ) : null}

          {/* ── STEP 1: Blur overlay + Unlock Preview button ── */}
          {!isPreviewUnlocked && (
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill}>
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

          {/* ── STEP 2: View Full Profile button (after unlock, before viewed) ── */}
          {isPreviewUnlocked && (
            <TouchableOpacity
              style={styles.viewProfileBtn}
              onPress={handleViewFullProfile}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="account-details" size={18} color="#fff" />
              <Text style={styles.viewProfileBtnText}>View Full Profile</Text>
            </TouchableOpacity>
          )}

          {/* Details Overlay (Bottom Left) */}
          <View style={styles.detailsContainer} pointerEvents="box-none">
            <View style={styles.verifiedRow}>
              {profile.is_verified && (
                <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={12} color="#fff" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
              {profile.invitation_status === 'Connected' && (
                <Text style={styles.statusBadgeText}>🤝 Connected</Text>
              )}
            </View>

            {/* Name and Age/Status */}
            <Text style={styles.nameText} numberOfLines={1}>
              {isPreviewUnlocked ? profile.full_name : getMaskedName(profile.full_name, profile.gender)}, {profile.age}
            </Text>

            {profile.profile_managed_by && (
              <Text style={styles.managedByText}>
                👤 Managed by {profile.profile_managed_by}
              </Text>
            )}

            {/* Location row — always shown */}
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={14} color="#ddd" />
              <Text style={styles.infoText}>{profile.address || 'Location Hidden'}</Text>
            </View>

            {/* Education row — only shown after preview unlocked */}
            {isPreviewUnlocked && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="school" size={14} color="#ddd" />
                <Text style={styles.infoText} numberOfLines={1}>
                  {profile.qualification || 'Education not specified'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionContainer} pointerEvents="box-none">
            <ActionButton
              icon="close"
              label="Skip"
              color="#9E9E9E"
              onPress={() => onAction('skip', profile)}
            />
            <ActionButton
              icon="star"
              label="Shortlist"
              color="#FF9800"
              onPress={() => onAction('shortlist', profile)}
            />
            <ActionButton
              icon="heart"
              label="Interest"
              color="#fff"
              isPrimary
              onPress={() => onAction('interested', profile)}
            />
            <ActionButton
              icon="message-text"
              label="Chat"
              color="#4CAF50"
              onPress={() => onAction('chat', profile)}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const ActionButton = ({ icon, label, color, onPress, isPrimary }) => {
  const animatedValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(animatedValue, {
      toValue: 0.85,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={styles.actionBtnWrapper}
    >
      <Animated.View style={[
        styles.circleBtn,
        isPrimary && styles.primaryBtn,
        { transform: [{ scale: animatedValue }] }
      ]}>
        <MaterialCommunityIcons name={icon} size={28} color={isPrimary ? '#fff' : color} />
      </Animated.View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    height: CARD_HEIGHT + 30,
    width: width,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  card: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    backgroundColor: '#000',
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  galleryImage: {
    width: CARD_WIDTH,
    height: '100%',
    resizeMode: 'cover',
  },

  // Pagination dots
  paginationContainer: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 22,
    borderRadius: 4,
    borderColor: '#fff',
  },

  // Blur overlay (STEP 1)
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContent: {
    alignItems: 'center',
    padding: 20,
  },
  blurText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 15,
    fontWeight: '600',
  },
  upgradeBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  upgradeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Last Active Top Badge
  lastActiveBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    zIndex: 15, // ensures it sits above images but below popups
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  lastActiveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },

  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
  },

  // "View Full Profile" button pinned to top left (STEP 2)
  viewProfileBtn: {
    position: 'absolute',
    top: 15,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(233,30,99,0.85)', // slightly more transparent pink
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.4)',
    elevation: 5,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  viewProfileBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
    marginLeft: 4,
  },

  // Details overlay
  detailsContainer: {
    position: 'absolute',
    bottom: 95,
    left: 20,
    right: 20,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  managedByText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginBottom: 6,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    color: '#ddd',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },

  // Action buttons row
  actionContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  actionBtnWrapper: {
    alignItems: 'center',
  },
  circleBtn: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 5,
  },
  primaryBtn: {
    backgroundColor: '#E91E63',
    transform: [{ scale: 1.1 }],
  },
  actionLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default memo(ProfileCard);
