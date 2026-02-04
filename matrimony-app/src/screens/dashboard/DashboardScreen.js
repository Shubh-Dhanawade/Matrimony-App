import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, 
  ActivityIndicator, ScrollView, Alert, Modal, TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, MARITAL_STATUS_OPTIONS } from '../../utils/constants';
import ProfileCard from '../../components/ProfileCard';
import useHardwareBack from '../../hooks/useHardwareBack';

const DashboardScreen = ({ navigation }) => {
  useHardwareBack();
  const { logout } = useAuth();
  const [myProfile, setMyProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [invitations, setInvitations] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('Profiles'); // Profiles, Invitations
  
  const [filters, setFilters] = useState({
    ageMin: '', ageMax: '', caste: '', qualification: '', incomeMin: '', birthplace: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes, iRes, mRes] = await Promise.all([
        api.get('/profiles', { params: filters }),
        api.get('/profiles/suggested'),
        api.get('/invitations'),
        api.get('/profiles/me')
      ]);
      setProfiles(pRes.data);
      setSuggested(sRes.data);
      setInvitations(iRes.data);
      setMyProfile(mRes.data.profile); // Update this to handle { profile, hasProfile }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendInvitation = async (receiverUserId) => {
  try {
    await api.post('/invitations', {
      receiverId: receiverUserId   
    });
    Alert.alert('Success', 'Invitation sent successfully!');
    fetchData();
  } catch (error) {
    Alert.alert('Error', error.response?.data?.message || 'Failed to send invitation');
  }
};


  const handleUpdateInvitation = async (invitationId, status) => {
    try {
      await api.put('/invitations', { invitationId, status });
      Alert.alert('Success', `Invitation ${status.toLowerCase()}!`);
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update invitation');
    }
  };

  const renderFilterModal = () => (
    <Modal visible={showFilters} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter Profiles</Text>
          <ScrollView>
            <Text style={styles.label}>Age Range</Text>
            <View style={styles.row}>
              <TextInput 
                style={[styles.input, { flex: 1, marginRight: 8 }]} 
                placeholder="Min" 
                keyboardType="numeric"
                value={filters.ageMin}
                onChangeText={(v) => setFilters({...filters, ageMin: v})}
              />
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                placeholder="Max" 
                keyboardType="numeric"
                value={filters.ageMax}
                onChangeText={(v) => setFilters({...filters, ageMax: v})}
              />
            </View>
            <Text style={styles.label}>Caste</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Enter Caste"
              value={filters.caste}
              onChangeText={(v) => setFilters({...filters, caste: v})}
            />
            <Text style={styles.label}>Qualification</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. BE, MBBS"
              value={filters.qualification}
              onChangeText={(v) => setFilters({...filters, qualification: v})}
            />
            <Text style={styles.label}>Min Monthly Income</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Amount"
              keyboardType="numeric"
              value={filters.incomeMin}
              onChangeText={(v) => setFilters({...filters, incomeMin: v})}
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.clearBtn} onPress={() => setFilters({
              ageMin: '', ageMax: '', caste: '', qualification: '', incomeMin: '', birthplace: ''
            })}>
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderUserSummary = () => myProfile && (
    <TouchableOpacity 
      style={styles.summaryCard} 
      onPress={() => navigation.navigate('ProfileView')}
    >
      <Image source={{ uri: myProfile.avatar_url || 'https://via.placeholder.com/150' }} style={styles.summaryAvatar} />
      <View style={styles.summaryInfo}>
        <Text style={styles.summaryName}>{myProfile.full_name}</Text>
        <Text style={styles.summaryDetail}>{myProfile.age} yrs | {myProfile.marital_status}</Text>
      </View>
      <TouchableOpacity 
        style={styles.editBtn} 
        onPress={() => navigation.navigate('Registration', { isEdit: true })}
      >
        <Text style={styles.editBtnText}>Edit</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSuggested = () => suggested.length > 0 && (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Suggested Profiles</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={suggested}
        keyExtractor={(item) => `s-${item.id}`}
        renderItem={({ item }) => (
          <ProfileCard profile={item} onInvite={handleSendInvitation} isSuggested />
        )}
      />
    </View>
  );

  const renderInvitations = () => (
    <View style={styles.container}>
      <Text style={styles.subTitle}>Received Invitations</Text>
      {invitations.received.length === 0 ? (
        <Text style={styles.emptyText}>No invitations received</Text>
      ) : (
        invitations.received.map(item => (
          <View key={item.id} style={styles.invitationItem}>
            <Text style={styles.invitationName}>{item.full_name}</Text>
            <View style={styles.row}>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: COLORS.success }]} 
                onPress={() => handleUpdateInvitation(item.id, 'Accepted')}
              >
                <Text style={styles.actionBtnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: COLORS.error }]} 
                onPress={() => handleUpdateInvitation(item.id, 'Rejected')}
              >
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <Text style={[styles.subTitle, { marginTop: SPACING.lg }]}>Sent Invitations</Text>
      {invitations.sent.length === 0 ? (
        <Text style={styles.emptyText}>No invitations sent</Text>
      ) : (
        invitations.sent.map(item => (
          <View key={item.id} style={styles.invitationItem}>
            <Text style={styles.invitationName}>{item.full_name}</Text>
            <Text style={[styles.status, { color: item.status === 'Accepted' ? COLORS.success : COLORS.textSecondary }]}>
              {item.status}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  if (loading && !myProfile) {
    return <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      {renderFilterModal()}
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Matrimony</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'Profiles' && styles.activeTab]} 
            onPress={() => setActiveTab('Profiles')}
          >
            <Text style={[styles.tabText, activeTab === 'Profiles' && styles.activeTabText]}>Find Match</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'Invitations' && styles.activeTab]} 
            onPress={() => setActiveTab('Invitations')}
          >
            <Text style={[styles.tabText, activeTab === 'Invitations' && styles.activeTabText]}>Invitations</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'Profiles' ? (
          <>
            {renderUserSummary()}
            {renderSuggested()}
            
            <View style={[styles.row, styles.listHeader]}>
              <Text style={styles.sectionTitle}>Latest Profiles</Text>
              <TouchableOpacity onPress={() => setShowFilters(true)}>
                <Text style={styles.filterLink}>Filter</Text>
              </TouchableOpacity>
            </View>

            {profiles.length === 0 ? (
              <Text style={styles.emptyMessage}>No profiles found. Try adjusting filters.</Text>
            ) : (
              profiles.map(item => (
                <ProfileCard key={item.id} profile={item} onInvite={handleSendInvitation} />
              ))
            )}
          </>
        ) : (
          renderInvitations()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.primary },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.error },
  logoutBtnText: { color: COLORS.surface, fontSize: FONT_SIZES.sm, fontWeight: 'bold' },
  
  tabs: { flexDirection: 'row' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: { fontWeight: '600', color: COLORS.textSecondary },
  activeTabText: { color: COLORS.primary },

  scrollContent: { padding: SPACING.md },
  
  summaryCard: { backgroundColor: COLORS.primary, borderRadius: 16, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  summaryAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: COLORS.surface },
  summaryInfo: { flex: 1, marginLeft: SPACING.md },
  summaryName: { color: COLORS.surface, fontSize: FONT_SIZES.lg, fontWeight: 'bold' },
  summaryDetail: { color: COLORS.surface, opacity: 0.9, fontSize: FONT_SIZES.sm },
  editBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  editBtnText: { color: COLORS.surface, fontWeight: 'bold' },

  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.md },
  listHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  filterLink: { color: COLORS.primary, fontWeight: 'bold' },
  
  invitationItem: { backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invitationName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.text },
  subTitle: { fontSize: FONT_SIZES.md, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: SPACING.sm },
  status: { fontWeight: 'bold', fontSize: FONT_SIZES.sm },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginLeft: 8 },
  actionBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: FONT_SIZES.xs },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '80%' },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.lg },
  label: { fontSize: FONT_SIZES.sm, fontWeight: 'bold', color: COLORS.textSecondary, marginTop: SPACING.md, marginBottom: 4 },
  input: { backgroundColor: COLORS.background, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row' },
  modalActions: { flexDirection: 'row', marginTop: SPACING.xl },
  clearBtn: { flex: 1, padding: 16, alignItems: 'center' },
  applyBtn: { flex: 2, backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  applyBtnText: { color: COLORS.surface, fontWeight: 'bold', fontSize: FONT_SIZES.md },
  clearBtnText: { color: COLORS.textSecondary, fontWeight: 'bold' },
  
  loader: { flex: 1, justifyContent: 'center' },
  emptyMessage: { textAlign: 'center', marginTop: 30, color: COLORS.textSecondary, fontStyle: 'italic' },
  emptyText: { color: COLORS.textSecondary, fontStyle: 'italic', marginBottom: SPACING.md }
});

export default DashboardScreen;
