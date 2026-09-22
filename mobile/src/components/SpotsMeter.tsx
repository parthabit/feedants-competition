import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';
import { AppText } from './AppText';

interface Props {
  total: number;
  booked: number;
  left: number;
}

/** "Only 19 spots left" + progress bar + "1 / 20 Booked". Turns amber when nearly full, muted when sold out. */
export function SpotsMeter({ total, booked, left }: Props) {
  const { t } = useLanguage();
  const soldOut = left <= 0;
  const almostFull = !soldOut && left / total <= 0.15;
  const label = soldOut ? t('soldOutSpots') : t(left === 1 ? 'spotsLeft_one' : 'spotsLeft_other', { n: left });
  const accent = soldOut ? colors.danger : almostFull ? colors.warning : colors.primary;
  const pct = total > 0 ? Math.min(100, Math.max(0, (booked / total) * 100)) : 0;

  return (
    <View style={styles.wrap} accessible accessibilityLabel={`${label}. ${t('booked', { booked, total })}`}>
      <View style={styles.labelRow}>
        <Ionicons name="people-outline" size={18} color={accent} />
        <AppText weight="medium" size={15} color={accent} style={styles.label} numberOfLines={1}>
          {label}
        </AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: accent }]} />
      </View>
      <AppText size={13} color={colors.textMuted}>
        {t('booked', { booked, total })}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { flexShrink: 1 },
  track: { height: 5, borderRadius: 3, backgroundColor: '#DCE7E6', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, minWidth: 6 },
});
