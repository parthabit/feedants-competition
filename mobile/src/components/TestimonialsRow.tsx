import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';
import { AppText } from './AppText';
import { Card } from './Card';

export function TestimonialsRow({ onPress }: { onPress: () => void }) {
  const { t } = useLanguage();
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card style={styles.card}>
        <Ionicons name="chatbubble-ellipses-outline" size={26} color={colors.text} />
        <View style={styles.text}>
          <AppText weight="semibold" size={14}>
            {t('hearFromUsers')}
          </AppText>
          <AppText size={11.5} color={colors.textMuted}>
            {t('hearFromUsersSub')}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  text: { flex: 1 },
});
