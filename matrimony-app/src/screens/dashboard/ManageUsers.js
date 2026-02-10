import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlock = (user) => {
    const action = user.is_blocked ? 'unblock' : 'block';
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} ${user.mobile_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action.toUpperCase(), 
          style: user.is_blocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/admin/users/${user.id}/block`, { is_blocked: !user.is_blocked });
              Alert.alert('Success', `User ${action}ed`);
              fetchUsers();
            } catch (error) {
              Alert.alert('Error', `Failed to ${action} user`);
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.mobileNumber}>{item.mobile_number}</Text>
        <Text style={styles.roleText}>{item.role}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.actionBtn, item.is_blocked ? styles.unblockBtn : styles.blockBtn]}
        onPress={() => handleToggleBlock(item)}
      >
        <Text style={styles.btnText}>{item.is_blocked ? 'Unblock' : 'Block'}</Text>
      </TouchableOpacity>
    </View>
  );

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
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: SPACING.md },
  userCard: { 
    backgroundColor: '#fff', 
    padding: SPACING.md, 
    borderRadius: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: SPACING.md,
    elevation: 3
  },
  userInfo: { flex: 1 },
  mobileNumber: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary },
  roleText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textTransform: 'capitalize' },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  blockBtn: { backgroundColor: '#e74c3c' },
  unblockBtn: { backgroundColor: '#2ecc71' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: SPACING.xl, color: COLORS.textSecondary }
});

export default ManageUsers;
