import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const ApproveIcon = ({ size = 32, color = "#2ecc71" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
        <Path
            d="M8 12L11 15L16 9"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default ApproveIcon;
