import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

const UpgradeScreen = ({ navigation }) => {
    const { refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    const openWhatsApp = () => {
        const url = 'whatsapp://send?phone=918788513415&text=Hello, I have made the payment for the Matrimony App premium membership. [Attach Screenshot Here]';
        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(url);
                } else {
                    Alert.alert('Error', 'WhatsApp is not installed on your device.');
                }
            })
            .catch((err) => console.error('An error occurred', err));
    };

    if (showScanner) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={['#FF4081', '#E91E63']} style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => setShowScanner(false)}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
                    </TouchableOpacity>
                    <MaterialCommunityIcons name="qrcode-scan" size={60} color="#FFD700" />
                    <Text style={styles.headerTitle}>Scan to Pay</Text>
                    <Text style={styles.headerSubtitle}>Complete your payment securely</Text>
                </LinearGradient>

                <ScrollView contentContainerStyle={styles.scannerContent}>
                    <View style={styles.qrContainer}>
                        {/* ⚠️ IMPORTANT: Please copy your QR code image to the /assets folder and name it 'payment_qr.jpg' */}
                        {/* Then change the source below from 'icon.png' to 'payment_qr.jpg' */}
                        <Image 
                            source={require('../../../assets/icon.png')} // Changed to icon.png temporarily to prevent build crash
                            style={styles.qrImage}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.instructionsCard}>
                        <Text style={styles.instructionTitle}>Payment Instructions:</Text>
                        <Text style={styles.instructionText}>
                            1. Scan the QR code above or take a screenshot and import it into your UPI app (GPay, PhonePe, etc).
                        </Text>
                        <Text style={styles.instructionText}>
                            2. Complete the payment of <Text style={{fontWeight: 'bold'}}>₹999</Text>.
                        </Text>
                        <Text style={[styles.instructionText, styles.highlightText]}>
                            3. After payment is complete, send the payment screenshot on 8788513415 this number on WhatsApp.
                        </Text>
                        <Text style={styles.instructionText}>
                            4. Your premium subscription will be activated within <Text style={{fontWeight: 'bold'}}>24 hours</Text> after verification.
                        </Text>
                    </View>

                    <TouchableOpacity 
                        style={styles.whatsappBtn}
                        onPress={openWhatsApp}
                    >
                        <MaterialCommunityIcons name="whatsapp" size={24} color="#fff" />
                        <Text style={styles.whatsappBtnText}>Send Screenshot via WhatsApp</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#FF4081', '#E91E63']} style={styles.header}>
                <MaterialCommunityIcons name="crown" size={80} color="#FFD700" />
                <Text style={styles.headerTitle}>Go Premium</Text>
                <Text style={styles.headerSubtitle}>Unlock the best matching experience</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
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
                        onPress={() => setShowScanner(true)}
                    >
                        <Text style={styles.upgradeBtnText}>Subscribe Now</Text>
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
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        padding: 10,
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
    scannerContent: { padding: 20, paddingBottom: 40, alignItems: 'center' },
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
        backgroundColor: '#f9f9f9',
        padding: 25,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#E91E63',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    planTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    planPrice: { fontSize: 24, fontWeight: 'bold', color: '#E91E63', marginVertical: 10 },
    upgradeBtn: {
        backgroundColor: '#E91E63',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        elevation: 5,
        marginTop: 10,
    },
    upgradeBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    qrContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5.46,
        elevation: 9,
        marginBottom: 30,
    },
    qrImage: {
        width: 250,
        height: 250,
    },
    instructionsCard: {
        backgroundColor: '#FCE4EC',
        padding: 20,
        borderRadius: 15,
        width: '100%',
        marginBottom: 30,
    },
    instructionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#C2185B',
        marginBottom: 10,
    },
    instructionText: {
        fontSize: 15,
        color: '#444',
        marginBottom: 10,
        lineHeight: 22,
    },
    highlightText: {
        color: '#C2185B',
        fontWeight: 'bold',
    },
    whatsappBtn: {
        backgroundColor: '#25D366',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingVertical: 15,
        borderRadius: 30,
        elevation: 5,
    },
    whatsappBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default UpgradeScreen;
