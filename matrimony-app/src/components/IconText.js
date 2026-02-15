import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { COLORS, SPACING } from '../utils/constants';

/**
 * Reusable component for displaying an icon next to text.
 * Best practice for maintaining consistency across the app.
 */
const IconText = ({
    icon,
    text,
    iconSize = 18,
    iconColor = COLORS.textSecondary,
    textStyle,
    containerStyle
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            <MaterialIcons name={icon} size={iconSize} color={iconColor} style={styles.icon} />
            <Text style={[styles.text, textStyle]}>{text}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    icon: {
        width: 24, // Consistent width helps alignment
        marginRight: 8,
    },
    text: {
        fontSize: 14,
        color: COLORS.text,
    },
});

export default IconText;
