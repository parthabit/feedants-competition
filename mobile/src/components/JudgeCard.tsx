import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Judge } from '../api/types';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';
import { AppText } from './AppText';
import { Card } from './Card';

export function JudgeCard({ judge, onPlayIntro }: { judge: Judge; onPlayIntro: (url: string) => void }) {
  const { t } = useLanguage();
  return (
    <Card>
      <View style={styles.row}>
        {judge.photoUrl ? (
          <Image source={{ uri: judge.photoUrl }} style={styles.avatar} accessibilityIgnoresInvertColors />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={40} color={colors.textSoft} />
          </View>
        )}

        <View style={styles.info}>
          <AppText size={13} color={colors.textMuted}>
            {t('judge')}
          </AppText>
          <AppText weight="bold" size={19} numberOfLines={1}>
            {judge.name}
          </AppText>
          <AppText size={13} color={colors.textMuted} numberOfLines={1}>
            {judge.title}
          </AppText>
          <AppText size={13} color={colors.textMuted}>
            {t('experience', { n: judge.experienceYears })}
          </AppText>
        </View>

        {judge.introVideoUrl && (
          <Pressable
            onPress={() => onPlayIntro(judge.introVideoUrl as string)}
            style={styles.play}
            accessibilityRole="button"
            accessibilityLabel={t('introVideo')}
          >
            <View style={styles.playCircle}>
              <Ionicons name="play" size={24} color={colors.primary} />
            </View>
            <AppText size={13} color={colors.textMuted}>
              {t('introVideo')}
            </AppText>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#E9EEEE' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  play: { alignItems: 'center', gap: 6 },
  playCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
});
