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
  const { t } = useTranslation();
  const { user } = useAuth();

  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Animation
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
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
        setIsSubscribed(userProfile ? userProfile.is_subscribed === 1 : false);

        console.log(`[FEED] Loaded ${profileList.length} profiles`);

        // Preload the next card's image in background
        if (profileList.length > 1) {
          const nextImg = getProfileImageUri(
            profileList[1]?.photos?.[0] || profileList[1]?.avatar_url,
          );
          if (nextImg) Image.prefetch(nextImg).catch(() => {});
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

  // ── Preload next card image after navigation ───────────────────────
  const prefetchNext = useCallback(
    (nextIdx) => {
      const p = profiles[nextIdx + 1];
      if (!p) return;
      const uri = getProfileImageUri(p.photos?.[0] || p.avatar_url);
      if (uri) Image.prefetch(uri).catch(() => {});
    },
    [profiles],
  );

  // ── Smooth transition animation ────────────────────────────────────
  const animate = useCallback(
    (direction, onSwap) => {
      // direction: 1 = Next (slide left), -1 = Previous (slide right)
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -direction * (width / 2.5),
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => {
        translateX.setValue(direction * (width / 2.5));
        onSwap();
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start(() => {
          busy.current = false;
        });
      });
    },
    [translateX, opacity],
  );

  // ── Next ───────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (busy.current) return;
    const next = currentIndex + 1;
    if (next >= profiles.length) return;
    busy.current = true;
    animate(1, () => setCurrentIndex(next));
    prefetchNext(next);
  }, [currentIndex, profiles.length, animate, prefetchNext]);

  // ── Previous ───────────────────────────────────────────────────────
  const goPrev = useCallback(() => {
    if (busy.current || currentIndex === 0) return;
    busy.current = true;
    animate(-1, () => setCurrentIndex(currentIndex - 1));
  }, [currentIndex, animate]);

  // ── Card actions ───────────────────────────────────────────────────
  const handleAction = useCallback(
    async (type, profile) => {
      try {
        if (type === "skip") {
          await api.post("/profiles/ignore", { receiverId: profile.user_id });
          setProfiles((prev) =>
            prev.filter((p) => p.user_id !== profile.user_id),
          );
        } else if (type === "shortlist") {
          const payload = { profileUserId: profile.user_id };
          console.log("[FEED_SHORTLIST] Sending payload:", payload);
          console.log("[FEED_SHORTLIST] To endpoint: /profiles/shortlist");
          console.log("[FEED_SHORTLIST] Profile object:", profile);

          const response = await api.post("/profiles/shortlist", payload);

          console.log("[FEED_SHORTLIST] Success response:", response.data);
          Alert.alert(
            "⭐ Added to Shortlist!",
            `${profile.full_name || "This profile"} has been saved.`,
            [
              { text: "OK" },
              {
                text: "View Shortlist",
                onPress: () => navigation.navigate("Shortlist"),
              },
            ],
          );
        }
      } catch (error) {
        console.error(`[FEED] Action ${type} error:`, error);
        const errMsg = error?.response?.data?.message;
        if (errMsg === "You have already sent interest to this person") {
          Alert.alert("Already Sent", "You have already sent interest.");
        } else if (errMsg === "Already shortlisted") {
          Alert.alert(
            "Already Saved",
            "This profile is already in your shortlist.",
          );
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

      {/* Animated card */}
      <View style={styles.cardArea}>
        <Animated.View
          style={[
            styles.cardAnimated,
            { transform: [{ translateX }], opacity },
          ]}
        >
          <ProfileCard
            profile={currentProfile}
            isSubscribed={isSubscribed}
            onUpgrade={() => navigation.navigate("Upgrade")}
            onAction={handleAction}
            onViewProfile={(userId) =>
              navigation.navigate("ViewFullProfile", { userId })
            }
            navigation={navigation}
          />
        </Animated.View>
      </View>

      {/* Navigation bar */}
      <View style={styles.navBar}>
        {/* Previous */}
        <TouchableOpacity
          style={[styles.navBtn, isFirst && styles.navBtnOff]}
          onPress={goPrev}
          disabled={isFirst}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={26}
            color={isFirst ? "rgba(0,0,0,0.2)" : "#fff"}
          />
          <Text style={[styles.navLabel, isFirst && styles.navLabelOff]}>
            PREVIOUS
          </Text>
        </TouchableOpacity>

        {/* Dots */}
        <View style={styles.dots}>
          {Array.from({ length: Math.min(total, 7) }, (_, i) => {
            const half = Math.floor(7 / 2);
            const start = Math.max(0, Math.min(total - 7, currentIndex - half));
            const idx = start + i;
            return (
              <View
                key={i}
                style={[styles.dot, idx === currentIndex && styles.dotOn]}
              />
            );
          })}
        </View>

        {/* Next */}
        <TouchableOpacity
          style={[styles.navBtn, isLast && styles.navBtnOff]}
          onPress={goNext}
          disabled={isLast}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={26}
            color={isLast ? "rgba(0,0,0,0.2)" : "#fff"}
          />
          <Text style={[styles.navLabel, isLast && styles.navLabelOff]}>
            NEXT
          </Text>
        </TouchableOpacity>
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
