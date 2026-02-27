import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import RegistrationScreen from '../screens/registration/RegistrationScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ProfileViewScreen from '../screens/dashboard/ProfileViewScreen';
import UpgradeScreen from '../screens/dashboard/UpgradeScreen';
import UserProfileScreen from '../screens/dashboard/UserProfileScreen';
import InvitationsScreen from '../screens/dashboard/InvitationsScreen';
import CustomHeader from '../components/CustomHeader';
import api from '../services/api';
import { COLORS } from '../utils/constants';
import AdminDashboard from '../screens/dashboard/AdminDashboard';
import ManageProfiles from '../screens/dashboard/ManageProfiles';
import ManageUsers from '../screens/dashboard/ManageUsers';
import ProfilesFeedScreen from '../screens/dashboard/ProfilesFeedScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      header: ({ options, route }) => (
        <CustomHeader
          title={options.title || route.name}
          showBack={route.name !== 'Login'}
          onBackPress={options.onBackPress}
        />
      )
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />
  </Stack.Navigator>
);

const AdminStack = () => (
  <Stack.Navigator
    screenOptions={{
      header: ({ options, route }) => (
        <CustomHeader
          title={options.title || route.name}
          showBack={route.name !== 'AdminDashboard'}
          onBackPress={options.onBackPress}
        />
      )
    }}
  >
    <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: 'Admin Overview' }} />
    <Stack.Screen name="ManageProfiles" component={ManageProfiles} options={{ title: 'Manage Profiles' }} />
    <Stack.Screen name="ManageUsers" component={ManageUsers} options={{ title: 'Manage Users' }} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName;
        if (route.name === 'Find match') iconName = 'cards-outline';
        else if (route.name === 'Invitations') iconName = 'email-outline';
        else if (route.name === 'My profile') iconName = 'account-outline';
        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: 'gray',
      headerShown: true,
      header: ({ options, route: tabRoute }) => (
        <CustomHeader
          title={options.title || tabRoute.name}
          showBack={false}
        />
      )
    })}
  >
    <Tab.Screen name="Find match" component={ProfilesFeedScreen} options={{ title: 'Find Your Match', headerShown: false }} />
    <Tab.Screen name="Invitations" component={InvitationsScreen} options={{ title: 'Invitations' }} />
    <Tab.Screen name="My profile" component={UserProfileScreen} options={{ title: 'My Profile' }} />
  </Tab.Navigator>
);

const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      header: ({ options, route }) => (
        <CustomHeader
          title={options.title || route.name}
          showBack={true}
          onBackPress={options.onBackPress}
        />
      )
    }}
  >
    <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
    <Stack.Screen name="Registration" component={RegistrationScreen} options={{ title: 'Profile' }} />
    <Stack.Screen name="ProfileView" component={ProfileViewScreen} options={{ title: 'Profile Details' }} />
    <Stack.Screen name="Upgrade" component={UpgradeScreen} options={{ title: 'Upgrade to Premium' }} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user, isAuthenticated, loading, hasProfile } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : isAdmin ? (
        <AdminStack />
      ) : !hasProfile ? (
        <Stack.Navigator
          screenOptions={{
            header: ({ options, route }) => (
              <CustomHeader
                title={options.title || route.name}
                showBack={true}
                onBackPress={options.onBackPress}
              />
            )
          }}
        >
          <Stack.Screen name="Registration" component={RegistrationScreen} options={{ title: 'Create Profile' }} />
        </Stack.Navigator>
      ) : (
        <MainStack />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
