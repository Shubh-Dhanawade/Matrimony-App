import React, { useState, useEffect } from "react";
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
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES, IMAGE_BASE_URL } from '../../utils/constants';
import { getProfileImageUri } from '../../utils/imageUtils';

const ViewFullProfileScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const { t } = useTranslation();
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
      console.error("[ViewFullProfile] Error fetching profile:", err);
      setError("Unable to load profile. Please try again.");
      Alert.alert("Error", "Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t("loading_profile")}</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
            <QuickStat icon="human-male-height" label={t("height") || "Height"} value={profile.height ?? '—'} />
            <QuickStat icon="briefcase-outline" label="Profession" value={profile.profession ?? profile.occupation ?? '—'} />
            <QuickStat icon="school-outline" label="Education" value={profile.qualification ?? '—'} />
          </View>

          <View style={styles.sectionsWrapper}>
            {/* 1️⃣ Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>Name:</Text> {profile.full_name}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>Profile For:</Text> {profile.profile_for}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("profile_managed_by")}:</Text> {profile.profile_managed_by ? t(profile.profile_managed_by) || profile.profile_managed_by : 'N/A'}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>Gender:</Text> {profile.gender}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>Age:</Text> {profile.age}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>Date of Birth:</Text> {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("height")}:</Text> {profile.height}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("complexion")}:</Text> {profile.color ? t(profile.color) || profile.color : 'N/A'}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("manglik")}:</Text> {profile.manglik ? (t(`manglik_${profile.manglik.toLowerCase()}`) || t(profile.manglik) || profile.manglik) : 'N/A'}</Text>
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
              <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("state")}:</Text> {profile.state}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("district")}:</Text> {profile.district}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("taluka")}:</Text> {profile.taluka}</Text>
            </View>

            {/* 4️⃣ Professional Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Professional Details</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>Qualification:</Text> {profile.qualification}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>Occupation:</Text> {profile.occupation}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>Profession:</Text> {profile.profession}</Text>
              <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("company_name")}:</Text> {profile.company_name || 'N/A'}</Text>
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
              {profile.parents_phone_number ? (
                <Text style={styles.detailText}><Text style={styles.detailLabel}>Parent's Phone:</Text> {profile.parents_phone_number}</Text>
              ) : null}
              <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("whatsapp")}:</Text> {profile.whatsapp_number}</Text>
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

            {/* 9️⃣ Biodata Link */}
            {profile.biodata_file && profile.biodata_file.trim() !== '' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t("biodata")}</Text>
                <TouchableOpacity
                  style={styles.biodataBtn}
                  onPress={() => Linking.openURL(`${IMAGE_BASE_URL}/${profile.biodata_file}`)}
                >
                  <MaterialCommunityIcons name="file-document-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.biodataBtnText}>{t("view_biodata")}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 🔟 Kundali Link */}
            {profile.kundali_file && profile.kundali_file.trim() !== '' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t("kundali")}</Text>
                <TouchableOpacity
                  style={styles.biodataBtn}
                  onPress={() => Linking.openURL(`${IMAGE_BASE_URL}/${profile.kundali_file}`)}
                >
                  <MaterialCommunityIcons name="file-document-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.biodataBtnText}>{t("view_kundali")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ─── Action Buttons ─── */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.interestBtn}
              activeOpacity={0.85}
              onPress={() =>
                Alert.alert(
                  t("interest_sent"),
                  t("interest_sent_msg", { name: profile.full_name })
                )
              }
            >
              <MaterialCommunityIcons name="heart" size={20} color="#fff" />
              <Text style={styles.interestBtnText}>{t("send_interest")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Hero Header ─── */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={[COLORS.primary, "#C2185B"]}
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
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={18}
                  color="#fff"
                />
              </View>
            )}
          </View>

          <Text style={styles.heroName}>{profile.full_name}</Text>
          {profile.age || profile.marital_status ? (
            <Text style={styles.heroSub}>
              {[profile.age && `${profile.age} yrs`, profile.marital_status]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          ) : null}
        </View>

        {/* ─── Quick Stats ─── */}
        <View style={styles.statsRow}>
          <QuickStat
            icon="human-male-height"
            label={t("height") || "Height"}
            value={profile.height ?? "—"}
          />
          <QuickStat
            icon="briefcase-outline"
            label="Profession"
            value={profile.profession ?? profile.occupation ?? "—"}
          />
          <QuickStat
            icon="school-outline"
            label="Education"
            value={profile.qualification ?? "—"}
          />
        </View>

        <View style={styles.sectionsWrapper}>
          {/* Basic Info */}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>{t("basic_info")}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("name")}:</Text> {profile.full_name}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("profile_for")}:</Text> {t(`profile_for_${profile.profile_for.toLowerCase()}`) || profile.profile_for}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("profile_managed_by")}:</Text> {profile.profile_managed_by ? t(profile.profile_managed_by) || profile.profile_managed_by : 'N/A'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("gender")}:</Text> {t(`gender_${profile.gender.toLowerCase()}`) || profile.gender}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("age")}:</Text> {profile.age}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("dob")}:</Text> {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("height")}:</Text> {profile.height}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("complexion")}:</Text> {profile.color ? t(profile.color) || profile.color : 'N/A'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("manglik")}:</Text> {profile.manglik ? (t(`manglik_${profile.manglik.toLowerCase()}`) || t(profile.manglik) || profile.manglik) : 'N/A'}</Text>
            <Text style={styles.detailText}><Text style={styles.detailLabel}>{t("marital_status")}:</Text> {t(`marital_${profile.marital_status.toLowerCase()}`) || profile.marital_status}</Text>
          </View>

          {/* 2️⃣ Family Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("family_details")}</Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("father_name")}:</Text>{" "}
              {profile.father_name}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("mother_maiden_name")}:</Text>{" "}
              {profile.mother_maiden_name}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("relative_surname")}:</Text>{" "}
              {profile.relative_surname}
            </Text>
          </View>

          {/* 3️⃣ Location Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("location")}</Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("birthplace")}:</Text>{" "}
              {profile.birthplace}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("address")}:</Text> {profile.address}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("state")}:</Text> {profile.state}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("district")}:</Text>{" "}
              {profile.district}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("taluka")}:</Text> {profile.taluka}
            </Text>
          </View>

          {/* 4️⃣ Professional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("professional_details")}</Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("qualification")}:</Text>{" "}
              {profile.qualification}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("occupation")}:</Text>{" "}
              {t(`occupation_${profile.occupation.toLowerCase()}`) || profile.occupation}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("profession")}:</Text>{" "}
              {profile.profession}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("company_name")}:</Text>{" "}
              {profile.company_name || "N/A"}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("monthly_income")}:</Text>{" "}
              {profile.monthly_income}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("property_details")}:</Text>{" "}
              {profile.property}
            </Text>
          </View>

          {/* 5️⃣ Community Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("community_details")}</Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("caste")}:</Text> {profile.caste}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("sub_caste")}:</Text>{" "}
              {profile.sub_caste}
            </Text>
          </View>

          {/* 6️⃣ Contact Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("contact_location")}</Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("phone")}:</Text>{" "}
              {profile.phone_number}
            </Text>
            {profile.parents_phone_number ? (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>{t("parents_phone") || "Parent's Phone"}:</Text>{" "}
                {profile.parents_phone_number}
              </Text>
            ) : null}
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>{t("whatsapp")}:</Text>{" "}
              {profile.whatsapp_number}
            </Text>
          </View>

          {/* 7️⃣ Partner Expectations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("partner_expectations")}</Text>
            <Text style={styles.detailText}>
              {profile.expectations || t("not_specified")}
            </Text>
          </View>

          {/* 8️⃣ Other Comments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("other_comments")}</Text>
            <Text style={styles.detailText}>
              {profile.other_comments || t("none")}
            </Text>
          </View>

          {/* 9️⃣ Biodata Link */}
          {profile.biodata_file && profile.biodata_file.trim() !== "" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("biodata")}</Text>
              <TouchableOpacity
                style={styles.biodataBtn}
                onPress={() =>
                  Linking.openURL(`${IMAGE_BASE_URL}/${profile.biodata_file}`)
                }
              >
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={24}
                  color={COLORS.primary}
                />
                <Text style={styles.biodataBtnText}>{t("view_biodata")}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 🔟 Kundali Link */}
          {profile.kundali_file && profile.kundali_file.trim() !== "" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("kundali")}</Text>
              <TouchableOpacity
                style={styles.biodataBtn}
                onPress={() =>
                  Linking.openURL(`${IMAGE_BASE_URL}/${profile.kundali_file}`)
                }
              >
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={24}
                  color={COLORS.primary}
                />
                <Text style={styles.biodataBtnText}>{t("view_kundali")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ─── Action Buttons ─── */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.shortlistBtn,
              !!profile.is_shortlisted && styles.shortlistBtnDisabled,
            ]}
            activeOpacity={!!profile.is_shortlisted ? 1 : 0.85}
            onPress={async () => {
              if (!!profile.is_shortlisted) return;
              try {
                await api.post("/profiles/shortlist", {
                  profileUserId: profile.user_id,
                });
                setProfile((prev) => ({ ...prev, is_shortlisted: true }));
                Alert.alert("Success", "Profile added to your shortlist!");
              } catch (err) {
                const msg = err.response?.data?.message || err.message;
                if (msg === "Already shortlisted") {
                  setProfile((prev) => ({ ...prev, is_shortlisted: true }));
                  Alert.alert(
                    "Already Saved",
                    "This profile is already in your shortlist.",
                  );
                } else {
                  Alert.alert("Error", msg);
                }
              }
            }}
            disabled={!!profile.is_shortlisted}
          >
            <MaterialCommunityIcons
              name={profile.is_shortlisted ? "star" : "star-outline"}
              size={20}
              color={profile.is_shortlisted ? "#FFB300" : COLORS.primary}
            />
            <Text
              style={[
                styles.shortlistBtnText,
                profile.is_shortlisted && { color: "#999" },
              ]}
            >
              {profile.is_shortlisted ? "Saved" : "Shortlist"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.interestBtn}
            activeOpacity={0.85}
            onPress={() =>
              Alert.alert(
                "Interest Sent 💌",
                `Your interest has been sent to ${profile.full_name}.`,
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
    <Text style={styles.quickStatValue} numberOfLines={1}>
      {String(value)}
    </Text>
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
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={COLORS.textSecondary}
        />
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    top: Platform.OS === 'android' ? SPACING.md + StatusBar.currentHeight : SPACING.xl,
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
  biodataBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: SPACING.sm,
    gap: 8,
  },
  biodataBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },

  bottomSpacer: {
    height: SPACING.xl,
  },
});

export default ViewFullProfileScreen;
