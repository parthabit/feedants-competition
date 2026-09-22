import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';
import { AppText } from './AppText';

export function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <AppText weight="medium" size={13} color={colors.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { backgroundColor: '#EEF2F2', borderRadius: radius.chip, paddingHorizontal: 12, paddingVertical: 5 },
});
