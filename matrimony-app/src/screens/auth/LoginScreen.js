import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';

const LoginScreen = ({ navigation }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    console.log('Attempting login with:', { mobileNumber, password });
    if (!mobileNumber || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { mobileNumber, password });
      console.log('Login success response:', response.data);
      const { token, user } = response.data;
      
      await login(token, user);

      // Role-based navigation reset
      if (user.role === 'admin') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'AdminDashboard' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      }
      
    } catch (error) {
      console.log('Login error response:', error.response?.data);
      Alert.alert('Login Failed', error.response?.data?.message || 'Check your credentials');
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Matrimony login</Text>
        <CustomInput
          label="Mobile Number"
          placeholder="Enter mobile number"
          keyboardType="phone-pad"
          value={mobileNumber}
          onChangeText={setMobileNumber}
        />
        <CustomInput
          label="Password"
          placeholder="Enter password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <CustomButton title="Login" onPress={()=>{
          handleLogin(mobileNumber, password)
        }} loading={loading} />
        <Text style={styles.link} onPress={() => navigation.navigate('Signup')}>
          New user? Create an account
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, justifyContent: 'center', flexGrow: 1 },
  title: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.xl, textAlign: 'center' },
  link: { color: COLORS.primary, textAlign: 'center', marginTop: SPACING.lg, fontSize: FONT_SIZES.md }
});

export default LoginScreen;
