import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    console.log('Attempting login with:', { mobileNumber, password });
    if (!mobileNumber || !password) {
      Alert.alert(t('error'), t('fill_all_fields'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { mobileNumber, password });
      console.log('Login success response:', response.data);
      const { token, user } = response.data;

      await login(token, user);

      // No manual navigation needed!
      // AppNavigator will see isAuthenticated=true and switch the stack.

    } catch (error) {
      console.log('Login error response:', error.response?.data);
      Alert.alert(t('login_failed'), error.response?.data?.message || t('check_credentials'));

    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('login_title')}</Text>
        <CustomInput
          label={t('mobile_number')}
          placeholder={t('mobile_placeholder')}
          keyboardType="phone-pad"
          value={mobileNumber}
          onChangeText={setMobileNumber}
        />
        <CustomInput
          label={t('password')}
          placeholder={t('password_placeholder')}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <CustomButton title={t('login')} onPress={() => {
          handleLogin(mobileNumber, password)
        }} loading={loading} />
        <Text style={styles.link} onPress={() => navigation.navigate('Signup')}>
          {t('new_user_link')}
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
