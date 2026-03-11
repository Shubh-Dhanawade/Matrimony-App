import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  ScrollView,
  Image
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { getProfileImageUri } from '../../utils/imageUtils';

const AdminUserListScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [isPaidFilter, setIsPaidFilter] = useState(''); // '' | '1' | '0'
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'Pending' | 'Approved' | 'Rejected'
  
  // Pagination
  const [page, setPage] = useState(1);
  const usersPerPage = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users', {
        params: { search, is_paid: isPaidFilter, profile_status: statusFilter }
      });
      setUsers(response.data);
      setPage(1); // Reset to page 1 on new fetch
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Debounce search slightly or just fetch on effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, isPaidFilter, statusFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleToggleBlock = (user) => {
    const action = user.is_blocked ? 'unblock' : 'block';
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} user ${user.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.toUpperCase(),
          style: user.is_blocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/admin/users/${user.id}/block`, {
                is_blocked: !user.is_blocked
              });
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

  const handleTogglePaid = (user) => {
    const action = user.is_paid ? 'revoke paid membership' : 'grant paid membership';
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} for user ${user.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await api.patch(`/admin/users/${user.id}/paid`, {
                is_paid: !user.is_paid
              });
              Alert.alert('Success', `Membership status updated`);
              fetchUsers();
            } catch (error) {
              Alert.alert('Error', `Failed to update membership status`);
            }
          }
        }
      ]
    );
  };
  
  const handleResetProfile = (user) => {
    Alert.alert(
      'Reset Profile',
      `Are you sure you want to reset the profile for user ${user.id}? This deletes their profile data but keeps their account open.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/users/${user.id}/reset-profile`);
              Alert.alert('Success', 'Profile reset successfully');
              fetchUsers();
            } catch (error) {
              const errorMsg = error.response?.data?.message || 'Failed to reset profile';
              Alert.alert('Error', errorMsg);
            }
          }
        }
      ]
    );
  };

  const handleDeleteUser = (user) => {
    Alert.alert(
      'Permanent Delete',
      `Are you sure you want to permanently delete user ${user.id}? This action is irreversible.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/users/${user.id}`);
              Alert.alert('Success', 'User deleted permanently');
              fetchUsers();
            } catch (error) {
              const errorMsg = error.response?.data?.message || 'Failed to delete user';
              Alert.alert('Error', errorMsg);
            }
          }
        }
      ]
    );
  };

  const exportToCSV = async () => {
    if (!users || users.length === 0) {
      Alert.alert("No Users", "There are no users to export based on the current filters.");
      return;
    }
    
    try {
      const header = "ID,Full Name,Mobile Number,Gender,Profile Status,Membership Status,Registration Date\n";
      const rows = users.map(u => {
        const isPaid = Number(u.is_paid) === 1 ? 'Paid' : 'Unpaid';
        const regDate = new Date(u.created_at).toLocaleDateString();
        // sanitize fields that might contain commas by wrapping them in quotes
        const sanitize = (text) => text ? `"${String(text).replace(/"/g, '""')}"` : '""';
        return `${u.id},${sanitize(u.full_name)},${sanitize(u.mobile_number)},${sanitize(u.gender)},${sanitize(u.profile_status)},${sanitize(isPaid)},${sanitize(regDate)}`;
      }).join("\n");
      
      const csvContent = header + rows;
      
      const fileUri = FileSystem.documentDirectory + "Total_Users_List.csv";
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export User List',
        });
      } else {
        Alert.alert("Export Error", "Sharing is not available on this device.");
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Failed to generate CSV export file.");
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(users.length / usersPerPage);
  const displayedUsers = users.slice((page - 1) * usersPerPage, page * usersPerPage);

  const renderFilterButtons = (options, selectedValue, onSelect) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.filterPill, selectedValue === opt.value && styles.filterPillActive]}
          onPress={() => onSelect(opt.value)}
        >
          <Text style={[styles.filterPillText, selectedValue === opt.value && styles.filterPillTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderHeader = () => (
    <View style={styles.tableRowHeader}>
      <Text style={[styles.tableCellHeader, { width: 50 }]}>ID</Text>
      <Text style={[styles.tableCellHeader, { width: 70 }]}>Photo</Text>
      <Text style={[styles.tableCellHeader, { width: 140 }]}>Name</Text>
      <Text style={[styles.tableCellHeader, { width: 120 }]}>Mobile</Text>
      <Text style={[styles.tableCellHeader, { width: 80 }]}>Gender</Text>
      <Text style={[styles.tableCellHeader, { width: 100 }]}>Prof. Status</Text>
      <Text style={[styles.tableCellHeader, { width: 90 }]}>Membership</Text>
      <Text style={[styles.tableCellHeader, { width: 100 }]}>Reg Date</Text>
      <Text style={[styles.tableCellHeader, { width: 350 }]}>Actions</Text>
    </View>
  );

  const renderItem = ({ item }) => {
    const isPaid = Number(item.is_paid) === 1;
    const regDate = new Date(item.created_at).toLocaleDateString();
    const avatarUri = getProfileImageUri(item.avatar_url);

    return (
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { width: 50 }]}>{item.id}</Text>
        <View style={[styles.tableCell, { width: 70 }]}>
           <Image source={{ uri: avatarUri }} style={styles.avatar} />
        </View>
        <Text style={[styles.tableCell, { width: 140 }]} numberOfLines={2}>
          {item.full_name || '-'}
        </Text>
        <Text style={[styles.tableCell, { width: 120 }]}>{item.mobile_number}</Text>
        <Text style={[styles.tableCell, { width: 80 }]}>{item.gender || '-'}</Text>
        
        {/* Profile Status Badge */}
        <View style={[styles.tableCell, { width: 100 }]}>
           {!item.profile_status ? <Text>-</Text> : (
             <View style={[styles.statusBadge, 
               item.profile_status === 'Approved' ? styles.bgSuccess : 
               item.profile_status === 'Rejected' ? styles.bgDanger : styles.bgWarning]}>
               <Text style={styles.badgeText}>{item.profile_status}</Text>
             </View>
           )}
        </View>

        {/* Membership Badge */}
        <View style={[styles.tableCell, { width: 90 }]}>
           <View style={[styles.statusBadge, isPaid ? styles.bgSuccess : styles.bgDanger]}>
             <Text style={styles.badgeText}>{isPaid ? 'Paid' : 'Unpaid'}</Text>
           </View>
        </View>

        <Text style={[styles.tableCell, { width: 100 }]}>{regDate}</Text>

        {/* Actions */}
        <View style={[styles.tableCell, { width: 350, flexDirection: 'row', gap: 6, flexWrap: 'wrap' }]}>
          <TouchableOpacity 
             style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
             onPress={() => navigation.navigate('ViewFullProfile', { userId: item.id })}
          >
            <Text style={styles.btnText}>View</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
             style={[styles.actionBtn, item.is_blocked ? styles.bgSuccess : styles.bgDanger]}
             onPress={() => handleToggleBlock(item)}
          >
            <Text style={styles.btnText}>{item.is_blocked ? 'Activate' : 'Deactivate'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
             style={[styles.actionBtn, { backgroundColor: '#FF9800' }]}
             onPress={() => handleTogglePaid(item)}
          >
            <Text style={styles.btnText}>{isPaid ? 'Make Unpaid' : 'Make Paid'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
             style={[styles.actionBtn, { backgroundColor: '#607D8B' }]}
             onPress={() => handleResetProfile(item)}
          >
            <Text style={styles.btnText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity 
             style={[styles.actionBtn, { backgroundColor: '#34495e' }]}
             onPress={() => handleDeleteUser(item)}
          >
            <Text style={styles.btnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        <TextInput
          placeholder="Search by name or mobile..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        
        <View style={styles.filterRow}>
           <Text style={styles.filterLabel}>Membership:</Text>
           {renderFilterButtons(
             [{ label: 'All', value: '' }, { label: 'Paid', value: '1' }, { label: 'Unpaid', value: '0' }],
             isPaidFilter,
             setIsPaidFilter
           )}
        </View>
        
        <View style={styles.filterRow}>
           <Text style={styles.filterLabel}>Status:</Text>
           {renderFilterButtons(
             [
               { label: 'All', value: '' }, 
               { label: 'Pending', value: 'Pending' }, 
               { label: 'Approved', value: 'Approved' },
               { label: 'Rejected', value: 'Rejected' }
             ],
             statusFilter,
             setStatusFilter
           )}
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={exportToCSV}>
          <Text style={styles.exportBtnText}>📤 Export to CSV</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal={true} style={styles.tableContainer} bounces={false}>
        <View>
          {renderHeader()}
          {loading ? (
             <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
          ) : (
            <FlatList
              data={displayedUsers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
            />
          )}
        </View>
      </ScrollView>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <View style={styles.pagination}>
           <TouchableOpacity 
             disabled={page === 1} 
             onPress={() => setPage(page - 1)}
             style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}>
             <Text style={styles.pageBtnText}>Prev</Text>
           </TouchableOpacity>
           
           <Text style={styles.pageText}>Page {page} of {totalPages}</Text>
           
           <TouchableOpacity 
             disabled={page === totalPages} 
             onPress={() => setPage(page + 1)}
             style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}>
             <Text style={styles.pageBtnText}>Next</Text>
           </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 },
  
  // Filters
  filterSection: { padding: SPACING.md, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: COLORS.border },
  searchInput: { backgroundColor: '#f5f5f5', padding: 10, borderRadius: 8, marginBottom: 12 },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  filterLabel: { width: 80, fontSize: 13, fontWeight: 'bold', color: COLORS.textSecondary },
  filterScroll: { flexDirection: 'row' },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#f0f0f0', marginRight: 8 },
  filterPillActive: { backgroundColor: COLORS.primary },
  filterPillText: { fontSize: 12, color: '#666' },
  filterPillTextActive: { color: '#fff', fontWeight: 'bold' },

  // Table
  tableContainer: { flex: 1, backgroundColor: '#fff' },
  tableRowHeader: { flexDirection: 'row', backgroundColor: '#f8f9fa', borderBottomWidth: 2, borderColor: '#dee2e6', paddingVertical: 12, paddingHorizontal: 8 },
  tableCellHeader: { fontWeight: 'bold', color: '#495057', fontSize: 13, paddingHorizontal: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#dee2e6', paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
  tableCell: { fontSize: 13, color: '#212529', paddingHorizontal: 4, justifyContent: 'center' },
  
  avatar: { width: 40, height: 40, borderRadius: 20 },
  
  // Badges
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: 'bold' },
  bgSuccess: { backgroundColor: '#28a745' },
  bgDanger: { backgroundColor: '#dc3545' },
  bgWarning: { backgroundColor: '#ffc107' },

  // Actions
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  btnText: { color: '#fff', fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
  
  // Export button
  exportBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  exportBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14
  },

  emptyText: { textAlign: 'center', marginTop: SPACING.xl, color: COLORS.textSecondary, fontStyle: 'italic' },
  
  // Pagination
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, backgroundColor: '#fff', borderTopWidth: 1, borderColor: COLORS.border },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.primary, borderRadius: 6 },
  pageBtnDisabled: { backgroundColor: '#ccc' },
  pageBtnText: { color: '#fff', fontWeight: 'bold' },
  pageText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary }
});

export default AdminUserListScreen;
