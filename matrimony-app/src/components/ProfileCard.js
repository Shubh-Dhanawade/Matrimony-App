import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';
import { getProfileImageUri } from '../utils/imageUtils';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileCard = ({ profile, onInvite, isSuggested = false }) => {
  const renderInvitationAction = () => {
    const status = profile.invitation_status;

    if (status === 'Accepted') {
      return (
        <View style={styles.statusBadgeAccepted}>
          <Icon name="check-circle" size={16} color={COLORS.primary} />
          <Text style={styles.statusTextAccepted}>Connected</Text>
        </View>
      );
    }

    if (status === 'Pending') {
      return (
        <View style={styles.statusBadgePending}>
          <Icon name="schedule" size={16} color="#E67E22" />
          <Text style={styles.statusTextPending}>Pending</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.sendBtn}
        onPress={() => onInvite(profile.user_id)}
        activeOpacity={0.8}
      >
        <Text style={styles.sendBtnText}>Send</Text>
      </TouchableOpacity>
    );
  };

  if (isSuggested) {
    return (
      <View style={styles.suggestedCard}>
        <Image
          source={{ uri: getProfileImageUri(profile.avatar_url) }}
          style={styles.suggestedAvatar}
        />
        <Text style={styles.suggestedName} numberOfLines={1}>{profile.full_name}</Text>
        <Text style={styles.suggestedDetail}>{profile.age} yrs | {profile.marital_status}</Text>
        <TouchableOpacity
          style={styles.suggestedInviteBtn}
          onPress={() => onInvite(profile.user_id)}
          disabled={!!profile.invitation_status}
        >
          <Text style={styles.suggestedInviteText}>
            {profile.invitation_status || 'Invite'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.fullCard}>
      <View style={styles.leftSection}>
        <Image
          source={{ uri: getProfileImageUri(profile.avatar_url) }}
          style={styles.avatar}
        />
      </View>

      <View style={styles.centerSection}>
        <Text style={styles.name}>{profile.full_name}</Text>
        <Text style={styles.detailText}>{profile.age} yrs | {profile.marital_status}</Text>

        <View style={styles.iconInfoRow}>
          <Icon name="school" size={14} color={COLORS.textSecondary} />
          <Text style={styles.subDetailText} numberOfLines={1}>{profile.qualification}</Text>
        </View>

        <View style={styles.iconInfoRow}>
          <Icon name="location-on" size={14} color={COLORS.textSecondary} />
          <Text style={styles.subDetailText} numberOfLines={1}>{profile.birthplace || 'Location N/A'}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {renderInvitationAction()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftSection: {
    marginRight: SPACING.md,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FCE4EC',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  detailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  iconInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subDetailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
    minWidth: 80,
  },

  // Action Buttons & Badges
  sendBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendBtnText: {
    color: COLORS.surface,
    fontWeight: 'bold',
    fontSize: 13,
  },
  statusBadgeAccepted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE4EC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusTextAccepted: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statusBadgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusTextPending: {
    color: '#E67E22',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },

  // Suggested Section Styles
  suggestedCard: {
    width: 150,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginRight: SPACING.md,
    alignItems: 'center',
    elevation: 2,
    marginBottom: SPACING.sm,
  },
  suggestedAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: SPACING.sm,
  },
  suggestedName: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  suggestedDetail: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  suggestedInviteBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  suggestedInviteText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ProfileCard;
