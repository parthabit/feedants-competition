import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, radius } from '../theme';
import { AppText } from './AppText';

export function DisclaimerStrip() {
  const { t } = useLanguage();
  return (
    <View style={styles.strip}>
      <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
      <AppText size={12.5} color={colors.primaryDark} style={styles.text}>
        <AppText weight="semibold" size={12.5} color={colors.primaryDark}>
          {t('disclaimerLabel')}{' '}
        </AppText>
        {t('disclaimer')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryTint, borderRadius: radius.card, paddingHorizontal: 12, paddingVertical: 10 },
  text: { flex: 1, lineHeight: 18 },
});
