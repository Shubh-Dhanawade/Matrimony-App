import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';




import ApproveIcon from '../../components/svg/ApproveIcon';
import RejectIcon from '../../components/svg/RejectIcon';

const ManageProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfiles = async () => {
    try {
      const response = await api.get('/admin/profiles');
      setProfiles(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch profiles');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/profiles/${id}/status`, { status });

      Alert.alert('Success', `Profile ${status}`);
      fetchProfiles();

    } catch (error) {
      console.log("BACKEND ERROR:", error.response?.data);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update status'
      );
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    fetchProfiles();
  };

  const renderProfileItem = ({ item }) => (
    <View style={styles.profileCard}>
      <View style={styles.cardContent}>
        {/* Profile Info (Left/Middle) */}
        <View style={styles.infoSection}>
          <View style={styles.headerRow}>
            <Text style={styles.profileName} numberOfLines={1}>{item.full_name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Icon name="phone" size={18} color={COLORS.primary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.mobile_number}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="location-on" size={18} color={COLORS.primary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.birthplace}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name={item.gender === 'Male' ? 'male' : 'female'} size={18} color={COLORS.primary} style={styles.detailIcon} />
              <Text style={styles.detailText}>{item.gender}</Text>
            </View>
          </View>
        </View>

        {/* Action Controls (Right Aligned) */}
        <View style={styles.actionControls}>
          {item.status !== 'Approved' && (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => handleUpdateStatus(item.id, 'Approved')}
              style={styles.iconButton}
            >
              <ApproveIcon size={36} />
            </TouchableOpacity>
          )}

          {item.status !== 'Rejected' && (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => handleUpdateStatus(item.id, 'Rejected')}
              style={styles.iconButton}
            >
              <RejectIcon size={36} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );




  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return COLORS.primary; // Pink theme instead of bright green
      case 'Rejected': return COLORS.error;
      default: return '#E67E22'; // Soft Orange
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProfileItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No profiles found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  listContent: {
    padding: SPACING.md
  },

  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  infoSection: {
    flex: 1,
    marginRight: 15
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },

  profileName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginRight: 10,
  },

  detailsContainer: {
    marginVertical: 5,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    paddingVertical: 8
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },

  detailIcon: {
    width: 24,
    marginRight: 8
  },

  detailText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500'
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20
  },

  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },

  actionControls: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0'
  },

  iconButton: {
    marginVertical: 8,
    padding: 5,
    // Optional: add a subtle shadow to the icon for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: '#fff',
    borderRadius: 20
  },

  approveBtn: {
    backgroundColor: '#2ecc71'
  },

  rejectBtn: {
    backgroundColor: '#e74c3c'
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600'
  },

});


export default ManageProfiles;
