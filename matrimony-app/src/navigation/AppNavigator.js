import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { ActivityIndicator, View } from "react-native";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";

import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import PendingScreen from "../screens/auth/PendingScreen";
import RegistrationScreen from "../screens/registration/RegistrationScreen";
import ProfileViewScreen from "../screens/dashboard/ProfileViewScreen";
import UpgradeScreen from "../screens/dashboard/UpgradeScreen";
import UserProfileScreen from "../screens/dashboard/UserProfileScreen";
import ViewFullProfileScreen from "../screens/dashboard/ViewFullProfileScreen";
import InvitationsScreen from "../screens/dashboard/InvitationsScreen";
import ShortlistedScreen from "../screens/dashboard/ShortlistedScreen";
import CustomHeader from "../components/CustomHeader";
import { COLORS } from "../utils/constants";
import ProfilesFeedScreen from "../screens/dashboard/ProfilesFeedScreen";
import HelpSupportScreen from "../screens/dashboard/HelpSupportScreen";
import AccountSecurityScreen from "../screens/dashboard/AccountSecurityScreen";
import BlockedUsersScreen from "../screens/dashboard/BlockedUsersScreen";
import PaymentScreen from "../screens/dashboard/PaymentScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        header: ({ options, route }) => (
          <CustomHeader
            title={options.title || route.name}
            showBack={route.name !== "Login"}
            onBackPress={options.onBackPress}
          />
        ),
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ title: t("signup_title") }}
      />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Find match") iconName = "cards-outline";
          else if (route.name === "Invitations") iconName = "email-outline";
          else if (route.name === "My profile") iconName = "account-outline";
          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "gray",
        headerShown: true,
        header: ({ options, route: tabRoute }) => (
          <CustomHeader
            title={options.title || tabRoute.name}
            showBack={false}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Find match"
        component={ProfilesFeedScreen}
        options={{
          title: t("find_your_match"),
          headerShown: false,
          tabBarLabel: t("find_match_tab"),
        }}
      />

      <Tab.Screen
        name="Invitations"
        component={InvitationsScreen}
        options={{
          title: t("invitations_title"),
          tabBarLabel: t("invitations_tab"),
        }}
      />

      <Tab.Screen
        name="My profile"
        component={UserProfileScreen}
        options={{ title: t("my_profile"), tabBarLabel: t("my_profile_tab") }}
      />
    </Tab.Navigator>
  );
};

const MainStack = () => {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        header: ({ options, route }) => (
          <CustomHeader
            title={options.title || route.name}
            showBack={true}
            onBackPress={options.onBackPress}
          />
        ),
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Registration"
        component={RegistrationScreen}
        options={{ title: t("profile") }}
      />
      <Stack.Screen
        name="ProfileView"
        component={ProfileViewScreen}
        options={{ title: t("profile_details") }}
      />
      <Stack.Screen
        name="Upgrade"
        component={PaymentScreen}
        options={{ title: "Upgrade to Premium", headerShown: false }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: "Upgrade to Premium", headerShown: false }}
      />
      <Stack.Screen
        name="ViewFullProfile"
        component={ViewFullProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
          name="Shortlist"
          component={ShortlistedScreen}
          options={{ title: t("shortlisted_profiles") || "Shortlisted Profiles" }}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ title: t("help_support") || "Help & Support" }}
      />
      <Stack.Screen
        name="AccountSecurity"
        component={AccountSecurityScreen}
        options={{ title: t("account_security") || "Account Security" }}
      />
      <Stack.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
        options={{ title: t("blocked_users") || "Blocked Users" }}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { t } = useTranslation();
  const { isAuthenticated, loading, hasProfile, profileStatus } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Profile is Pending or Rejected → show holding screen (no app access)
  const isApproved = profileStatus === "Approved";
  const isProfileGated = hasProfile && profileStatus && !isApproved;

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : !hasProfile ? (
        <Stack.Navigator
          screenOptions={{
            header: ({ options, route }) => (
              <CustomHeader
                title={options.title || route.name}
                showBack={true}
                onBackPress={options.onBackPress}
              />
            ),
          }}
        >
          <Stack.Screen
            name="Registration"
            component={RegistrationScreen}
            options={{ title: t("registration_title_create") }}
          />
        </Stack.Navigator>
      ) : isProfileGated ? (
        // Profile exists but not yet Approved (Pending or Rejected)
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Pending" component={PendingScreen} />
        </Stack.Navigator>
      ) : (
        <MainStack />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
