import React from 'react';
import { Text, TextProps } from 'react-native';
import { colors, fonts } from '../theme';

interface Props extends TextProps {
  weight?: keyof typeof fonts;
  size?: number;
  color?: string;
}

/** Every piece of text goes through here so font family/weight is consistent (Poppins). */
export function AppText({ weight = 'regular', size = 14, color = colors.text, style, ...rest }: Props) {
  return <Text {...rest} style={[{ fontFamily: fonts[weight], fontSize: size, color, includeFontPadding: false }, style]} />;
}
