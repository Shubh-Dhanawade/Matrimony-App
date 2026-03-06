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

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.65;
const CARD_WIDTH = width * 0.92;

const ProfileCard = ({ profile, isSubscribed, onUpgrade, onAction, onViewProfile }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const flatListRef = useRef(null);

  // Build photos array: use profile.photos if available, fallback to avatar_url
  const photos = React.useMemo(() => {
    if (profile.photos && profile.photos.length > 0) {
      return profile.photos.map((url) => getProfileImageUri(url));
    }
    return [getProfileImageUri(profile.avatar_url)];
  }, [profile.photos, profile.avatar_url]);

  const isBlurred = !isSubscribed && !isUnlocked;

  const handleUnlock = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsUnlocked(true);
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

          {/* Blur overlay for non-subscribed users */}
          {!isSubscribed && !isUnlocked && (
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
                    onPress={handleUnlock}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.upgradeBtnText}>Unlock Preview</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
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

            <Text style={styles.nameText}>{profile.full_name}, {profile.age}</Text>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={14} color="#ddd" />
              <Text style={styles.infoText}>{profile.address || 'Location Hidden'}</Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="school" size={14} color="#ddd" />
              <Text style={styles.infoText} numberOfLines={1}>
                {profile.qualification || 'Education not specified'}
              </Text>
            </View>
          </View>

          {/* View Full Profile Button – shown after unlock */}
          {isUnlocked && (
            <TouchableOpacity
              style={styles.viewProfileBtn}
              onPress={() => onViewProfile && onViewProfile(profile.user_id)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="account-details" size={18} color="#fff" />
              <Text style={styles.viewProfileBtnText}>View Full Profile</Text>
            </TouchableOpacity>
          )}

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

  // Existing styles unchanged
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
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
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
  viewProfileBtn: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(233,30,99,0.92)',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 25,
    elevation: 6,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  viewProfileBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },
});

export default memo(ProfileCard);
