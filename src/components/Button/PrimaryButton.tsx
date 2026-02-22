import React, { FC } from 'react';
import {
  ButtonProps,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import RobotoText from '../Text/Roboto';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

interface PrimaryButtonProps extends ButtonProps {
  title: string;
  color?: string;
  width?: number
  fontSize?: number;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

const PrimaryButton: FC<PrimaryButtonProps> = ({
  color = '#000',
  fontSize = 20,
  backgroundColor = '#fff',
  padding = 10,
  borderRadius = 100,
  width = 0.95,
  style,
  title,
  ...rest
}) => (
  <TouchableOpacity
    style={[
      {
        backgroundColor,
        padding,
        borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
        width: screenWidth * width
      },
      style,
    ]}
    {...rest}>
    <RobotoText color={color} fontSize={fontSize}>{title}</RobotoText>
  </TouchableOpacity>
);

export default PrimaryButton;
