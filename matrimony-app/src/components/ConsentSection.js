import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';

const CheckboxItem = ({ label, isChecked, onPress, onLinkPress, linkText }) => {
    return (
        <View style={styles.itemRow}>
            <TouchableOpacity
                style={styles.checkbox}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <MaterialIcons
                    name={isChecked ? "check-box" : "check-box-outline-blank"}
                    size={24}
                    color={isChecked ? COLORS.primary : COLORS.textSecondary}
                />
            </TouchableOpacity>

            <View style={styles.labelContainer}>
                <Text style={styles.label}>
                    {label}{' '}
                    {linkText && (
                        <Text
                            style={styles.link}
                            onPress={onLinkPress}
                        >
                            {linkText}
                        </Text>
                    )}
                </Text>
            </View>
        </View>
    );
};

const ConsentSection = ({ consents, onToggle, onOpenTerms, onOpenPrivacy }) => {
    return (
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Required Consents</Text>

            <CheckboxItem
                label="I confirm that I am 18 years or older."
                isChecked={consents.ageConfirmed}
                onPress={() => onToggle('ageConfirmed')}
            />

            <CheckboxItem
                label="I agree to the"
                linkText="Terms & Conditions."
                isChecked={consents.termsAccepted}
                onPress={() => onToggle('termsAccepted')}
                onLinkPress={onOpenTerms}
            />

            <CheckboxItem
                label="I agree to the"
                linkText="Privacy Policy."
                isChecked={consents.privacyAccepted}
                onPress={() => onToggle('privacyAccepted')}
                onLinkPress={onOpenPrivacy}
            />

            <CheckboxItem
                label="I confirm that all information provided is accurate."
                isChecked={consents.infoAccurate}
                onPress={() => onToggle('infoAccurate')}
            />

            <CheckboxItem
                label="I consent to display my profile to other registered users."
                isChecked={consents.displayConsent}
                onPress={() => onToggle('displayConsent')}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.lg,
        marginVertical: SPACING.md,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.md,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: SPACING.md,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    checkbox: {
        marginRight: SPACING.sm,
        paddingTop: 2,
    },
    labelContainer: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    link: {
        color: COLORS.primary,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
});

export default ConsentSection;
