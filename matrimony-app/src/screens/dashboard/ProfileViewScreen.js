import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';

const ProfileViewScreen = ({ navigation, route }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profiles/me');
      setProfile(response.data.profile);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderDetailRow = (label, value) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value || 'N/A'}</Text>
    </View>
  );

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/150' }} style={styles.avatar} />
          <Text style={styles.name}>{profile?.full_name}</Text>
          <Text style={styles.subtext}>{profile?.age} years | {profile?.marital_status}</Text>
        </View>

        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => navigation.navigate('Registration', { isEdit: true })}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          {renderDetailRow('Father Name', profile?.father_name)}
          {renderDetailRow('Mother Name', profile?.mother_maiden_name)}
          {renderDetailRow('Gender', profile?.gender)}
          {renderDetailRow('Birthplace', profile?.birthplace)}
          {renderDetailRow('Address', profile?.address)}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Professional Information</Text>
          {renderDetailRow('Qualification', profile?.qualification)}
          {renderDetailRow('Occupation', profile?.occupation)}
          {renderDetailRow('Monthly Income', profile?.monthly_income)}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Community Information</Text>
          {renderDetailRow('Caste', profile?.caste)}
          {renderDetailRow('Sub-Caste', profile?.sub_caste)}
          {renderDetailRow('Relative Surname', profile?.relative_surname)}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Expectations</Text>
          <Text style={styles.longValue}>{profile?.expectations || 'No expectations listed.'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md },
  loader: { flex: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: SPACING.lg },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: SPACING.md, borderWidth: 3, borderColor: COLORS.primary },
  name: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.text },
  subtext: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  editButton: { backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: SPACING.lg },
  editButtonText: { color: COLORS.surface, fontWeight: 'bold', fontSize: FONT_SIZES.md },
  card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.md, elevation: 2 },
  cardTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  label: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, fontWeight: '600' },
  value: { fontSize: FONT_SIZES.md, color: COLORS.text },
  longValue: { fontSize: FONT_SIZES.md, color: COLORS.text, lineHeight: 22 }
});

export default ProfileViewScreen;
