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
    TextInput
} from 'react-native';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';

const MembershipManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users', {
                params: { search }
            });
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
    }, [search]);

    const handleTogglePaidStatus = (user) => {
        const isCurrentlyPaid = Number(user.is_paid) === 1;
        const action = isCurrentlyPaid ? 'Remove Paid' : 'Make Paid';

        Alert.alert(
            'Confirm Action',
            `Are you sure you want to ${action} for ${user.mobile_number}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: action.toUpperCase(),
                    style: isCurrentlyPaid ? 'destructive' : 'default',
                    onPress: async () => {
                        try {
                            await api.patch(`/admin/users/${user.id}/paid`, {
                                is_paid: !isCurrentlyPaid
                            });
                            Alert.alert('Success', `User membership status updated successfully`);
                            fetchUsers();
                        } catch (error) {
                            Alert.alert('Error', `Failed to update membership status`);
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

    const renderUserItem = ({ item }) => {
        const isPaid = Number(item.is_paid) === 1;

        return (
            <View style={styles.userCard}>
                <View style={styles.userInfo}>
                    <Text style={styles.nameText}>
                        {item.full_name || 'No Profile Created'}
                    </Text>
                    <Text style={styles.mobileNumber}>
                        📱 {item.mobile_number}
                    </Text>
                    <Text style={styles.statusText}>
                        Status: {item.profile_status || 'Pending'}
                    </Text>
                    <View style={styles.membershipRow}>
                        <Text style={styles.membershipLabel}>Membership: </Text>
                        <Text style={[styles.membershipStatus, isPaid ? styles.paidText : styles.unpaidText]}>
                            {isPaid ? 'Paid' : 'Unpaid'}
                        </Text>
                    </View>
                </View>

                <View style={styles.actionGroup}>
                    <TouchableOpacity
                        style={[
                            styles.actionBtn,
                            isPaid ? styles.removePaidBtn : styles.makePaidBtn
                        ]}
                        onPress={() => handleTogglePaidStatus(item)}
                    >
                        <Text style={styles.btnText}>
                            {isPaid ? 'Remove Paid' : 'Make Paid'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
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
            {/* 🔎 SEARCH INPUT */}
            <TextInput
                placeholder="Search by name or mobile..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
            />

            <FlatList
                data={users}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderUserItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No users found.</Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: SPACING.md },
    searchInput: {
        backgroundColor: '#fff',
        padding: 12,
        margin: SPACING.md,
        borderRadius: 10,
        elevation: 3
    },
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
    nameText: {
        fontSize: FONT_SIZES.md,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4
    },
    mobileNumber: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: 4
    },
    statusText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: 4
    },
    membershipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4
    },
    membershipLabel: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        fontWeight: '500'
    },
    membershipStatus: {
        fontSize: FONT_SIZES.sm,
        fontWeight: 'bold'
    },
    paidText: { color: '#2ecc71' },
    unpaidText: { color: '#e74c3c' },
    actionGroup: {
        marginLeft: SPACING.sm,
        justifyContent: 'center'
    },
    actionBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 6,
        minWidth: 110
    },
    makePaidBtn: { backgroundColor: '#f1c40f' },
    removePaidBtn: { backgroundColor: '#e74c3c' },
    btnText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
    emptyText: {
        textAlign: 'center',
        marginTop: SPACING.xl,
        color: COLORS.textSecondary
    }
});

export default MembershipManagement;
