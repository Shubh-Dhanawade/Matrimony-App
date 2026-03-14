import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';
import CustomPicker from './CustomPicker';

const LanguageSelector = ({ variant = 'button' }) => {
    const { t, i18n } = useTranslation();

    const languages = [
        { code: 'mr', label: 'मराठी' },
        { code: 'hi', label: 'हिंदी' },
        { code: 'en', label: 'English' },
    ];

    const changeLanguage = (code) => {
        i18n.changeLanguage(code);
    };

    if (variant === 'dropdown') {
        const pickerOptions = languages.map(lang => ({ label: lang.label, value: lang.code }));
        
        return (
            <CustomPicker
                label={t('select_language')}
                value={i18n.language}
                options={pickerOptions}
                placeholder={t('select_language')}
                onSelect={(val) => changeLanguage(val)}
            />
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('select_language')}</Text>
            <View style={styles.buttonContainer}>
                {languages.map((lang) => (
                    <TouchableOpacity
                        key={lang.code}
                        style={[
                            styles.langButton,
                            i18n.language === lang.code && styles.activeButton
                        ]}
                        onPress={() => changeLanguage(lang.code)}
                    >
                        <Text
                            style={[
                                styles.langText,
                                i18n.language === lang.code && styles.activeLangText
                            ]}
                        >
                            {lang.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        marginVertical: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    title: {
        fontSize: FONT_SIZES.md,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: SPACING.sm,
    },
    langButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    activeButton: {
        backgroundColor: COLORS.primary,
    },
    langText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    activeLangText: {
        color: '#FFFFFF',
    },
});

export default LanguageSelector;
