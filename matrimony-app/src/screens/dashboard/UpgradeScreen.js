import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const UpgradeScreen = ({ navigation }) => {
    const { refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            // In a real app, integrate Payment Gateway here
            // For demo, we just call an endpoint to update subscription
            await api.patch('/admin/users/me/subscribe', { is_subscribed: 1 });
            await refreshUser();
            Alert.alert('Success', 'Welcome to Premium Membership! All photos are now visible.', [
                { text: 'Great!', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Upgrade error:', error);
            Alert.alert('Error', 'Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#FF4081', '#E91E63']} style={styles.header}>
                <MaterialCommunityIcons name="crown" size={80} color="#FFD700" />
                <Text style={styles.headerTitle}>Go Premium</Text>
                <Text style={styles.headerSubtitle}>Unlock the best matching experience</Text>
            </LinearGradient>

            <ScrollView style={styles.content}>
                <FeatureItem
                    icon="eye-outline"
                    title="View All Photos"
                    description="Instantly unblur and see all profile photos clearly."
                />
                <FeatureItem
                    icon="message-text-outline"
                    title="Direct Chat"
                    description="Start conversations with your matches instantly."
                />
                <FeatureItem
                    icon="star-outline"
                    title="Profile Boost"
                    description="Get up to 10x more visibility among matches."
                />
                <FeatureItem
                    icon="check-decagram"
                    title="Verified Badge"
                    description="Build trust with a premium verified badge on your profile."
                />

                <View style={styles.planCard}>
                    <Text style={styles.planTitle}>Premium Monthly</Text>
                    <Text style={styles.planPrice}>₹999 / month</Text>
                    <TouchableOpacity
                        style={styles.upgradeBtn}
                        onPress={handleUpgrade}
                        disabled={loading}
                    >
                        <Text style={styles.upgradeBtnText}>
                            {loading ? 'Processing...' : 'Subscribe Now'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const FeatureItem = ({ icon, title, description }) => (
    <View style={styles.featureItem}>
        <View style={styles.featureIcon}>
            <MaterialCommunityIcons name={icon} size={24} color="#E91E63" />
        </View>
        <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDesc}>{description}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 10,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
    content: { padding: 20 },
    featureItem: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'center',
    },
    featureIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FCE4EC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    featureTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    featureDesc: { fontSize: 14, color: '#666', marginTop: 2 },
    planCard: {
        backgroundColor: '#F5F5F5',
        padding: 25,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 20,
        borderWidth: 2,
        borderColor: '#E91E63',
    },
    planTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    planPrice: { fontSize: 24, fontWeight: 'bold', color: '#E91E63', marginVertical: 10 },
    upgradeBtn: {
        backgroundColor: '#E91E63',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        elevation: 5,
    },
    upgradeBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default UpgradeScreen;
