import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';

const AdminDashboard = ({ navigation }) => {
  const { logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      console.log('DASHBOARD STATS RESPONSE:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Fetch stats error:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const StatCard = ({ title, value, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Admin </Text>

      <View style={styles.statsGrid}>
        <StatCard title="Total Users" value={stats?.totalUsers || 0} color="#3498db" />
        <StatCard title="Total Profiles" value={stats?.totalProfiles || 0} color="#9b59b6" />
        <StatCard title="Pending" value={stats?.pendingProfiles || 0} color="#e67e22" />
        <StatCard title="Approved" value={stats?.approvedProfiles || 0} color="#2ecc71" />
        <StatCard title="Rejected" value={stats?.rejectedProfiles || 0} color="#e74c3c" />
      </View>

      <View style={styles.managementSection}>
        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.cardRow}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ManageProfiles')}
          >
            <Text style={styles.cardTitle}>Manage Profiles </Text>
            <Text style={styles.cardSub}>Approve & Reject Profiles</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ManageUsers')}
          >
            <Text style={styles.cardTitle}>Manage Users</Text>
            <Text style={styles.cardSub}>Deactivate or Reset Profiles</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.xl, textAlign: 'center' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: SPACING.xl },
  statCard: {
    backgroundColor: '#fff',
    padding: SPACING.md,
    borderRadius: 8,
    width: '48%',
    marginBottom: SPACING.md,
    elevation: 2,
    borderLeftWidth: 4
  },
  statValue: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.textPrimary },
  statTitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },

  managementSection: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { backgroundColor: '#fff', padding: SPACING.md, borderRadius: 10, width: '48%', elevation: 3 },
  cardTitle: { fontSize: FONT_SIZES.md, fontWeight: 'bold', color: COLORS.textPrimary },
  cardSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 4 },

  logoutButton: { backgroundColor: COLORS.error || '#ff4444', padding: SPACING.md, borderRadius: 8, marginVertical: SPACING.xl, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: FONT_SIZES.md }
});

export default AdminDashboard;