import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { getProfileImageUri } from '../../utils/imageUtils';

const InvitationsScreen = ({ navigation }) => {
    const [invitations, setInvitations] = useState({ sent: [], received: [] });
    const [loading, setLoading] = useState(true);

    const fetchInvitations = async () => {
        try {
            const response = await api.get('/invitations');
            setInvitations(response.data);
        } catch (error) {
            console.error('Error fetching invitations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    const handleUpdateInvitation = async (invitationId, status) => {
        try {
            await api.put('/invitations', { invitationId, status });
            Alert.alert('Success', `Invitation ${status.toLowerCase()}!`);
            fetchInvitations();
        } catch (error) {
            Alert.alert('Error', 'Failed to update invitation');
        }
    };

    const renderInvitationCard = (item, isReceived = false) => {
        const isPending = item.status === 'Pending';
        const isAccepted = item.status === 'Accepted';
        const isRejected = item.status === 'Rejected';

        return (
            <View key={item.id} style={styles.invCard}>
                <View style={styles.invHeader}>
                    <Image
                        source={{ uri: getProfileImageUri(item.avatar_url) }}
                        style={styles.invAvatar}
                    />
                    <View style={styles.invInfo}>
                        <Text style={styles.invName}>{item.full_name}</Text>
                        <Text style={styles.invMeta}>
                            {item.age ? `${item.age} yrs | ` : ''}{item.marital_status || 'Member'}
                        </Text>
                    </View>
                </View>

                <View style={styles.invBody}>
                    {isReceived && isPending ? (
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.modernBtn, styles.acceptBtn]}
                                onPress={() => handleUpdateInvitation(item.id, 'Accepted')}
                            >
                                <Text style={styles.btnText}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modernBtn, styles.rejectBtn]}
                                onPress={() => handleUpdateInvitation(item.id, 'Rejected')}
                            >
                                <Text style={[styles.btnText, { color: COLORS.error }]}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    ) : isAccepted ? (
                        <View style={styles.statusContainer}>
                            <View style={styles.matchBadge}>
                                <Text style={styles.matchBadgeText}>🎉 It's a Match!</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.statusContainer}>
                            <Text style={[styles.statusText, isRejected && { color: COLORS.error }]}>
                                {isRejected ? '❌ Invitation Rejected' : `Status: ${item.status}`}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.root}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Received Invitations</Text>
                {invitations.received.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No invitations received yet</Text>
                    </View>
                ) : (
                    invitations.received.map(item => renderInvitationCard(item, true))
                )}

                <Text style={[styles.title, { marginTop: SPACING.xl }]}>Sent Invitations</Text>
                {invitations.sent.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>You haven't sent any invitations</Text>
                    </View>
                ) : (
                    invitations.sent.map(item => renderInvitationCard(item, false))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F8F9FA' },
    scrollContent: { padding: SPACING.md },
    title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    invCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        elevation: 3,
    },
    invHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
    invAvatar: { width: 50, height: 50, borderRadius: 25 },
    invInfo: { flex: 1, marginLeft: SPACING.md },
    invName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    invMeta: { fontSize: 14, color: '#666' },
    invBody: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: SPACING.md },
    actionRow: { flexDirection: 'row', gap: SPACING.md },
    modernBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    acceptBtn: { backgroundColor: COLORS.success },
    rejectBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.error },
    btnText: { color: '#fff', fontWeight: 'bold' },
    statusContainer: { alignItems: 'center' },
    matchBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15 },
    matchBadgeText: { color: COLORS.success, fontWeight: 'bold' },
    statusText: { color: '#666', fontWeight: '500' },
    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#999', fontStyle: 'italic' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default InvitationsScreen;
