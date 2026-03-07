import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { getProfileImageUri } from '../../utils/imageUtils';

const ViewFullProfileScreen = ({ navigation, route }) => {
    const { userId } = route.params;
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/profiles/${userId}`);
            // Backend may return { profile: {...} } or the object directly
            const data = response.data?.profile ?? response.data;
            setProfile(data);
        } catch (err) {
            console.error('[ViewFullProfile] Error fetching profile:', err);
            setError('Unable to load profile. Please try again.');
            Alert.alert('Error', 'Failed to load profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading profile…</Text>
            </View>
        );
    }

    if (error || !profile) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialCommunityIcons name="account-alert-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.errorText}>{error ?? 'Profile not found.'}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ─── Hero Header ─── */}
                <View style={styles.heroContainer}>
                    <LinearGradient
                        colors={[COLORS.primary, '#C2185B']}
                        style={styles.heroGradient}
                    />
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: getProfileImageUri(profile.avatar_url) }}
                            style={styles.avatar}
                        />
                        {profile.is_verified && (
                            <View style={styles.verifiedBadge}>
                                <MaterialCommunityIcons name="check-decagram" size={18} color="#fff" />
                            </View>
                        )}
                    </View>

                    <Text style={styles.heroName}>{profile.full_name}</Text>
                    {profile.age || profile.marital_status ? (
                        <Text style={styles.heroSub}>
                            {[profile.age && `${profile.age} yrs`, profile.marital_status]
                                .filter(Boolean)
                                .join(' · ')}
                        </Text>
                    ) : null}
                </View>

                {/* ─── Quick Stats ─── */}
                <View style={styles.statsRow}>
                    <QuickStat icon="human-male-height" label="Height" value={profile.height ?? '—'} />
                    <QuickStat icon="briefcase-outline" label="Profession" value={profile.profession ?? profile.occupation ?? '—'} />
                    <QuickStat icon="school-outline" label="Education" value={profile.qualification ?? '—'} />
                </View>

                <View style={styles.sectionsWrapper}>
                    {/* 1️⃣ Basic Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Basic Information</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Name:</Text> {profile.full_name}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Profile For:</Text> {profile.profile_for}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Profile Managed By:</Text> {profile.profile_managed_by}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Gender:</Text> {profile.gender}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Age:</Text> {profile.age}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Date of Birth:</Text> {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Height:</Text> {profile.height}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Color:</Text> {profile.color}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Marital Status:</Text> {profile.marital_status}</Text>
                    </View>

                    {/* 2️⃣ Family Details */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Family Details</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Father Name:</Text> {profile.father_name}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Mother Maiden Name:</Text> {profile.mother_maiden_name}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Relative Surname:</Text> {profile.relative_surname}</Text>
                    </View>

                    {/* 3️⃣ Location Details */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Location</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Birthplace:</Text> {profile.birthplace}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Address:</Text> {profile.address}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>State:</Text> {profile.state}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>District:</Text> {profile.district}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Taluka:</Text> {profile.taluka}</Text>
                    </View>

                    {/* 4️⃣ Professional Details */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Professional Details</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Qualification:</Text> {profile.qualification}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Occupation:</Text> {profile.occupation}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Profession:</Text> {profile.profession}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Monthly Income:</Text> {profile.monthly_income}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Property:</Text> {profile.property}</Text>
                    </View>

                    {/* 5️⃣ Community Details */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Community Details</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Caste:</Text> {profile.caste}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Sub Caste:</Text> {profile.sub_caste}</Text>
                    </View>

                    {/* 6️⃣ Contact Details */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact Details</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>Phone:</Text> {profile.phone_number}</Text>
                        <Text style={styles.detailText}><Text style={styles.detailLabel}>WhatsApp:</Text> {profile.whatsapp_number}</Text>
                    </View>

                    {/* 7️⃣ Partner Expectations */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Partner Expectations</Text>
                        <Text style={styles.detailText}>{profile.expectations || 'Not Specified'}</Text>
                    </View>

                    {/* 8️⃣ Other Comments */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Other Comments</Text>
                        <Text style={styles.detailText}>{profile.other_comments || 'None'}</Text>
                    </View>
                </View>

                {/* ─── Action Buttons ─── */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.interestBtn}
                        activeOpacity={0.85}
                        onPress={() =>
                            Alert.alert(
                                'Interest Sent 💌',
                                `Your interest has been sent to ${profile.full_name}.`
                            )
                        }
                    >
                        <MaterialCommunityIcons name="heart" size={20} color="#fff" />
                        <Text style={styles.interestBtnText}>Send Interest</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
};

/* ─── Sub-components ─── */

const QuickStat = ({ icon, label, value }) => (
    <View style={styles.quickStat}>
        <MaterialCommunityIcons name={icon} size={22} color={COLORS.primary} />
        <Text style={styles.quickStatValue} numberOfLines={1}>{String(value)}</Text>
        <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
);

const SectionCard = ({ title, icon, children }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <View style={styles.cardDivider} />
        {children}
    </View>
);

const DetailRow = ({ icon, label, value }) => {
    if (!value) return null;
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIconLabel}>
                <MaterialCommunityIcons name={icon} size={16} color={COLORS.textSecondary} />
                <Text style={styles.detailLabel}>{label}</Text>
            </View>
            <Text style={styles.detailValue}>{String(value)}</Text>
        </View>
    );
};

/* ─── Styles ─── */

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingBottom: SPACING.xl,
    },

    // Loading / Error
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: SPACING.sm,
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: SPACING.lg,
    },
    errorText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
        textAlign: 'center',
        marginTop: SPACING.md,
    },
    retryBtn: {
        marginTop: SPACING.lg,
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.sm,
        borderRadius: 25,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: FONT_SIZES.md,
    },

    // Hero Header
    heroContainer: {
        height: 280,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: SPACING.lg,
        overflow: 'hidden',
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    backButton: {
        position: 'absolute',
        top: SPACING.md,
        left: SPACING.md,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: SPACING.md,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.85)',
        backgroundColor: '#ddd',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: '#007AFF',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    heroName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    heroSub: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
        marginTop: 4,
    },

    // Quick Stats
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: SPACING.md,
        marginTop: -20,
        borderRadius: 16,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        marginBottom: SPACING.md,
        justifyContent: 'space-around',
    },
    quickStat: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 4,
    },
    quickStatValue: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 4,
        textAlign: 'center',
    },
    quickStatLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 2,
        textAlign: 'center',
    },

    sectionsWrapper: {
        paddingHorizontal: SPACING.md,
    },
    section: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: COLORS.primary,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
        paddingBottom: 6,
    },
    detailText: {
        fontSize: 15,
        color: '#333',
        marginBottom: 6,
        lineHeight: 22,
    },
    detailLabel: {
        fontWeight: '600',
        color: '#555',
    },

    // Actions
    actionsContainer: {
        marginHorizontal: SPACING.md,
        marginTop: SPACING.sm,
    },
    interestBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 30,
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
    },
    interestBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },

    bottomSpacer: {
        height: SPACING.xl,
    },
});

export default ViewFullProfileScreen;
