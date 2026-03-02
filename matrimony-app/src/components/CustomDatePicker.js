import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';
import { formatDateToDisplay } from '../utils/dateUtils';

const CustomDatePicker = ({ label, value, onDateChange, minimumDate, maximumDate, error }) => {
    const [show, setShow] = useState(false);

    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate || new Date(value || Date.now());
        setShow(Platform.OS === 'ios');

        // Format to YYYY-MM-DD for backend consistency
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        onDateChange(formattedDate);
    };

    const showDatepicker = () => {
        setShow(true);
    };

    // Convert string value back to Date object for the picker
    const dateValue = value ? new Date(value) : new Date();

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <TouchableOpacity
                style={[styles.input, error && styles.inputError]}
                onPress={showDatepicker}
                activeOpacity={0.7}
            >
                <View style={styles.inputContent}>
                    <MaterialCommunityIcons
                        name="calendar-month"
                        size={20}
                        color={COLORS.primary}
                        style={styles.icon}
                    />
                    <Text style={[styles.dateText, !value && styles.placeholderText]}>
                        {value ? formatDateToDisplay(value) : "Select Date"}
                    </Text>
                </View>
            </TouchableOpacity>

            {show && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={dateValue}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onChange}
                    maximumDate={maximumDate || new Date()}
                    minimumDate={minimumDate}
                />
            )}

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
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: SPACING.md,
        justifyContent: 'center',
    },
    inputContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: SPACING.sm,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    dateText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
    },
    placeholderText: {
        color: COLORS.textSecondary,
    },
    errorText: {
        color: COLORS.error,
        fontSize: FONT_SIZES.sm,
        marginTop: SPACING.xs,
    },
});

export default CustomDatePicker;
