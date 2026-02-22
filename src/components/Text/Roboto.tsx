import React from 'react';
import { Text, TextProps, TextStyle, StyleProp } from 'react-native';

type RobotoType = 'regular' | 'bold' | 'italic' | 'light' | 'semibold' | 'medium';

interface RobotoTextProps extends TextProps {
  type?: RobotoType;
  fontSize?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

const fontWeights: Record<RobotoType, Pick<TextStyle, 'fontFamily'>> = {
  regular: { fontFamily: 'Roboto-Regular' },
  bold: { fontFamily: 'Roboto-Bold' },
  italic: { fontFamily: 'Roboto-Italic' },
  light: { fontFamily: 'Roboto-Light' },
  medium: { fontFamily: 'Roboto-Medium' },
  semibold: { fontFamily: 'Roboto-SemiBold' },
};

const RobotoText = React.forwardRef<any, RobotoTextProps>((props, ref) => {
  const {
    type = 'regular',
    fontSize = 14,
    color = '#000',
    style,
    children,
    ...rest
  } = props;

  const baseStyle: TextStyle = {
    ...fontWeights[type],
    fontSize,
    color,
  };

  return React.createElement(
    Text,
    {
      ref,
      style: [baseStyle, style],
      ...rest,
    },
    children,
  );
});

RobotoText.displayName = 'RobotoText';

export default RobotoText;
