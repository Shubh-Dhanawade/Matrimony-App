import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import LanguageSelector from '../../components/LanguageSelector';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import axios from 'axios';

const SignupScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const [mobileNumberError, setMobileNumberError] = useState('');

  const handleSignup = async () => {
    let isValid = true;
    
    if (!mobileNumber) {
      setMobileNumberError(t('phone_number_required') || 'Mobile number is required');
      isValid = false;
    } else if (mobileNumber.length !== 10) {
      setMobileNumberError(t('invalid_phone_number') || 'Mobile number must be exactly 10 digits');
      isValid = false;
    } else {
      setMobileNumberError('');
    }

    if (!isValid || !password || !confirmPassword) {
      if (!password || !confirmPassword) {
        Alert.alert(t('error') || 'Error', t('fill_all_fields') || 'Please fill all fields');
      } else if (!isValid) {
        Alert.alert(t('error') || 'Error', mobileNumberError || t('invalid_phone_number'));
      }
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('error') || 'Error', t('password_mismatch') || 'Passwords do not match');
      return;
    }

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('signup_title') || 'Join Matrimony'}</Text>
        <CustomInput
          label={`${t('mobile_number') || 'Mobile Number'} *`}
          placeholder={t('mobile_placeholder') || "Enter mobile number"}
          keyboardType="phone-pad"
          required
          value={mobileNumber}
          onChangeText={(v) => {
            setMobileNumber(v);
            if (v.length === 10) setMobileNumberError('');
          }}
          error={mobileNumberError}
          maxLength={10}
        />
        <CustomInput
          label={`${t('password') || 'Password'} *`}
          placeholder={t('password_placeholder') || "Create password"}
          secureTextEntry={!showPassword}
          required
          value={password}
          onChangeText={(e) => setPassword(e)}
          rightIcon={showPassword ? "eye-off" : "eye"}
          onRightIconPress={() => setShowPassword(!showPassword)}
        />
        <CustomInput
          label={`${t('confirm_password') || 'Confirm Password'} *`}
          placeholder={t('confirm_password_placeholder') || "Confirm password"}
          secureTextEntry={!showConfirmPassword}
          required
          value={confirmPassword}
          onChangeText={(e) => setConfirmPassword(e)}
          rightIcon={showConfirmPassword ? "eye-off" : "eye"}
          onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
        />
        <CustomButton title={t('signup_title') || "Create Account"} onPress={() => {
          handleSignup()
        }} loading={loading} />
        <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
          {t('already_user') || "Already have an account? Login"}
        </Text>
        <View style={{ marginTop: SPACING.lg }}>
          <LanguageSelector variant="dropdown" />
        </View>
        {/* <Text style={styles.link} >
          {mobileNumber} , {password}
        </Text> */}
        </ScrollView>
      </KeyboardAvoidingView>
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
