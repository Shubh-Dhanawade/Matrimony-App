import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
  StatusBar,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import { COLORS, SPACING } from "../../utils/constants";
import { getProfileImageUri } from "../../utils/imageUtils";
import ProfileCard from "../../components/ProfileCard";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

const ProfilesFeedScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const isPaid =
    Number(user?.is_paid) === 1 ||
    Number(user?.is_subscribed) === 1;
  const [isSubscribed, setIsSubscribed] = useState(isPaid); // Renamed to reflect combined status

  // Animation
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const busy = useRef(false); // prevents double-taps during animation

  // ── Load all profiles on mount ─────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [feedRes, meRes] = await Promise.all([
          api.get("/profiles/latest"),
          api.get("/profiles/me"),
        ]);

        if (!mounted) return;

        const data = feedRes.data;
        // Handle both plain-array and wrapped-object responses
        const profileList = Array.isArray(data) ? data : data.profiles || [];
        setProfiles(profileList);

        const userProfile = meRes.data?.profile;
        const subStatus =
          Number(userProfile?.is_paid) === 1 ||
          Number(user?.is_paid) === 1 ||
          Number(userProfile?.is_subscribed) === 1 ||
          Number(user?.is_subscribed) === 1;

        console.log(
          `[FEED] Viewer status - Me: ${Number(user?.is_paid)}, Profile: ${Number(userProfile?.is_paid)}, Result: ${subStatus}`,
        );
        setIsSubscribed(subStatus);

        console.log(`[FEED] Loaded ${profileList.length} profiles`);

        // Preload the next card's image in background
        if (profileList.length > 1) {
          const nextImg = getProfileImageUri(
            profileList[1]?.photos?.[0] || profileList[1]?.avatar_url,
          );
          if (nextImg) Image.prefetch(nextImg).catch(() => { });
        }
      } catch (e) {
        console.error("[FEED] Load error:", e.response?.data || e.message);
        if (mounted) Alert.alert(t("error"), t("error_fetch_profiles"));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Preload next card images (up to 3) for zero-waiting ──────────────
  const prefetchNext = useCallback(
    (nextIdx) => {
      const p = profiles[nextIdx + 1];
      if (!p) return;
      const uris = [
        getProfileImageUri(p.avatar_url),
        ...(p.photos || []).map((url) => getProfileImageUri(url)),
      ].slice(0, 3);

      uris.forEach((uri) => {
        if (uri) Image.prefetch(uri).catch(() => { });
      });
    },
    [profiles],
  );

  // ── Reload user data silently when this tab gains focus ─────────────
  useFocusEffect(
    useCallback(() => {
      // Background thread pull of the latest `is_paid` value from DB
      refreshUser();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // ── Smooth transition animation ────────────────────────────────────
  const animate = useCallback(
    (direction, onSwap) => {
      // direction: 1 = Next (slide left), -1 = Previous (slide right)
      if (busy.current) return;
      busy.current = true;

      // Stage 1: Current card slides out/shrinks
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -direction * (width * 1.1),
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: -direction * 15, // rotate slightly as it leaves
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Swap data
        onSwap();

        // Stage 2: Reset position for entry (from the opposite side)
        translateX.setValue(direction * (width * 1.1));
        rotate.setValue(direction * 15);
        scale.setValue(0.85);
        opacity.setValue(0);

        // Stage 3: New card slides in/pops up
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.spring(rotate, {
            toValue: 0,
            friction: 8,
            tension: 30,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          busy.current = false;
        });
      });
    },
    [translateX, opacity, scale, rotate],
  );

  // ── Next ───────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (busy.current) return;
    const next = currentIndex + 1;
    if (next >= profiles.length) return;

    animate(1, () => setCurrentIndex(next));
    prefetchNext(next);
  }, [currentIndex, profiles.length, animate, prefetchNext]);

  // ── Previous ───────────────────────────────────────────────────────
  const goPrev = useCallback(() => {
    if (busy.current || currentIndex === 0) return;

    animate(-1, () => setCurrentIndex(currentIndex - 1));
  }, [currentIndex, animate]);

  // ── Card actions ───────────────────────────────────────────────────
  const handleAction = useCallback(
    async (type, profile) => {
      try {
        if (type === "prev") {
          goPrev();
        } else if (type === "next") {
          goNext();
        } else if (type === "skip") {
          animate(1, async () => {
            try {
              await api.post("/profiles/ignore", {
                receiverId: profile.user_id,
              });
              setProfiles((prev) =>
                prev.filter((p) => p.user_id !== profile.user_id),
              );
            } catch (err) {
              console.error("Skip error:", err);
            }
          });
        } else if (type === "shortlist") {
          const payload = { profileUserId: profile.user_id };
          console.log("[FEED_SHORTLIST] Sending payload:", payload);
          console.log("[FEED_SHORTLIST] To endpoint: /profiles/shortlist");
          console.log("[FEED_SHORTLIST] Profile object:", profile);

          const response = await api.post("/profiles/shortlist", payload);

          console.log("[FEED_SHORTLIST] Success response:", response.data);
          Alert.alert(
            t("shortlisted_title"),
            `${profile.full_name || "Profile"} ${t("profile_shortlisted_msg").replace("Profile added to your shortlist!", "") || t("profile_shortlisted_msg")}`,
            [
              { text: "OK" },
              {
                text: "View Shortlist",
                onPress: () => navigation.navigate("Shortlist"),
              },
            ],
          );
        } else if (type === "refresh") {
          // Re-fetch all to get latest statuses (like shortlisted, invitation_status)
          const feedRes = await api.get("/profiles/latest");
          const data = feedRes.data;
          const profileList = Array.isArray(data) ? data : data.profiles || [];
          setProfiles(profileList);
        }
      } catch (error) {
        console.error(`[FEED] Action ${type} error:`, error);
        const errMsg = error?.response?.data?.message;
        if (errMsg === "You have already sent interest to this person") {
          Alert.alert("Already Sent", "You have already sent interest.");
        } else if (errMsg === "Already shortlisted") {
          Alert.alert(t("already_saved"), t("already_saved_msg"));
        } else {
          Alert.alert(
            t("error"),
            errMsg || error.message || t("action_failed"),
          );
        }
      }
    },
    [t, currentIndex, profiles.length, animate, navigation],
  );

  // ── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t("finding_matches")}</Text>
      </View>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────
  const currentProfile = profiles[currentIndex] || null;
  if (!currentProfile) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{t("find_matches_title")}</Text>
          <Text style={styles.headerSub}>{t("find_matches_subtitle")}</Text>
        </View>
        <View style={styles.center}>
          <MaterialCommunityIcons
            name="account-search-outline"
            size={80}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyTitle}>{t("no_more_profiles")}</Text>
          <Text style={styles.emptySub}>{t("no_more_profiles_desc")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isFirst = currentIndex === 0;
  const isLast = currentIndex >= profiles.length - 1;
  const total = profiles.length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>{t("find_matches_title")}</Text>
          <Text style={styles.headerSub}>{t("find_matches_subtitle")}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {currentIndex + 1} / {total}
          </Text>
        </View>
      </View>

      {/* Animated card Stack */}
      <View style={styles.cardArea}>
        {/* Active card (Current) */}
        <Animated.View
          style={[
            styles.cardAnimated,
            {
              opacity,
              transform: [
                { translateX },
                { scale },
                {
                  rotate: rotate.interpolate({
                    inputRange: [-10, 0, 10],
                    outputRange: ["-10deg", "0deg", "10deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <ProfileCard
            language={i18n.language}
            profile={currentProfile}
            isFirst={currentIndex === 0}
            isLast={currentIndex >= profiles.length - 1}
            isSubscribed={isSubscribed}
            isPaid={isSubscribed}
            onUpgrade={() => navigation.navigate("Payment")}
            onAction={handleAction}
            onViewProfile={(userId) =>
              navigation.navigate("ViewFullProfile", { userId })
            }
            navigation={navigation}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  badge: {
    backgroundColor: "rgba(233,30,99,0.15)",
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 13,
  },
  // Card
  cardArea: {
    flex: 1,
    overflow: "hidden",
  },
  cardAnimated: {
    flex: 1,
  },
  // Navigation bar
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "black",
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    minWidth: 105,
    justifyContent: "center",
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  navBtnOff: {
    backgroundColor: COLORS.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  navLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.7,
    marginHorizontal: 2,
  },
  navLabelOff: {
    color: "rgba(0,0,0,0.4)",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotOn: {
    width: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  // Loading / empty
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 14,
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "500",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 20,
  },
  emptySub: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
});

export default ProfilesFeedScreen;
