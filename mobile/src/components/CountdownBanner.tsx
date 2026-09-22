import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Countdown } from '../api/types';
import { useCountdown } from '../hooks/useCountdown';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, radius } from '../theme';
import { formatCountdown } from '../utils/format';
import { AppText } from './AppText';

interface Props {
  countdown: Countdown;
  getNow: () => number;
  onExpire: () => void;
}

/** Live countdown to whatever matters next (registration close, submission end, result...). */
export function CountdownBanner({ countdown, getNow, onExpire }: Props) {
  const { t } = useLanguage();
  const remaining = useCountdown(countdown.targetAt, getNow, onExpire);
  const text = formatCountdown(remaining);

  return (
    <View style={styles.banner} accessibilityRole="timer" accessibilityLabel={`${t(`countdown.${countdown.key}`)} ${text}`}>
      <MaterialCommunityIcons name="timer-sand" size={26} color={colors.primary} />
      <AppText weight="semibold" size={14} style={styles.label} numberOfLines={2}>
        {t(`countdown.${countdown.key}`)}
      </AppText>
      <AppText weight="bold" size={16} color={colors.primary} style={styles.time}>
        {text}
      </AppText>
      {countdown.hurry && (
        <View style={styles.hurry}>
          <Ionicons name="stopwatch-outline" size={22} color={colors.primary} />
          <AppText weight="semibold" size={13} color={colors.primary}>
            {t('hurryUp')}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.primaryTintBorder,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  label: { flexShrink: 1, maxWidth: 110 },
  time: { flexGrow: 1, flexShrink: 0, fontVariant: ['tabular-nums'] },
  hurry: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
