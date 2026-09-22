import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.wrap} pointerEvents="none" accessibilityLiveRegion="polite">
      <View style={styles.toast}>
        <AppText weight="medium" size={13.5} color="#fff">
          {message}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 150, alignItems: 'center', paddingHorizontal: 20 },
  toast: { backgroundColor: '#12302E', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
});
