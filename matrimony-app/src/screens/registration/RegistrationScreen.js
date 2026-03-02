import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, Platform, ActivityIndicator, PermissionsAndroid } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import CustomPicker from '../../components/CustomPicker';
import api from '../../services/api';
import { uploadProfilePhotos, getProfilePhotos, deleteProfilePhoto } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, MARITAL_STATUS_OPTIONS, GENDER_OPTIONS, PROFILE_FOR_OPTIONS, TERMS_AND_CONDITIONS, PRIVACY_POLICY } from '../../utils/constants';
import { getProfileImageUri } from '../../utils/imageUtils';
import useHardwareBack from '../../hooks/useHardwareBack';
import { useEffect, useRef, useState, useCallback } from 'react';
import TermsModal from '../../components/TermsModal';
import ConsentSection from '../../components/ConsentSection';
import { formatDateToISO } from '../../utils/dateUtils';

const RegistrationScreen = ({ navigation, route }) => {
  const { logout, checkProfileStatus, updateUser } = useAuth();
  useHardwareBack();
  const isEdit = route.params?.isEdit || false;
  const [formData, setFormData] = useState({
    full_name: '',
    father_name: '',
    mother_maiden_name: '',
    dob: '',
    gender: '',
    marital_status: '',
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
    avatar_url: '',
    profile_for: '',
    other_profile_for: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [initialData, setInitialData] = useState(null);
  const [pickedImage, setPickedImage] = useState(null);
  const isSaved = useRef(false);

  // Multiple Photos State
  const [selectedMultipleImages, setSelectedMultipleImages] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [fetchingPhotos, setFetchingPhotos] = useState(false);


  // Consent State
  const [consents, setConsents] = useState({
    ageConfirmed: false,
    termsAccepted: false,
    privacyAccepted: false,
    infoAccurate: false,
    displayConsent: false,
  });

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ title: '', content: '' });

  const isConsentValid = Object.values(consents).every(val => val === true);

  useEffect(() => {
    if (!initialData && !isEdit) {
      setInitialData(formData);
    }
  }, [formData, initialData, isEdit]);

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback for cases where GO_BACK is not handled (e.g. first screen in stack)
      if (isEdit) {
        navigation.replace('Dashboard');
      } else {
        // If it's the Create Profile screen and it's the first screen, 
        // going "back" logic should Logout to return to Login screen.
        Alert.alert(
          'Exit Registration',
          'Do you want to log out and return to the login screen?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => logout() }
          ]
        );
      }
    }
  };

  useEffect(() => {
    navigation.setOptions({
      onBackPress: handleGoBack
    });
  }, [navigation, initialData, formData]); // Re-set if data changes to ensure listener sees latest state (though handleGoBack uses closure)

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const hasChanges = initialData && JSON.stringify(formData) !== JSON.stringify(initialData);
      const hasPickedImage = !!pickedImage;

      if ((!hasChanges && !hasPickedImage) || isSaved.current) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        'Unsaved Changes',
        'Are you sure you want to go back? Unsaved changes will be lost.',
        [
          { text: 'Stay', style: 'cancel', onPress: () => { } },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, formData, initialData]);

  useEffect(() => {
    if (isEdit) {
      fetchCurrentProfile();
      fetchExistingPhotos();
    }
  }, [isEdit]);

  // ═══════════════════════════════════════════
  //  MULTIPLE PHOTOS FUNCTIONS
  // ═══════════════════════════════════════════

  const fetchExistingPhotos = async () => {
    try {
      setFetchingPhotos(true);
      const res = await api.get('/profiles/me');
      const userId = res.data.profile?.user_id;
      if (userId) {
        const photosRes = await getProfilePhotos(userId);
        setExistingPhotos(photosRes.data.photos || []);
      }
    } catch (err) {
      console.error('[MULTI_PHOTO] Fetch error:', err);
    } finally {
      setFetchingPhotos(false);
    }
  };

  const requestGalleryPermission = async () => {
    console.log('[MULTI_PHOTO] Requesting gallery permission...');
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[MULTI_PHOTO] Permission status:', status);
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to select photos. Please grant permission in Settings.',
        );
        return false;
      }
      return true;
    }
    return true;
  };

  const selectMultiplePhotos = async () => {
    console.log('[MULTI_PHOTO] Button pressed - selectMultiplePhotos called');
    console.log('[MULTI_PHOTO] Existing photos:', existingPhotos.length);
    console.log('[MULTI_PHOTO] Already selected:', selectedMultipleImages.length);

    const maxNew = 5 - existingPhotos.length;
    if (maxNew <= 0) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 5 photos.');
      return;
    }

    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      console.log('[MULTI_PHOTO] Permission denied, aborting');
      return;
    }

    try {
      console.log('[MULTI_PHOTO] Launching image library with allowsMultipleSelection...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: Math.min(maxNew, 5 - selectedMultipleImages.length),
        quality: 0.8,
        orderedSelection: true,
      });

      console.log('[MULTI_PHOTO] Picker result canceled:', result.canceled);

      if (result.canceled) {
        console.log('[MULTI_PHOTO] User cancelled picker');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        console.log('[MULTI_PHOTO] Selected', result.assets.length, 'images');
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.mimeType || asset.type || 'image/jpeg',
          fileName: asset.fileName || `photo_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
        }));
        setSelectedMultipleImages(prev => [...prev, ...newImages].slice(0, maxNew));
      } else {
        console.log('[MULTI_PHOTO] No assets in result');
      }
    } catch (error) {
      console.error('[MULTI_PHOTO] Picker error:', error);
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
    }
  };

  const uploadMultiplePhotosHandler = async () => {
    if (selectedMultipleImages.length === 0) return;
    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      selectedMultipleImages.forEach((img) => {
        formData.append('photos', {
          uri: Platform.OS === 'android' ? img.uri : img.uri.replace('file://', ''),
          type: img.type || 'image/jpeg',
          name: img.fileName || `photo_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
        });
      });

      await uploadProfilePhotos(formData);
      setSelectedMultipleImages([]);
      await fetchExistingPhotos();
      Alert.alert('Success', 'Photos uploaded successfully!');
    } catch (error) {
      const msg = error.response?.data?.message || 'Upload failed. Please try again.';
      Alert.alert('Upload Failed', msg);
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removeExistingPhoto = (photoId) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProfilePhoto(photoId);
            await fetchExistingPhotos();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete photo.');
          }
        },
      },
    ]);
  };

  const removeSelectedImage = (index) => {
    setSelectedMultipleImages(prev => prev.filter((_, i) => i !== index));
  };

  const fetchCurrentProfile = async () => {
    try {
      const response = await api.get('/profiles/me');
      if (response.data.profile) {
        const profile = response.data.profile;
        // If profile_for is not in standard options, it's a custom 'Other' value
        if (profile.profile_for && !PROFILE_FOR_OPTIONS.includes(profile.profile_for)) {
          const newData = {
            ...profile,
            dob: formatDateToISO(profile.dob),
            profile_for: 'Other',
            other_profile_for: profile.profile_for
          };
          setFormData(newData);
          setInitialData(newData);
        } else {
          const newData = {
            ...profile,
            dob: formatDateToISO(profile.dob),
            other_profile_for: ''
          };
          setFormData(newData);
          setInitialData(newData);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch profile data');
    } finally {
      setFetching(false);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert('Permission required', 'We need camera and gallery permissions to upload a profile photo.');
        return false;
      }
      return true;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPickedImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPickedImage(result.assets[0]);
    }
  };

  const uploadProfileImage = async () => {
    if (!pickedImage) return null;

    const formData = new FormData();
    const uri = pickedImage.uri;
    const fileType = uri.substring(uri.lastIndexOf('.') + 1);

    formData.append('image', {
      uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    });

    try {
      const response = await api.post('/upload/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.imageUrl;
    } catch (error) {
      console.error('Upload Error:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!formData.profile_for) {
      Alert.alert('Error', 'Please select who you are creating this profile for');
      return;
    }

    if (formData.profile_for === 'Other' && !formData.other_profile_for.trim()) {
      Alert.alert('Error', 'Please specify the relation');
      return;
    }

    if (!formData.full_name || !formData.dob) {
      Alert.alert('Error', 'Full name and Date of Birth are required');
      return;
    }

    if (!formData.gender) {
      Alert.alert('Error', 'Please select Gender');
      return;
    }

    if (!formData.marital_status) {
      Alert.alert('Error', 'Please select Marital Status');
      return;
    }

    setLoading(true);
    try {
      let finalAvatarUrl = formData.avatar_url;

      if (pickedImage) {
        finalAvatarUrl = await uploadProfileImage();
      }

      const payload = {
        ...formData,
        avatar_url: finalAvatarUrl,
        monthly_income: formData.monthly_income ? parseInt(formData.monthly_income, 10) : 0,
        profile_for: formData.profile_for === 'Other' ? formData.other_profile_for : formData.profile_for
      };

      // Remove other_profile_for from payload as it's UI state
      delete payload.other_profile_for;

      let updatedProfileRes;
      if (isEdit) {
        updatedProfileRes = await api.put('/profiles', payload);
      } else {
        updatedProfileRes = await api.post('/profiles', payload);
      }

      // Update local auth context with new profile data (especially avatar_url)
      if (updatedProfileRes?.data?.profile) {
        await updateUser(updatedProfileRes.data.profile);
      }

      isSaved.current = true;
      Alert.alert('Success', `Profile ${isEdit ? 'updated' : 'created'} successfully`, [
        {
          text: 'OK',
          onPress: async () => {
            if (!isEdit) {
              await checkProfileStatus();
            } else {
              navigation.goBack();
            }
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => setFormData({ ...formData, [field]: value });

  const toggleConsent = (field) => {
    setConsents(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const openTerms = () => {
    setModalData({ title: 'Terms & Conditions', content: TERMS_AND_CONDITIONS });
    setModalVisible(true);
  };

  const openPrivacy = () => {
    setModalData({ title: 'Privacy Policy', content: PRIVACY_POLICY });
    setModalVisible(true);
  };


  if (fetching) {
    return <View style={styles.centered}><Text>Loading profile...</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* <TouchableOpacity onPress={handleGoBack} style={styles.inlineBack}>
          <Text style={styles.inlineBackText}>← Back</Text>
        </TouchableOpacity> */}
        <Text style={styles.mainTitle}>{isEdit ? 'Edit Your Profile' : 'Create Your Profile'}</Text>

        <Text style={styles.sectionTitle}>Basic Information</Text>


        <Text style={styles.sectionTitle}>Personal Details</Text>
        <CustomInput label="Full Name *" value={formData.full_name} onChangeText={(v) => updateField('full_name', v)} />
        <CustomInput label="Father's Name" value={formData.father_name} onChangeText={(v) => updateField('father_name', v)} />
        <CustomInput label="Mother's Maiden Name" value={formData.mother_maiden_name} onChangeText={(v) => updateField('mother_maiden_name', v)} />
        <CustomInput label="Date of Birth (YYYY-MM-DD) *" value={formData.dob} onChangeText={(v) => updateField('dob', v)} placeholder="1995-10-25" />

        <CustomPicker
          label="Gender *"
          value={formData.gender}
          options={GENDER_OPTIONS}
          placeholder="Select Gender"
          onSelect={(v) => updateField('gender', v)}
        />

        <CustomPicker
          label="Marital Status *"
          value={formData.marital_status}
          options={MARITAL_STATUS_OPTIONS}
          placeholder="Select Marital Status"
          onSelect={(v) => updateField('marital_status', v)}
        />

        <CustomPicker
          label="Creating Profile For *"
          value={formData.profile_for}
          options={PROFILE_FOR_OPTIONS}
          placeholder="Select Profile For"
          onSelect={(v) => updateField('profile_for', v)}
        />

        {formData.profile_for === 'Other' && (
          <CustomInput
            label="Specify Relation *"
            value={formData.other_profile_for}
            onChangeText={(v) => updateField('other_profile_for', v)}
            placeholder="e.g. Friend, Cousin"
          />
        )}

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

        <View style={styles.photoSection}>
          <Text style={styles.label}>Profile Photo</Text>
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              <Text style={styles.photoButtonText}>From Gallery</Text>
            </TouchableOpacity>
          </View>

          {(pickedImage || formData.avatar_url) ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: pickedImage ? pickedImage.uri : getProfileImageUri(formData.avatar_url) }}
                style={styles.photoPreview}
              />
              <TouchableOpacity onPress={() => { setPickedImage(null); updateField('avatar_url', ''); }}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.placeholderText}>No photo selected</Text>
            </View>
          )}
        </View>

        {/* ═══════════════════════════════════════════ */}
        {/*  MULTIPLE PROFILE PHOTOS SECTION           */}
        {/* ═══════════════════════════════════════════ */}
        <View style={styles.multiPhotoSection}>
          <Text style={styles.sectionTitle}>Profile Photos</Text>
          <Text style={styles.multiPhotoSubtitle}>
            {existingPhotos.length}/5 photos uploaded • Add up to 5 photos
          </Text>

          {/* Existing Photos */}
          {fetchingPhotos ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
          ) : existingPhotos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.multiPhotoScroll}
            >
              {existingPhotos.map((photo) => (
                <View key={`existing-${photo.id}`} style={styles.multiPhotoThumbWrap}>
                  <Image
                    source={{ uri: getProfileImageUri(photo.photo_url) }}
                    style={styles.multiPhotoThumb}
                  />
                  <TouchableOpacity
                    style={styles.multiPhotoDeleteBtn}
                    onPress={() => removeExistingPhoto(photo.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="close-circle" size={22} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.multiPhotoEmpty}>
              <MaterialCommunityIcons name="image-multiple-outline" size={40} color={COLORS.border} />
              <Text style={styles.multiPhotoEmptyText}>No photos yet</Text>
            </View>
          )}

          {/* Selected Previews (to be uploaded) */}
          {selectedMultipleImages.length > 0 && (
            <View>
              <Text style={styles.multiPhotoPreviewTitle}>Selected for Upload</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.multiPhotoScroll}
              >
                {selectedMultipleImages.map((img, index) => (
                  <View key={`selected-${index}`} style={styles.multiPhotoThumbWrap}>
                    <Image source={{ uri: img.uri }} style={styles.multiPhotoThumb} />
                    <View style={styles.multiPhotoNewBadge}>
                      <Text style={styles.multiPhotoNewBadgeText}>NEW</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.multiPhotoDeleteBtn}
                      onPress={() => removeSelectedImage(index)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialCommunityIcons name="close-circle" size={22} color="#FF9500" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.multiPhotoActions}>
            <TouchableOpacity
              style={styles.multiPhotoPickBtn}
              onPress={selectMultiplePhotos}
              disabled={uploadingPhotos}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="image-plus" size={20} color={COLORS.primary} />
              <Text style={styles.multiPhotoPickText}>
                {selectedMultipleImages.length > 0 ? '+ Add More' : '+ Add Multiple Photos'}
              </Text>
            </TouchableOpacity>

            {selectedMultipleImages.length > 0 && (
              <TouchableOpacity
                style={styles.multiPhotoUploadBtn}
                onPress={uploadMultiplePhotosHandler}
                disabled={uploadingPhotos}
                activeOpacity={0.7}
              >
                {uploadingPhotos ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="cloud-upload" size={20} color="#fff" />
                    <Text style={styles.multiPhotoUploadText}>
                      Upload ({selectedMultipleImages.length})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ConsentSection
          consents={consents}
          onToggle={toggleConsent}
          onOpenTerms={openTerms}
          onOpenPrivacy={openPrivacy}
        />

        <CustomButton
          title={isEdit ? "Update Profile" : "Save Profile"}
          onPress={handleSave}
          loading={loading}
          disabled={!isConsentValid}
          style={[styles.button, !isConsentValid && styles.disabledButton]}
        />
      </ScrollView>

      <TermsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalData.title}
        content={modalData.content}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  mainTitle: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.primary, marginBottom: SPACING.md, textAlign: 'center' },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.text, marginVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 4 },
  label: { fontSize: FONT_SIZES.sm, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  button: { marginTop: SPACING.xl, marginBottom: SPACING.xl },
  photoPreview: { width: 120, height: 120, borderRadius: 60, marginTop: SPACING.sm, alignSelf: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inlineBack: { alignSelf: 'flex-start', marginBottom: SPACING.md },
  inlineBackText: { color: COLORS.primary, fontSize: FONT_SIZES.md, fontWeight: 'bold' },
  photoSection: { marginBottom: SPACING.md },
  photoButtons: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  photoButton: { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.primary, padding: SPACING.md, borderRadius: 8, alignItems: 'center' },
  photoButtonText: { color: COLORS.primary, fontWeight: 'bold' },
  previewContainer: { alignItems: 'center', marginTop: SPACING.sm },
  removeText: { color: COLORS.error, marginTop: SPACING.xs, fontWeight: 'bold' },
  photoPlaceholder: { height: 120, width: 120, backgroundColor: COLORS.border, borderRadius: 60, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginTop: SPACING.sm },
  placeholderText: { color: COLORS.textSecondary, fontSize: 10 },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },

  // ═══════════════════════════════════════════
  //  MULTIPLE PHOTOS STYLES
  // ═══════════════════════════════════════════
  multiPhotoSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  multiPhotoSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginTop: -SPACING.xs,
  },
  multiPhotoScroll: {
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  multiPhotoThumbWrap: {
    width: 100,
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginRight: SPACING.sm,
    position: 'relative',
  },
  multiPhotoThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  multiPhotoDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 11,
  },
  multiPhotoNewBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  multiPhotoNewBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  multiPhotoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  multiPhotoEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  multiPhotoPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  multiPhotoActions: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  multiPhotoPickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    gap: 6,
  },
  multiPhotoPickText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  multiPhotoUploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    gap: 6,
  },
  multiPhotoUploadText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default RegistrationScreen;
