import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { cardShadow, colors, radius, spacing } from '../theme';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.card,
    ...cardShadow,
  },
});
