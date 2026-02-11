import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { Image } from 'react-native';


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

      <View style={styles.topSection}>
        {/* Profile Image */}
        <Image
          source={{ uri: item.avatar_url || 'https://via.placeholder.com/100' }}
          style={styles.profileImage}
        />

        {/* Profile Details */}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {item.full_name || 'No Name'}
          </Text>

          <Text style={styles.profileSubText}>
            📱 {item.mobile_number}
          </Text>

          <Text style={styles.profileSubText}>
            {item.gender || 'Not Specified'}
          </Text>

          <Text style={styles.profileSubText}>
            📍 {item.birthplace || 'Location not available'}
          </Text>
        </View>

        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>
            {item.status || 'Pending'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {item.status !== 'Approved' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.approveBtn]}
            onPress={() => handleUpdateStatus(item.id, 'Approved')}
          >
            <Text style={styles.btnText}>Approve</Text>
          </TouchableOpacity>
        )}

        {item.status !== 'Rejected' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectBtn]}
            onPress={() => handleUpdateStatus(item.id, 'Rejected')}
          >
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );



  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return '#2ecc71';
      case 'Rejected': return '#e74c3c';
      default: return '#f39c12';
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
    backgroundColor: '#fff',
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.md,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },

  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },

  profileName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },

  profileDetail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },

  statusText: {
    color: '#fff',
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold'
  },

  actionRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: SPACING.sm,
    justifyContent: 'space-between'
  },

  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5
  },

  approveBtn: {
    backgroundColor: '#2ecc71'
  },

  rejectBtn: {
    backgroundColor: '#e74c3c'
  },

  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: FONT_SIZES.sm
  },

  emptyText: {
    textAlign: 'center',
    marginTop: SPACING.xl,
    color: COLORS.textSecondary
  }
});


export default ManageProfiles;
