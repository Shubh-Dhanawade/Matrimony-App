import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import CustomInput from "../../components/CustomInput";
import CustomButton from "../../components/CustomButton";
import CustomPicker from "../../components/CustomPicker";
import api from "../../services/api";
import {
  uploadProfilePhotos,
  getProfilePhotos,
  deleteProfilePhoto,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  MARITAL_STATUS_OPTIONS,
  GENDER_OPTIONS,
  PROFILE_FOR_OPTIONS,
  OCCUPATION_OPTIONS,
  QUALIFICATION_OPTIONS,
  TERMS_AND_CONDITIONS,
  PRIVACY_POLICY,
  API_BASE_URL,
} from "../../utils/constants";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfileImageUri } from "../../utils/imageUtils";
import useHardwareBack from "../../hooks/useHardwareBack";
import { useEffect, useRef, useState, useCallback } from "react";
import TermsModal from "../../components/TermsModal";
import ConsentSection from "../../components/ConsentSection";
import CustomDatePicker from "../../components/CustomDatePicker";
import { formatDateToISO, calculateAge } from "../../utils/dateUtils";

const RegistrationScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { logout, checkProfileStatus, updateUser, user } = useAuth();
  useHardwareBack();
  const isEdit = route.params?.isEdit || false;
  const [formData, setFormData] = useState({
    full_name: "",
    father_name: "",
    mother_maiden_name: "",
    dob: "",
    gender: "",
    height: "",
    color: "",
    age: "",
    marital_status: "",
    address: "",
    birthplace: "",
    qualification: "",
    occupation: "",
    profession: "",
    monthly_income: "",
    property: "",
    caste: "",
    sub_caste: "",
    relative_surname: "",
    expectations: "",
    other_comments: "",
    avatar_url: "",
    profile_for: "",
    other_profile_for: "",
    state: "",
    district: "",
    taluka: "",
  });

  // Location dropdown state
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTalukas, setLoadingTalukas] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);
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
  const [modalData, setModalData] = useState({ title: "", content: "" });
  const [ageError, setAgeError] = useState("");

  const isConsentValid = Object.values(consents).every((val) => val === true);

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
        navigation.replace("Dashboard");
      } else {
        // If it's the Create Profile screen and it's the first screen,
        // going "back" logic should Logout to return to Login screen.
        Alert.alert(t("logout"), t("logout_message"), [
          { text: t("cancel"), style: "cancel" },
          { text: t("logout"), style: "destructive", onPress: () => logout() },
        ]);
      }
    }
  };

  useEffect(() => {
    navigation.setOptions({
      onBackPress: handleGoBack,
    });
  }, [navigation, initialData, formData]); // Re-set if data changes to ensure listener sees latest state (though handleGoBack uses closure)

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      const hasChanges =
        initialData && JSON.stringify(formData) !== JSON.stringify(initialData);
      const hasPickedImage = !!pickedImage;

      if ((!hasChanges && !hasPickedImage) || isSaved.current) {
        return;
      }

      e.preventDefault();

      Alert.alert(t("unsaved_changes"), t("unsaved_changes_msg"), [
        { text: t("stay"), style: "cancel", onPress: () => { } },
        {
          text: t("discard"),
          style: "destructive",
          onPress: () => navigation.dispatch(e.data.action),
        },
      ]);
    });

    return unsubscribe;
  }, [navigation, formData, initialData, t]);

  // Load states on mount
  useEffect(() => {
    loadStates();
  }, []);

  useEffect(() => {
    if (isEdit) {
      fetchCurrentProfile();
    }
  }, [isEdit]);

  // Always load existing photos on mount (works for both new and edit users)
  useEffect(() => {
    if (user?.id) {
      fetchExistingPhotos();
    }
  }, [user?.id]);

  // ═══════════════════════════════════════════
  //  LOCATION HELPERS
  // ═══════════════════════════════════════════

  const loadStates = async () => {
    try {
      setLoadingStates(true);
      const res = await api.get("/location/states");
      setStates(res.data || []);
    } catch (err) {
      console.error("[LOCATION] Failed to load states:", err.message);
    } finally {
      setLoadingStates(false);
    }
  };

  const loadDistricts = async (stateId) => {
    try {
      setLoadingDistricts(true);
      setDistricts([]);
      setTalukas([]);
      const res = await api.get(`/location/districts/${stateId}`);
      setDistricts(res.data || []);
    } catch (err) {
      console.error("[LOCATION] Failed to load districts:", err.message);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadTalukas = async (districtId) => {
    try {
      setLoadingTalukas(true);
      setTalukas([]);
      const res = await api.get(`/location/talukas/${districtId}`);
      setTalukas(res.data || []);
    } catch (err) {
      console.error("[LOCATION] Failed to load talukas:", err.message);
    } finally {
      setLoadingTalukas(false);
    }
  };

  const handleStateSelect = (stateName) => {
    const found = states.find((s) => s.name === stateName);
    setFormData((prev) => ({
      ...prev,
      state: stateName,
      district: "",
      taluka: "",
    }));
    setSelectedStateId(found ? found.id : null);
    setSelectedDistrictId(null);
    setDistricts([]);
    setTalukas([]);
    if (found) loadDistricts(found.id);
  };

  const handleDistrictSelect = (districtName) => {
    const found = districts.find((d) => d.name === districtName);
    setFormData((prev) => ({ ...prev, district: districtName, taluka: "" }));
    setSelectedDistrictId(found ? found.id : null);
    setTalukas([]);
    if (found) loadTalukas(found.id);
  };

  const handleTalukaSelect = (talukaName) => {
    setFormData((prev) => ({ ...prev, taluka: talukaName }));
  };

  // ═══════════════════════════════════════════
  //  MULTIPLE PHOTOS FUNCTIONS
  // ═══════════════════════════════════════════

  const fetchExistingPhotos = async () => {
    if (!user?.id) return;
    try {
      setFetchingPhotos(true);
      const photosRes = await getProfilePhotos(user.id);
      setExistingPhotos(photosRes.data.photos || []);
    } catch (err) {
      console.error("[MULTI_PHOTO] Fetch error:", err);
    } finally {
      setFetchingPhotos(false);
    }
  };

  const requestGalleryPermission = async () => {
    console.log("[MULTI_PHOTO] Requesting gallery permission...");
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("[MULTI_PHOTO] Permission status:", status);
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need access to your photo library to select photos. Please grant permission in Settings.",
        );
        return false;
      }
      return true;
    }
    return true;
  };

  const selectMultiplePhotos = async () => {
    console.log("[MULTI_PHOTO] Button pressed - selectMultiplePhotos called");
    console.log("[MULTI_PHOTO] Existing photos:", existingPhotos.length);
    console.log(
      "[MULTI_PHOTO] Already selected:",
      selectedMultipleImages.length,
    );

    const maxNew = 5 - existingPhotos.length;
    if (maxNew <= 0) {
      Alert.alert(t("error"), t("profile_photos_limit", { count: 5 }));
      return;
    }

    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      console.log("[MULTI_PHOTO] Permission denied, aborting");
      return;
    }

    try {
      console.log(
        "[MULTI_PHOTO] Launching image library with allowsMultipleSelection...",
      );
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: Math.min(maxNew, 5 - selectedMultipleImages.length),
        quality: 0.8,
        orderedSelection: true,
      });

      console.log("[MULTI_PHOTO] Picker result canceled:", result.canceled);

      if (result.canceled) {
        console.log("[MULTI_PHOTO] User cancelled picker");
        return;
      }

      if (result.assets && result.assets.length > 0) {
        console.log("[MULTI_PHOTO] Selected", result.assets.length, "images");
        const newImages = result.assets.map((asset) => ({
          uri: asset.uri,
          type: asset.mimeType || asset.type || "image/jpeg",
          fileName:
            asset.fileName ||
            `photo_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
        }));
        setSelectedMultipleImages((prev) =>
          [...prev, ...newImages].slice(0, maxNew),
        );
      } else {
        console.log("[MULTI_PHOTO] No assets in result");
      }
    } catch (error) {
      console.error("[MULTI_PHOTO] Picker error:", error);
      Alert.alert(t("error"), t("action_failed"));
    }
  };

  const uploadMultiplePhotosHandler = async () => {
    if (selectedMultipleImages.length === 0) return;
    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      selectedMultipleImages.forEach((img) => {
        formData.append("photos", {
          uri:
            Platform.OS === "android"
              ? img.uri
              : img.uri.replace("file://", ""),
          type: img.type || "image/jpeg",
          name:
            img.fileName ||
            `photo_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
        });
      });

      await uploadProfilePhotos(formData);
      setSelectedMultipleImages([]);
      await fetchExistingPhotos();
      Alert.alert(
        t("success"),
        t("profile_save_success", { action: t("updated") }),
      );
    } catch (error) {
      const msg = error.response?.data?.message || t("action_failed");
      Alert.alert(t("error"), msg);
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removeExistingPhoto = (photoId) => {
    Alert.alert(t("delete_photo_title"), t("delete_photo_msg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("remove"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProfilePhoto(photoId);
            await fetchExistingPhotos();
          } catch (err) {
            Alert.alert(t("error"), t("action_failed"));
          }
        },
      },
    ]);
  };

  const removeSelectedImage = (index) => {
    setSelectedMultipleImages((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchCurrentProfile = async () => {
    try {
      const response = await api.get("/profiles/me");
      if (response.data.profile) {
        const profile = response.data.profile;
        // If profile_for is not in standard options, it's a custom 'Other' value
        if (
          profile.profile_for &&
          !PROFILE_FOR_OPTIONS.includes(profile.profile_for)
        ) {
          const isoDate = formatDateToISO(profile.dob);
          const recalcAge = calculateAge(isoDate);
          const newData = {
            ...profile,
            dob: isoDate,
            age: typeof recalcAge === "number" ? String(recalcAge) : (profile.age ? String(profile.age) : ""),
            profile_for: "Other",
            other_profile_for: profile.profile_for,
            state: profile.state || "",
            district: profile.district || "",
            taluka: profile.taluka || "",
          };
          setFormData(newData);
          setInitialData(newData);
        } else {
          const isoDate = formatDateToISO(profile.dob);
          const recalcAge = calculateAge(isoDate);
          const newData = {
            ...profile,
            dob: isoDate,
            age: typeof recalcAge === "number" ? String(recalcAge) : (profile.age ? String(profile.age) : ""),
            other_profile_for: "",
            state: profile.state || "",
            district: profile.district || "",
            taluka: profile.taluka || "",
          };
          setFormData(newData);
          setInitialData(newData);
        }

        // Pre-populate location cascades from saved names
        if (profile.state) {
          // Wait for states to load if needed, then resolve IDs
          const statesRes = await api.get("/location/states");
          const stateList = statesRes.data || [];
          setStates(stateList);
          const foundState = stateList.find((s) => s.name === profile.state);
          if (foundState) {
            setSelectedStateId(foundState.id);
            const distRes = await api.get(
              `/location/districts/${foundState.id}`,
            );
            const distList = distRes.data || [];
            setDistricts(distList);
            if (profile.district) {
              const foundDist = distList.find(
                (d) => d.name === profile.district,
              );
              if (foundDist) {
                setSelectedDistrictId(foundDist.id);
                const talRes = await api.get(
                  `/location/talukas/${foundDist.id}`,
                );
                setTalukas(talRes.data || []);
              }
            }
          }
        }
      }
    } catch (error) {
      Alert.alert(t("error"), t("action_failed"));
    } finally {
      setFetching(false);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus !== "granted" || libraryStatus !== "granted") {
        Alert.alert(
          "Permission required",
          "We need camera and gallery permissions to upload a profile photo.",
        );
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
    // Extract extension safely
    const extMatch = uri.match(/\.([a-zA-Z0-9]+)(\?|#|$)/);
    const fileType = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    const mimeType = fileType === 'jpg' ? 'image/jpeg' : `image/${fileType}`;

    formData.append('image', {
      uri,           // send uri as-is — RN fetch handles file:// on all platforms
      name: `photo.${fileType}`,
      type: mimeType,
    });

    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/upload/profile-image`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        // No Content-Type — fetch auto-sets it with the correct multipart boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('[UPLOAD_IMAGE] Server error:', errData);
      throw new Error(errData.message || 'Upload failed');
    }

    const data = await response.json();
    console.log('[UPLOAD_IMAGE] Success:', data.imageUrl);
    return data.imageUrl;
  };

  const handleSave = async () => {
    // ── Step 0: Validate profile_for + Other sub-field ───────────────────
    if (!formData.profile_for) {
      Alert.alert(t("error"), t("profile_for"));
      return;
    }

    if (
      formData.profile_for === "Other" &&
      !formData.other_profile_for.trim()
    ) {
      Alert.alert(t("error"), t("specify_relation"));
      return;
    }

    // ── Step 0b: Validate all required fields ────────────────────────────
    const requiredFields = [
      { key: "full_name", label: t("full_name") },
      { key: "father_name", label: t("father_name") },
      { key: "dob", label: t("dob") },
      { key: "gender", label: t("gender") },
      { key: "height", label: t("height") },
      { key: "marital_status", label: t("marital_status") },
      { key: "address", label: t("address") },
      { key: "qualification", label: t("qualification") },
      { key: "occupation", label: t("occupation") },
      { key: "caste", label: t("caste") },
    ];

    const missing = requiredFields.filter(
      ({ key }) => !formData[key] || String(formData[key]).trim() === ""
    );

    if (missing.length > 0) {
      const fieldList = missing.map(({ label }) => `• ${label}`).join("\n");
      Alert.alert(
        t("error"),
        `${t("fill_required_fields") || "Please fill all required fields"}:\n\n${fieldList}`
      );
      return;
    }

    setLoading(true);
    try {
      // ── Step 1: Build profile payload (WITHOUT photo for now) ────────────
      const basePayload = {
        ...formData,
        avatar_url: formData.avatar_url, // keep existing if editing
        monthly_income: formData.monthly_income
          ? parseInt(formData.monthly_income, 10)
          : 0,
        profile_for:
          formData.profile_for === 'Other'
            ? formData.other_profile_for
            : formData.profile_for,
      };
      delete basePayload.other_profile_for;

      // ── Step 2: Create / update profile ──────────────────────────────────
      let profileRes;
      if (isEdit) {
        profileRes = await api.put('/profiles', basePayload);
      } else {
        profileRes = await api.post('/profiles', basePayload);
      }

      // ── Step 3: Upload photo AFTER profile exists, then patch avatar_url ──
      if (pickedImage) {
        try {
          const imageUrl = await uploadProfileImage();
          if (imageUrl) {
            // Patch the profile's avatar_url via PUT
            const patchRes = await api.put('/profiles', { avatar_url: imageUrl });
            if (patchRes?.data?.profile) {
              profileRes = patchRes; // use updated profile
            }
          }
        } catch (imgErr) {
          console.warn('[PROFILE_SAVE] Photo upload failed, profile saved without photo:', imgErr.message);
          // Profile is already saved — just warn, don't fail
          Alert.alert(
            'Photo Upload Failed',
            'Your profile was saved, but the photo could not be uploaded. You can add it later from Edit Profile.',
          );
        }
      }

      // ── Step 4: Sync auth context with latest profile data ───────────────
      if (profileRes?.data?.profile) {
        await updateUser(profileRes.data.profile);
      }

      isSaved.current = true;
      Alert.alert(
        t('success'),
        t('profile_save_success', {
          action: isEdit ? t('updated') : t('created'),
        }),
        [
          {
            text: 'OK',
            onPress: async () => {
              if (!isEdit) {
                await checkProfileStatus();
              } else {
                navigation.goBack();
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error('[PROFILE_SAVE] Error:', error);
      Alert.alert(
        t('error'),
        error.response?.data?.message || t('action_failed'),
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    if (field === "dob") {
      const calculatedAge = calculateAge(value);
      // Auto-fill age from DOB; store as string for form consistency
      const ageStr = typeof calculatedAge === "number" ? String(calculatedAge) : "";
      setFormData((prev) => ({ ...prev, dob: value, age: ageStr }));
      if (typeof calculatedAge === "number" && calculatedAge < 18) {
        setAgeError(t("age_validation_error", { min: 18 }));
      } else {
        setAgeError("");
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleDateChange = (date) => {
    updateField("dob", date);
  };

  const toggleConsent = (field) => {
    setConsents((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const openTerms = () => {
    setModalData({
      title: "Terms & Conditions",
      content: TERMS_AND_CONDITIONS,
    });
    setModalVisible(true);
  };

  const openPrivacy = () => {
    setModalData({ title: "Privacy Policy", content: PRIVACY_POLICY });
    setModalVisible(true);
  };

  if (fetching) {
    return (
      <View style={styles.centered}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* <TouchableOpacity onPress={handleGoBack} style={styles.inlineBack}>
          <Text style={styles.inlineBackText}>← Back</Text>
        </TouchableOpacity> */}
        <Text style={styles.mainTitle}>
          {isEdit
            ? t("registration_title_edit")
            : t("registration_title_create")}
        </Text>

        <Text style={styles.sectionTitle}>{t("basic_info")}</Text>

        <Text style={styles.sectionTitle}>{t("personal_details")}</Text>
        <CustomInput
          label={`${t("full_name")} *`}
          value={formData.full_name}
          onChangeText={(v) => updateField("full_name", v)}
        />
        <CustomInput
          label={t("father_name")}
          value={formData.father_name}
          onChangeText={(v) => updateField("father_name", v)}
        />
        <CustomInput
          label={t("mother_maiden_name")}
          value={formData.mother_maiden_name}
          onChangeText={(v) => updateField("mother_maiden_name", v)}
        />
        <CustomDatePicker
          label={`${t("dob")} *`}
          value={formData.dob}
          onDateChange={handleDateChange}
          error={ageError}
          maximumDate={new Date()}
        />

        <CustomPicker
          label={`${t("gender")} *`}
          value={formData.gender}
          options={[
            { label: t("gender_male"), value: "Male" },
            { label: t("gender_female"), value: "Female" },
            { label: t("gender_other"), value: "Other" },
          ]}
          placeholder={t("gender")}
          onSelect={(v) => updateField("gender", v)}
        />
        <CustomInput
          label={`${t("height")} *`}
          value={formData.height}
          onChangeText={(v) => updateField("height", v)}
        />
        <CustomInput
          label={`${t("color")} *`}
          value={formData.color}
          onChangeText={(v) => updateField("color", v)}
        />
        <CustomInput
          label={`${t("age")} *`}
          value={formData.age ? String(formData.age) : ""}
          onChangeText={() => { }} // read-only: auto-calculated from DOB
          editable={false}
          inputStyle={styles.readOnlyInput}
        />

        <CustomPicker
          label={`${t("marital_status")} *`}
          value={formData.marital_status}
          options={[
            { label: t("marital_single"), value: "Single" },
            { label: t("marital_married"), value: "Married" },
            { label: t("marital_divorced"), value: "Divorced" },
            { label: t("marital_widowed"), value: "Widowed" },
          ]}
          placeholder={t("marital_status")}
          onSelect={(v) => updateField("marital_status", v)}
        />

        <CustomPicker
          label={`${t("profile_for")} *`}
          value={formData.profile_for}
          options={[
            { label: t("profile_for_myself"), value: "Myself" },
            { label: t("profile_for_son"), value: "Son" },
            { label: t("profile_for_daughter"), value: "Daughter" },
            { label: t("profile_for_brother"), value: "Brother" },
            { label: t("profile_for_sister"), value: "Sister" },
            { label: t("profile_for_other"), value: "Other" },
          ]}
          placeholder={t("profile_for")}
          onSelect={(v) => updateField("profile_for", v)}
        />

        {formData.profile_for === "Other" && (
          <CustomInput
            label={`${t("specify_relation")} *`}
            value={formData.other_profile_for}
            onChangeText={(v) => updateField("other_profile_for", v)}
            placeholder="e.g. Friend, Cousin"
          />
        )}

        <Text style={styles.sectionTitle}>{t("contact_location")}</Text>
        <CustomInput
          label={t("birthplace")}
          value={formData.birthplace}
          onChangeText={(v) => updateField("birthplace", v)}
        />
        <CustomInput
          label={t("full_address")}
          value={formData.address}
          onChangeText={(v) => updateField("address", v)}
          multiline
          numberOfLines={3}
        />

        {/* State Dropdown */}
        <CustomPicker
          label={t("state")}
          value={formData.state}
          options={states.map((s) => ({ label: s.name, value: s.name }))}
          placeholder={loadingStates ? t("loading") + "..." : t("select_state")}
          onSelect={handleStateSelect}
        />

        {/* District Dropdown */}
        <CustomPicker
          label={t("district")}
          value={formData.district}
          options={districts.map((d) => ({ label: d.name, value: d.name }))}
          placeholder={
            !formData.state
              ? t("select_state_first")
              : loadingDistricts
                ? t("loading") + "..."
                : t("select_district")
          }
          onSelect={handleDistrictSelect}
          disabled={!formData.state || loadingDistricts}
        />

        {/* Taluka Dropdown */}
        <CustomPicker
          label={t("taluka")}
          value={formData.taluka}
          options={talukas.map((tk) => ({ label: tk.name, value: tk.name }))}
          placeholder={
            !formData.district
              ? t("select_district_first")
              : loadingTalukas
                ? t("loading") + "..."
                : talukas.length === 0
                  ? t("no_talukas")
                  : t("select_taluka")
          }
          onSelect={handleTalukaSelect}
          disabled={
            !formData.district || loadingTalukas || talukas.length === 0
          }
        />

        <Text style={styles.sectionTitle}>{t("professional_details")}</Text>
        <CustomPicker
          label={`${t("qualification")} *`}
          value={formData.qualification}
          options={QUALIFICATION_OPTIONS.map((opt) => ({
            label: opt,
            value: opt,
          }))}
          placeholder={t("Qualification") || "Select Qualification"}
          onSelect={(v) => updateField("qualification", v)}
        />
        <CustomPicker
          label={`${t("occupation")} *`}
          value={formData.occupation}
          options={OCCUPATION_OPTIONS.map((opt) => ({
            label: opt,
            value: opt,
          }))}
          placeholder={t("Occupation") || "Select Occupation"}
          onSelect={(v) => updateField("occupation", v)}
        />
        <CustomInput
          label={`${t("profession")} *`}
          value={formData.profession}
          onChangeText={(v) => updateField("profession", v)}
        />
        <CustomInput
          label={`${t("monthly_income")} *`}
          value={formData.monthly_income}
          onChangeText={(v) => updateField("monthly_income", v)}
          keyboardType="numeric"
        />
        <CustomInput
          label={`${t("property")} *`}
          value={formData.property}
          onChangeText={(v) => updateField("property", v)}
        />

        <Text style={styles.sectionTitle}>{t("community_details")}</Text>
        <CustomInput
          label={t("caste")}
          value={formData.caste}
          onChangeText={(v) => updateField("caste", v)}
        />
        <CustomInput
          label={t("sub_caste")}
          value={formData.sub_caste}
          onChangeText={(v) => updateField("sub_caste", v)}
        />
        <CustomInput
          label={t("relative_surname")}
          value={formData.relative_surname}
          onChangeText={(v) => updateField("relative_surname", v)}
        />

        <Text style={styles.sectionTitle}>{t("expectations_photo")}</Text>
        <CustomInput
          label={t("partner_expectations")}
          value={formData.expectations}
          onChangeText={(v) => updateField("expectations", v)}
          multiline
          numberOfLines={3}
        />

        <View style={styles.photoSection}>
          <Text style={styles.label}>{t("profile_photo")}</Text>
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Text style={styles.photoButtonText}>{t("take_photo")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              <Text style={styles.photoButtonText}>{t("from_gallery")}</Text>
            </TouchableOpacity>
          </View>

          {pickedImage || formData.avatar_url ? (
            <View style={styles.previewContainer}>
              <Image
                source={{
                  uri: pickedImage
                    ? pickedImage.uri
                    : getProfileImageUri(formData.avatar_url),
                }}
                style={styles.photoPreview}
              />
              <TouchableOpacity
                onPress={() => {
                  setPickedImage(null);
                  updateField("avatar_url", "");
                }}
              >
                <Text style={styles.removeText}>{t("remove")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.placeholderText}>{t("no_photo")}</Text>
            </View>
          )}
        </View>

        {/* ═══════════════════════════════════════════ */}
        {/*  MULTIPLE PROFILE PHOTOS SECTION           */}
        {/* ═══════════════════════════════════════════ */}
        <View style={styles.multiPhotoSection}>
          <Text style={styles.sectionTitle}>{t("profile_photo")}</Text>
          <Text style={styles.multiPhotoSubtitle}>
            {t("profile_photos_limit", { count: existingPhotos.length })}
          </Text>

          {/* Existing Photos */}
          {fetchingPhotos ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={{ marginVertical: 12 }}
            />
          ) : existingPhotos.length > 0 ? (
            // ... (lines 584-604)
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.multiPhotoScroll}
            >
              {existingPhotos.map((photo) => (
                <View
                  key={`existing-${photo.id}`}
                  style={styles.multiPhotoThumbWrap}
                >
                  <Image
                    source={{ uri: getProfileImageUri(photo.photo_url) }}
                    style={styles.multiPhotoThumb}
                  />
                  <TouchableOpacity
                    style={styles.multiPhotoDeleteBtn}
                    onPress={() => removeExistingPhoto(photo.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={22}
                      color="#FF3B30"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.multiPhotoEmpty}>
              <MaterialCommunityIcons
                name="image-multiple-outline"
                size={40}
                color={COLORS.border}
              />
              <Text style={styles.multiPhotoEmptyText}>
                {t("no_photos_yet")}
              </Text>
            </View>
          )}

          {/* Selected Previews (to be uploaded) */}
          {selectedMultipleImages.length > 0 && (
            <View>
              <Text style={styles.multiPhotoPreviewTitle}>
                {t("selected_upload")}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.multiPhotoScroll}
              >
                // ... (lines 621-636)
                {selectedMultipleImages.map((img, index) => (
                  <View
                    key={`selected-${index}`}
                    style={styles.multiPhotoThumbWrap}
                  >
                    <Image
                      source={{ uri: img.uri }}
                      style={styles.multiPhotoThumb}
                    />
                    <View style={styles.multiPhotoNewBadge}>
                      <Text style={styles.multiPhotoNewBadgeText}>NEW</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.multiPhotoDeleteBtn}
                      onPress={() => removeSelectedImage(index)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={22}
                        color="#FF9500"
                      />
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
              <MaterialCommunityIcons
                name="image-plus"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.multiPhotoPickText}>
                {selectedMultipleImages.length > 0
                  ? t("add_more")
                  : t("add_multiple_photos")}
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
                    <MaterialCommunityIcons
                      name="cloud-upload"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.multiPhotoUploadText}>
                      {t("upload")} ({selectedMultipleImages.length})
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
          title={isEdit ? t("update_profile") : t("save_profile")}
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
  mainTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
    color: COLORS.text,
    marginVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 4,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  button: { marginTop: SPACING.xl, marginBottom: SPACING.xl },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginTop: SPACING.sm,
    alignSelf: "center",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  inlineBack: { alignSelf: "flex-start", marginBottom: SPACING.md },
  inlineBackText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: "bold",
  },
  photoSection: { marginBottom: SPACING.md },
  photoButtons: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  photoButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: "center",
  },
  photoButtonText: { color: COLORS.primary, fontWeight: "bold" },
  previewContainer: { alignItems: "center", marginTop: SPACING.sm },
  removeText: {
    color: COLORS.error,
    marginTop: SPACING.xs,
    fontWeight: "bold",
  },
  photoPlaceholder: {
    height: 120,
    width: 120,
    backgroundColor: COLORS.border,
    borderRadius: 60,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  placeholderText: { color: COLORS.textSecondary, fontSize: 10 },
  disabledButton: {
    backgroundColor: "#CCCCCC",
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
    shadowColor: "#000",
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
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    marginRight: SPACING.sm,
    position: "relative",
  },
  multiPhotoThumb: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  multiPhotoDeleteBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 11,
  },
  multiPhotoNewBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  multiPhotoNewBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  multiPhotoEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  multiPhotoEmptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  multiPhotoPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  multiPhotoActions: {
    flexDirection: "row",
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  multiPhotoPickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    gap: 6,
  },
  multiPhotoPickText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  multiPhotoUploadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    gap: 6,
  },
  multiPhotoUploadText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  readOnlyInput: {
    backgroundColor: "#f0f0f0",
    color: "#888",
  },
});

export default RegistrationScreen;