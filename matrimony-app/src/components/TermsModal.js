import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';

const TermsModal = ({ visible, onClose, title, content }) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                    </View>

                    <ScrollView style={styles.scrollArea}>
                        <Text style={styles.contentText}>{content}</Text>
                    </ScrollView>

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: SPACING.lg,
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        maxHeight: '80%',
        padding: SPACING.lg,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    header: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: SPACING.sm,
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    scrollArea: {
        marginBottom: SPACING.md,
    },
    contentText: {
        fontSize: FONT_SIZES.md,
        lineHeight: 24,
        color: COLORS.text,
    },
    closeButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.md,
        borderRadius: 8,
        alignItems: 'center',
    },
    closeButtonText: {
        color: COLORS.surface,
        fontWeight: 'bold',
        fontSize: FONT_SIZES.md,
    },
});

export default TermsModal;
