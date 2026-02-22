import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface DividerProps {
    vertical?: boolean;
    length?: number | string;
    style?: StyleProp<ViewStyle>;
}

const Divider: React.FC<DividerProps> = ({ vertical = false, length = '100%', style }) => {
    const dividerStyle = {
        backgroundColor: 'rgba(114, 114, 114, 0.45)',
        marginVertical: 10,
        ...(vertical
            ? { width: 1, height: length }
            : { height: 1, width: length }),
    } as ViewStyle;

    return <View style={[dividerStyle, style]} />;
};

export default Divider;
