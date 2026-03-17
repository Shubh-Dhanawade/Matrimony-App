import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';

const CustomDropdown = ({ label, selectedValue, onValueChange, options, placeholder, error }) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.pickerContainer, error && styles.errorBorder]}>
                <Picker
                    selectedValue={selectedValue}
                    onValueChange={onValueChange}
                    style={styles.picker}
                    dropdownIconColor={COLORS.primary}
                    mode="dropdown"
                >
                    {placeholder && <Picker.Item label={placeholder} value="" color={COLORS.textSecondary} />}
                    {options.map((option, index) => (
                        <Picker.Item
                            key={index}
                            label={typeof option === 'object' ? option.label : option}
                            value={typeof option === 'object' ? option.value : option}
                        />
                    ))}
                </Picker>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: FONT_SIZES.sm,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    pickerContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        minHeight: 50,
        justifyContent: 'center',
    },
    picker: {
        width: '100%',
        color: COLORS.text,
    },
    errorBorder: {
        borderColor: COLORS.error,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 10,
        marginTop: 2,
    },
});

export default CustomDropdown;
