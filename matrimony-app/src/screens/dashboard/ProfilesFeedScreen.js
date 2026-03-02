import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Alert,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import ProfileCard from '../../components/ProfileCard';
import { useAuth } from '../../context/AuthContext';

const { height } = Dimensions.get('window');

const ProfilesFeedScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const fetchProfiles = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            console.log('[FEED] Triggering fetch profiles...');
            const response = await api.get('/profiles/latest');
            setProfiles(response.data);

            const meRes = await api.get('/profiles/me');
            // Added safety check for null profile
            const userProfile = meRes.data?.profile;
            setIsSubscribed(userProfile ? userProfile.is_subscribed === 1 : false);

            console.log('[FEED] Fetch successful');
        } catch (error) {
            console.error('[FEED] Fetch error detail:', error.response?.data || error.message);
            Alert.alert(t('error'), t('error_fetch_profiles'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    const handleAction = async (type, profile) => {
        try {
            switch (type) {
                case 'skip':
                    await api.post('/profiles/ignore', { receiverId: profile.user_id });
                    setProfiles(prev => prev.filter(p => p.user_id !== profile.user_id));
                    break;
                case 'shortlist':
                    await api.post('/profiles/interest', { receiverId: profile.user_id });
                    Alert.alert(t('shortlisted_title'), t('shortlisted_msg', { name: profile.full_name }));
                    break;
                case 'interested':
                    await api.post('/profiles/interest', { receiverId: profile.user_id });
                    Alert.alert(t('interested_title'), t('interested_msg', { name: profile.full_name }));
                    break;
                case 'chat':
                    Alert.alert(t('chat_title'), t('chat_msg', { name: profile.full_name }));
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error(`[FEED] Action ${type} error:`, error);
            Alert.alert(t('error'), t('action_failed'));
        }
    };

    const renderItem = useCallback(({ item }) => (
        <ProfileCard
            profile={item}
            isSubscribed={isSubscribed}
            onUpgrade={() => navigation.navigate('Upgrade')}
            onAction={handleAction}
        />
    ), [isSubscribed, navigation, t]); // t is needed for handleAction dependence indirectly

    const keyExtractor = useCallback((item) => `profile-${item.user_id}`, []);

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>{t('finding_matches')}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('find_matches_title')}</Text>
                <Text style={styles.headerSubtitle}>{t('find_matches_subtitle')}</Text>
            </View>

            <FlatList
                data={profiles}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
                snapToInterval={height * 0.65 + 30}
                snapToAlignment="start"
                decelerationRate="fast"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchProfiles(true)}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="account-search-outline" size={80} color={COLORS.textSecondary} />
                        <Text style={styles.emptyTitle}>{t('no_more_profiles')}</Text>
                        <Text style={styles.emptySubtitle}>{t('no_more_profiles_desc')}</Text>
                    </View>
                }
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews={true}
                contentContainerStyle={profiles.length === 0 ? { flex: 1 } : { paddingBottom: SPACING.xl }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.background,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 15,
        color: COLORS.textSecondary,
        fontSize: 16,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 22,
    },
});

export default ProfilesFeedScreen;
