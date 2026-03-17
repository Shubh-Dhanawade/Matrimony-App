import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";

const PendingScreen = () => {
  const { logout, profileStatus, checkProfileStatus } = useAuth();
  const { t } = useTranslation();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isRejected = profileStatus === "Rejected";

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    if (!isRejected) {
      // Pulse animation for pending icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }

    // Poll for status change every 30 seconds (in case admin approves while app is open)
    if (!isRejected) {
      const interval = setInterval(() => {
        checkProfileStatus();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isRejected]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.card}>
        {/* Icon */}
        <Animated.View
          style={[
            styles.iconWrap,
            isRejected ? styles.iconWrapRejected : styles.iconWrapPending,
            { transform: [{ scale: isRejected ? 1 : pulseAnim }] },
          ]}
        >
          <MaterialCommunityIcons
            name={isRejected ? "close-circle-outline" : "clock-outline"}
            size={72}
            color={isRejected ? "#FF3B30" : COLORS.primary}
          />
        </Animated.View>

        {/* Title */}
        <Text style={[styles.title, isRejected && styles.titleRejected]}>
          {isRejected
            ? t("profile_rejected_title")
            : t("profile_pending_title")}
        </Text>

        {/* Message */}
        <Text style={styles.message}>
          {isRejected ? t("profile_rejected_msg") : t("profile_pending_msg")}
        </Text>

        {/* Status Badge */}
        <View
          style={[
            styles.badge,
            isRejected ? styles.badgeRejected : styles.badgePending,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isRejected ? styles.badgeTextRejected : styles.badgeTextPending,
            ]}
          >
            {isRejected ? t("status_rejected") : t("status_pending")}
          </Text>
        </View>

        {/* Check Again button (Pending only) */}
        {!isRejected && (
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => checkProfileStatus()}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.refreshText}>{t("check_status")}</Text>
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={18} color="#666" />
          <Text style={styles.logoutText}>{t("logout")}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  iconWrapPending: {
    backgroundColor: COLORS.primary + "15",
  },
  iconWrapRejected: {
    backgroundColor: "#FF3B3015",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 12,
  },
  titleRejected: {
    color: "#FF3B30",
  },
  message: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 28,
  },
  badgePending: {
    backgroundColor: "#FFF3CD",
  },
  badgeRejected: {
    backgroundColor: "#FFE5E5",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  badgeTextPending: {
    color: "#B8860B",
  },
  badgeTextRejected: {
    color: "#CC0000",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginBottom: 16,
  },
  refreshText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 15,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
  },
  logoutText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default PendingScreen;
