import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { COLORS, SPACING, FONT_SIZES } from "../../utils/constants";

const WHATSAPP_NUMBER = "918446430330";
const DISPLAY_NUMBER = "84464 30330";

const HelpSupportScreen = () => {
  const handleWhatsAppChat = () => {
    const message = "Hello, I need help with my ShivSathi Matrimony account.";
    const url = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          // Fallback to web WhatsApp
          const webUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => console.error("WhatsApp error:", err));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="headset"
              size={50}
              color={COLORS.primary}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Customer Support</Text>

          {/* Description */}
          <Text style={styles.description}>
            If you need help regarding your profile, payment, or matches,
            contact our support team.
          </Text>

          {/* WhatsApp Number Card */}
          <View style={styles.numberCard}>
            <MaterialCommunityIcons
              name="whatsapp"
              size={28}
              color="#25D366"
            />
            <View style={styles.numberInfo}>
              <Text style={styles.numberLabel}>WhatsApp Number</Text>
              <Text style={styles.numberText}>{DISPLAY_NUMBER}</Text>
            </View>
          </View>

          {/* WhatsApp Chat Button */}
          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={handleWhatsAppChat}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="whatsapp" size={24} color="#fff" />
            <Text style={styles.whatsappBtnText}>Chat on WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  content: {
    alignItems: "center",
    width: "100%",
    maxWidth: 380,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FCE4EC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  numberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: "100%",
    marginBottom: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  numberInfo: {
    marginLeft: 15,
  },
  numberLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 2,
  },
  numberText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    letterSpacing: 1,
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 14,
    width: "100%",
    elevation: 4,
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  whatsappBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    marginLeft: 10,
  },
});

export default HelpSupportScreen;
