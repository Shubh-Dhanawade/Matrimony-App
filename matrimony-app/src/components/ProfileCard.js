import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';

const ProfileCard = ({ profile, onInvite, isSuggested = false }) => {
  return (
    <View style={[styles.card, isSuggested ? styles.suggestedCard : styles.fullCard]}>
      <Image
        source={{ uri: profile.avatar_url || 'https://via.placeholder.com/150' }}
        style={isSuggested ? styles.suggestedAvatar : styles.avatar}
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{profile.full_name}</Text>
        <Text style={styles.detail}>{profile.age} yrs | {profile.marital_status}</Text>
        {!isSuggested && (
          <>
            <Text style={styles.detail}>{profile.occupation} | {profile.qualification}</Text>
            <Text style={styles.detail}>{profile.caste} | {profile.birthplace}</Text>
          </>
        )}
      </View>
      <TouchableOpacity 
        style={[styles.inviteButton, isSuggested && styles.suggestedInvite]} 
        onPress={() => onInvite(profile.user_id)}
      >
        <Text style={styles.inviteText}>{isSuggested ? 'Invite' : 'Send Invitation'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fullCard: {
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestedCard: {
    width: 160,
    marginRight: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30, marginRight: SPACING.md
  },
  suggestedAvatar: {
    width: 80, height: 80, borderRadius: 40, marginBottom: SPACING.sm
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  detail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  inviteButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  suggestedInvite: {
    marginTop: SPACING.sm,
    width: '100%',
    alignItems: 'center',
  },
  inviteText: {
    color: COLORS.surface,
    fontWeight: 'bold',
    fontSize: FONT_SIZES.sm,
  },
});

export default ProfileCard;
