import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PreviousWinner } from '../api/types';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';
import { AppText } from './AppText';
import { Card } from './Card';

export function PreviousWinners({ winners, onPlay }: { winners: PreviousWinner[]; onPlay: (url: string) => void }) {
  const { t } = useLanguage();
  if (winners.length === 0) return null;

  return (
    <Card style={styles.card}>
      <AppText weight="semibold" size={15} style={styles.title}>
        {t('previousWinners')}
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {winners.map((w, i) => (
          <Pressable
            key={`${w.name}-${i}`}
            style={styles.item}
            disabled={!w.videoUrl}
            onPress={() => w.videoUrl && onPlay(w.videoUrl)}
            accessibilityRole="button"
            accessibilityLabel={`${w.name}, ${t(`winner.${w.position}`, { ord: w.position })}`}
          >
            <View>
              {w.thumbnailUrl ? (
                <Image source={{ uri: w.thumbnailUrl }} style={styles.thumb} accessibilityIgnoresInvertColors />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <Ionicons name="person" size={30} color={colors.textSoft} />
                </View>
              )}
              {w.videoUrl && (
                <View style={styles.playBadge}>
                  <Ionicons name="play" size={12} color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.text}>
              <AppText weight="medium" size={13} numberOfLines={1}>
                {w.name}
              </AppText>
              <AppText size={12} color={colors.primary}>
                {t(`winner.${w.position}`, { ord: w.position })}
              </AppText>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingRight: 0 },
  title: { marginBottom: 10 },
  list: { gap: 10, paddingRight: 14 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EEF3F3', borderRadius: 12, padding: 5, paddingRight: 14 },
  thumb: { width: 84, height: 84, borderRadius: 10, backgroundColor: '#DDE6E6' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  playBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { minWidth: 70, maxWidth: 110 },
});
