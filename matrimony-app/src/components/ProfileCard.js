import React, { memo } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
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

const ProfileCard = ({ profile, isSubscribed, onUpgrade, onAction }) => {
  const [isUnlocked, setIsUnlocked] = React.useState(false);

  const imageUrl = getProfileImageUri(profile.avatar_url);

  const isBlurred = !isSubscribed && !isUnlocked;

  const handleUnlock = () => {
    // Smooth transition for unlock
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsUnlocked(true);
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            blurRadius={isBlurred ? 20 : 0}
          />

          {/* Bottom Gradient Overlay - Render always but change opacity or keep if needed for text readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,1)']}
            style={styles.gradientOverlay}
            pointerEvents="none"
          />

          {/* Conditional Rendering: Only show blur overlay if blocked AND not unlocked locally */}
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
              <Text style={styles.statusBadgeText}>
                {profile.invitation_status === 'Connected' ? '🤝 Connected' : ''}
              </Text>
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

          {/* Fixed Action Button Container (Bottom) */}
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
    width: width * 0.92,
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
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
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
  }
});

export default memo(ProfileCard);
