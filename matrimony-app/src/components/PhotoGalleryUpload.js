import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../utils/constants';
import { getProfileImageUri } from '../utils/imageUtils';
import { uploadProfilePhotos, getProfilePhotos, deleteProfilePhoto } from '../services/api';

const { width } = Dimensions.get('window');
const THUMB_SIZE = (width - SPACING.lg * 2 - SPACING.sm * 4) / 3;

const PhotoGalleryUpload = ({ userId, onPhotosChanged }) => {
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch existing photos on mount
    const fetchPhotos = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getProfilePhotos(userId);
            setExistingPhotos(response.data.photos || []);
        } catch (error) {
            console.error('[GALLERY] Failed to fetch photos:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) fetchPhotos();
    }, [userId, fetchPhotos]);

    // Pick images from device
    const handlePickImages = async () => {
        const maxNew = 5 - existingPhotos.length;
        if (maxNew <= 0) {
            Alert.alert('Limit Reached', 'You can upload a maximum of 5 photos.');
            return;
        }

        const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'We need access to your photo library.');
            return;
        }

        try {
            const result = await ExpoImagePicker.launchImageLibraryAsync({
                mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                selectionLimit: maxNew,
                quality: 0.8,
                orderedSelection: true,
            });

            if (!result.canceled && result.assets) {
                const newImages = result.assets.map(asset => ({
                    uri: asset.uri,
                    type: asset.mimeType || 'image/jpeg',
                    fileName: asset.fileName || `photo_${Date.now()}.jpg`,
                }));
                setSelectedImages(newImages);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open image picker.');
        }
    };

    // Upload selected images
    const handleUpload = async () => {
        if (selectedImages.length === 0) return;

        setUploading(true);
        try {
            const formData = new FormData();
            selectedImages.forEach((img) => {
                formData.append('photos', {
                    uri: img.uri,
                    type: img.type || 'image/jpeg',
                    name: img.fileName || `photo_${Date.now()}.jpg`,
                });
            });

            await uploadProfilePhotos(formData);
            setSelectedImages([]);
            await fetchPhotos();
            onPhotosChanged?.();
            Alert.alert('Success', 'Photos uploaded successfully!');
        } catch (error) {
            console.error('[GALLERY] Upload failed:', error);
            const msg = error.response?.data?.message || 'Upload failed. Please try again.';
            Alert.alert('Upload Failed', msg);
        } finally {
            setUploading(false);
        }
    };

    // Delete a photo
    const handleDelete = (photoId) => {
        Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteProfilePhoto(photoId);
                        await fetchPhotos();
                        onPhotosChanged?.();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete photo.');
                    }
                },
            },
        ]);
    };

    // Render a single existing photo
    const renderExistingPhoto = ({ item }) => (
        <View style={styles.thumbContainer}>
            <Image
                source={{ uri: getProfileImageUri(item.photo_url) }}
                style={styles.thumb}
            />
            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <MaterialCommunityIcons name="close-circle" size={22} color="#FF3B30" />
            </TouchableOpacity>
        </View>
    );

    // Render a selected (preview) image
    const renderSelectedImage = ({ item, index }) => (
        <View style={styles.thumbContainer}>
            <Image source={{ uri: item.uri }} style={styles.thumb} />
            <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>NEW</Text>
            </View>
            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <MaterialCommunityIcons name="close-circle" size={22} color="#FF9500" />
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile Photos</Text>
            <Text style={styles.subtitle}>
                {existingPhotos.length}/5 photos uploaded
            </Text>

            {/* Existing Photos */}
            {existingPhotos.length > 0 && (
                <FlatList
                    data={existingPhotos}
                    renderItem={renderExistingPhoto}
                    keyExtractor={(item) => `existing-${item.id}`}
                    numColumns={3}
                    scrollEnabled={false}
                    contentContainerStyle={styles.gridContainer}
                    columnWrapperStyle={styles.gridRow}
                />
            )}

            {/* Selected Previews */}
            {selectedImages.length > 0 && (
                <>
                    <Text style={styles.previewTitle}>Selected for Upload</Text>
                    <FlatList
                        data={selectedImages}
                        renderItem={renderSelectedImage}
                        keyExtractor={(_, index) => `selected-${index}`}
                        numColumns={3}
                        scrollEnabled={false}
                        contentContainerStyle={styles.gridContainer}
                        columnWrapperStyle={styles.gridRow}
                    />
                </>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.pickBtn]}
                    onPress={handlePickImages}
                    disabled={uploading}
                >
                    <MaterialCommunityIcons name="image-plus" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>
                        {selectedImages.length > 0 ? 'Pick More' : 'Select Photos'}
                    </Text>
                </TouchableOpacity>

                {selectedImages.length > 0 && (
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.uploadBtn]}
                        onPress={handleUpload}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="cloud-upload" size={20} color="#fff" />
                                <Text style={styles.actionBtnText}>
                                    Upload ({selectedImages.length})
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: SPACING.md,
        marginVertical: SPACING.sm,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
        marginTop: SPACING.sm,
        marginBottom: SPACING.xs,
    },
    gridContainer: {
        gap: SPACING.sm,
    },
    gridRow: {
        gap: SPACING.sm,
    },
    thumbContainer: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    thumb: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    deleteBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 11,
    },
    previewBadge: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    previewBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
    },
    actionsRow: {
        flexDirection: 'row',
        marginTop: SPACING.md,
        gap: SPACING.sm,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    pickBtn: {
        backgroundColor: COLORS.textSecondary,
    },
    uploadBtn: {
        backgroundColor: COLORS.primary,
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});

export default PhotoGalleryUpload;
