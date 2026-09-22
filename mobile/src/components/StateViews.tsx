import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, radius } from '../theme';
import { AppText } from './AppText';

export function LoadingView() {
  const { t } = useLanguage();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText size={14} color={colors.textMuted}>
        {t('loading')}
      </AppText>
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useLanguage();
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={44} color={colors.textSoft} />
      <AppText size={15} color={colors.text} style={styles.msg}>
        {message}
      </AppText>
      <Pressable style={styles.retry} onPress={onRetry} accessibilityRole="button">
        <AppText weight="semibold" size={14} color="#fff">
          {t('retry')}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 30 },
  msg: { textAlign: 'center' },
  retry: { backgroundColor: colors.primary, borderRadius: radius.button, paddingHorizontal: 22, paddingVertical: 12 },
});
