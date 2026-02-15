import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import RegistrationScreen from '../screens/registration/RegistrationScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ProfileViewScreen from '../screens/dashboard/ProfileViewScreen';
import CustomHeader from '../components/CustomHeader';
import api from '../services/api';
import { COLORS } from '../utils/constants';
import AdminDashboard from '../screens/dashboard/AdminDashboard';
import ManageProfiles from '../screens/dashboard/ManageProfiles';
import ManageUsers from '../screens/dashboard/ManageUsers';

const Stack = createNativeStackNavigator();

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

const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      header: ({ options, route }) => (
        <CustomHeader
          title={options.title || route.name}
          showBack={route.name !== 'Dashboard'}
          onBackPress={options.onBackPress}
        />
      )
    }}
  >
    <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Find Your Match' }} />
    <Stack.Screen name="Registration" component={RegistrationScreen} options={{ title: 'Profile' }} />
    <Stack.Screen name="ProfileView" component={ProfileViewScreen} options={{ title: 'My Profile' }} />
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
