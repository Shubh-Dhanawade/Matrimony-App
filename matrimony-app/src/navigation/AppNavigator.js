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

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator 
    screenOptions={{ 
      header: ({ options, route }) => (
        <CustomHeader title={options.title || route.name} showBack={route.name !== 'Login'} />
      )
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Create Account' }} />
  </Stack.Navigator>
);

const MainStack = () => (
  <Stack.Navigator 
    screenOptions={{ 
      header: ({ options, route }) => (
        <CustomHeader title={options.title || route.name} showBack={route.name !== 'Dashboard'} />
      )
    }}
  >
    <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Find Your Match' }} />
    <Stack.Screen name="Registration" component={RegistrationScreen} options={{ title: 'Profile' }} />
    <Stack.Screen name="ProfileView" component={ProfileViewScreen} options={{ title: 'My Profile' }} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [hasProfile, setHasProfile] = React.useState(true);

  React.useEffect(() => {
    if (isAuthenticated) {
      checkProfile();
    }
  }, [isAuthenticated]);

  const checkProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await api.get('/profiles/me');
      setHasProfile(response.data.hasProfile);
    } catch (error) {
      console.error('Profile check error:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : !hasProfile ? (
        <Stack.Navigator 
          screenOptions={{ 
            header: ({ options, route }) => (
              <CustomHeader title={options.title || route.name} showBack={false} />
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
