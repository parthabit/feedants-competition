import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CompetitionView } from '../api/types';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, radius } from '../theme';
import { AppText } from './AppText';

/** Renders a real ad when the backend provides one, otherwise the dashed placeholder from the design. */
export function AdSlot({ ad, onOpen }: { ad: CompetitionView['ad']; onOpen: (url: string) => void }) {
  const { t } = useLanguage();
  if (ad) {
    return (
      <Pressable onPress={() => ad.targetUrl && onOpen(ad.targetUrl)} accessibilityRole="imagebutton">
        <Image source={{ uri: ad.imageUrl }} style={styles.image} resizeMode="cover" />
      </Pressable>
    );
  }
  return (
    <View style={styles.placeholder}>
      <Ionicons name="megaphone-outline" size={22} color={colors.textMuted} />
      <AppText weight="semibold" size={13} color={colors.textMuted}>
        {t('adHere')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 46,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#B9C6C5',
  },
  image: { height: 70, borderRadius: radius.card, width: '100%' },
});
