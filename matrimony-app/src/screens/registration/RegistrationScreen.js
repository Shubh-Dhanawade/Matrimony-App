import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import api from '../../services/api';
import { COLORS, SPACING, FONT_SIZES, MARITAL_STATUS_OPTIONS, GENDER_OPTIONS } from '../../utils/constants';
import useHardwareBack from '../../hooks/useHardwareBack';

const RegistrationScreen = ({ navigation, route }) => {
  useHardwareBack();
  const isEdit = route.params?.isEdit || false;
  const [formData, setFormData] = useState({
    full_name: '',
    father_name: '',
    mother_maiden_name: '',
    dob: '',
    gender: 'Male',
    marital_status: 'Never Married',
    address: '',
    birthplace: '',
    qualification: '',
    occupation: '',
    monthly_income: '',
    caste: '',
    sub_caste: '',
    relative_surname: '',
    expectations: '',
    other_comments: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      fetchCurrentProfile();
    }
  }, [isEdit]);

  const fetchCurrentProfile = async () => {
    try {
      const response = await api.get('/profiles/me');
      if (response.data.profile) {
        setFormData(response.data.profile);
      }
    } catch (error) {
       Alert.alert('Error', 'Failed to fetch profile data');
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.dob || !formData.gender) {
      Alert.alert('Error', 'Full name, DOB, and Gender are required');
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        ...formData,
        monthly_income: formData.monthly_income ? parseInt(formData.monthly_income, 10) : 0
      };

      if (isEdit) {
        await api.put('/profiles', payload);
      } else {
        await api.post('/profiles', payload);
      }
      Alert.alert('Success', `Profile ${isEdit ? 'updated' : 'created'} successfully`, [
        { text: 'OK', onPress: () => navigation.replace('Dashboard') }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => setFormData({ ...formData, [field]: value });

  const renderPicker = (label, field, options) => (
    <View style={styles.pickerContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerRow}>
        {options.map(opt => (
          <TouchableOpacity key={opt} style={styles.radio} onPress={() => updateField(field, opt)}>
            <View style={[styles.circle, formData[field] === opt && styles.selected]} />
            <Text style={styles.radioText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (fetching) {
    return <View style={styles.centered}><Text>Loading profile...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.mainTitle}>{isEdit ? 'Edit Your Profile' : 'Create Your Profile'}</Text>

        <Text style={styles.sectionTitle}>Personal Details</Text>
        <CustomInput label="Full Name *" value={formData.full_name} onChangeText={(v) => updateField('full_name', v)} />
        <CustomInput label="Father's Name" value={formData.father_name} onChangeText={(v) => updateField('father_name', v)} />
        <CustomInput label="Mother's Maiden Name" value={formData.mother_maiden_name} onChangeText={(v) => updateField('mother_maiden_name', v)} />
        <CustomInput label="Date of Birth (YYYY-MM-DD) *" value={formData.dob} onChangeText={(v) => updateField('dob', v)} placeholder="1995-10-25" />
        
        {renderPicker('Gender *', 'gender', GENDER_OPTIONS)}
        {renderPicker('Marital Status *', 'marital_status', MARITAL_STATUS_OPTIONS)}

        <Text style={styles.sectionTitle}>Contact & Location</Text>
        <CustomInput label="Birthplace" value={formData.birthplace} onChangeText={(v) => updateField('birthplace', v)} />
        <CustomInput label="Full Address" value={formData.address} onChangeText={(v) => updateField('address', v)} multiline numberOfLines={3} />

        <Text style={styles.sectionTitle}>Professional Details</Text>
        <CustomInput label="Qualification" value={formData.qualification} onChangeText={(v) => updateField('qualification', v)} />
        <CustomInput label="Occupation" value={formData.occupation} onChangeText={(v) => updateField('occupation', v)} />
        <CustomInput label="Monthly Income" value={formData.monthly_income} onChangeText={(v) => updateField('monthly_income', v)} keyboardType="numeric" />

        <Text style={styles.sectionTitle}>Community Details</Text>
        <CustomInput label="Caste" value={formData.caste} onChangeText={(v) => updateField('caste', v)} />
        <CustomInput label="Sub-Caste" value={formData.sub_caste} onChangeText={(v) => updateField('sub_caste', v)} />
        <CustomInput label="Relative Surname" value={formData.relative_surname} onChangeText={(v) => updateField('relative_surname', v)} />

        <Text style={styles.sectionTitle}>Expectations & Photo</Text>
        <CustomInput label="Partner Expectations" value={formData.expectations} onChangeText={(v) => updateField('expectations', v)} multiline numberOfLines={3} />
        <CustomInput label="Profile Photo URL" value={formData.avatar_url} onChangeText={(v) => updateField('avatar_url', v)} placeholder="Paste image link here" />
        
        {formData.avatar_url ? (
          <Image source={{ uri: formData.avatar_url }} style={styles.photoPreview} />
        ) : null}

        <CustomButton title={isEdit ? "Update Profile" : "Save Profile"} onPress={handleSave} loading={loading} style={styles.button} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  mainTitle: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.md, textAlign: 'center' },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.text, marginVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 4 },
  label: { fontSize: FONT_SIZES.sm, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  pickerContainer: { marginBottom: SPACING.md },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap' },
  radio: { flexDirection: 'row', alignItems: 'center', marginRight: SPACING.md, marginBottom: SPACING.sm },
  circle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.primary, marginRight: SPACING.sm },
  selected: { backgroundColor: COLORS.primary },
  radioText: { fontSize: FONT_SIZES.md, color: COLORS.text },
  button: { marginTop: SPACING.xl, marginBottom: SPACING.xl },
  photoPreview: { width: 100, height: 100, borderRadius: 8, marginTop: SPACING.sm, alignSelf: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default RegistrationScreen;
