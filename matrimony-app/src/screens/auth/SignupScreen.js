import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import axios from 'axios';

const SignupScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSignup = async () => {
    // if (!mobileNumber || !password) {
    //   Alert.alert('Error', 'Please fill all fields');
    //   return;
    // }

    setLoading(true);
    try {
      const response = await api.post("/auth/register", {
        mobileNumber,
        password
      });
      // await login(response.data.token, response.data.user);
      // It will auto redirect to MainStack -> and then user can complete profile
      Alert.alert(t('success'), response.data.message);

      navigation.navigate('Registration');
    } catch (error) {
      Alert.alert(t('registration_failed'), error.response?.data?.message || t('action_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Join Matrimony</Text>
        <CustomInput
          label="Mobile Number *"
          placeholder="Enter mobile number"
          keyboardType="phone-pad"
          required
          value={mobileNumber}
          onChangeText={(e) => setMobileNumber(e)}
        />
        <CustomInput
          label="Password *"
          placeholder="Create password"
          secureTextEntry
          required
          value={password}
          onChangeText={(e) => setPassword(e)}
        />
        <CustomButton title="Create Account" onPress={() => {
          handleSignup()
        }} loading={loading} />
        <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
          Already have an account? Login
        </Text>
        {/* <Text style={styles.link} >
          {mobileNumber} , {password}
        </Text> */}
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

export default SignupScreen;
