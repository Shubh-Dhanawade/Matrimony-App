import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const RejectIcon = ({ size = 32, color = "#e74c3c" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
        <Path
            d="M15 9L9 15M9 9L15 15"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default RejectIcon;
