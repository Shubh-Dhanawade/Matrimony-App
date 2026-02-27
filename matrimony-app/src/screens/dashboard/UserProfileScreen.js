import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { getProfileImageUri } from '../../utils/imageUtils';
import api from '../../services/api';

const UserProfileScreen = ({ navigation }) => {
    const { user, logout, refreshUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchMyProfile();
        }, [])
    );

    const fetchMyProfile = async () => {
        try {
            const response = await api.get('/profiles/me');
            setProfile(response.data.profile);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout }
        ]);
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: getProfileImageUri(profile?.avatar_url) }}
                        style={styles.avatar}
                    />
                    <TouchableOpacity
                        style={styles.editIcon}
                        onPress={() => navigation.navigate('Registration', { isEdit: true })}
                    >
                        <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.name}>{profile?.full_name || 'My Profile'}</Text>
                <Text style={styles.status}>
                    {user?.is_subscribed ? 'Premium Member' : 'Free Member'}
                </Text>
            </View>

            <View style={styles.statsRow}>
                <StatBox label="Interests" value="12" icon="heart-outline" />
                <StatBox label="Shortlists" value="5" icon="star-outline" />
                <StatBox label="Views" value="45" icon="eye-outline" />
            </View>

            <View style={styles.menu}>
                <MenuItem
                    icon="account-outline"
                    label="Edit Personal Info"
                    onPress={() => navigation.navigate('Registration', { isEdit: true })}
                />
                <MenuItem
                    icon="shield-check-outline"
                    label="Account Security"
                    onPress={() => { }}
                />
                {!user?.is_subscribed && (
                    <MenuItem
                        icon="crown-outline"
                        label="Upgrade to Premium"
                        onPress={() => navigation.navigate('Upgrade')}
                        color="#E91E63"
                    />
                )}
                <MenuItem
                    icon="help-circle-outline"
                    label="Help & Support"
                    onPress={() => { }}
                />
                <MenuItem
                    icon="logout"
                    label="Logout"
                    onPress={handleLogout}
                    color="#F44336"
                />
            </View>
        </ScrollView>
    );
};

const StatBox = ({ label, value, icon }) => (
    <View style={styles.statBox}>
        <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const MenuItem = ({ icon, label, onPress, color = '#333' }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
        <Text style={[styles.menuLabel, { color }]}>{label}</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        backgroundColor: '#fff',
        padding: 30,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#eee',
    },
    editIcon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: COLORS.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    name: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    status: { fontSize: 16, color: COLORS.textSecondary, marginTop: 5 },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 20,
        marginTop: 10,
        justifyContent: 'space-around',
    },
    statBox: { alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 5 },
    statLabel: { fontSize: 12, color: '#666' },
    menu: { backgroundColor: '#fff', marginTop: 10, paddingVertical: 10 },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    menuLabel: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '500' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default UserProfileScreen;
