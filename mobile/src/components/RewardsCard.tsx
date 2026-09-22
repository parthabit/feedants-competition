import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Reward } from '../api/types';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';
import { formatINR } from '../utils/format';
import { AppText } from './AppText';
import { Card } from './Card';

function PositionIcon({ position }: { position: number }) {
  if (position === 1) return <MaterialCommunityIcons name="trophy" size={24} color={colors.gold} />;
  if (position === 2) return <MaterialCommunityIcons name="medal" size={24} color={colors.silver} />;
  if (position === 3) return <MaterialCommunityIcons name="medal" size={24} color={colors.bronze} />;
  return <Ionicons name="star-outline" size={22} color={colors.primary} />;
}

export function RewardsCard({ rewards }: { rewards: Reward[] }) {
  const { t } = useLanguage();
  return (
    <Card>
      <View style={styles.titleRow}>
        <AppText weight="semibold" size={15}>
          {t('rewards')}
        </AppText>
        <AppText size={13} color={colors.textMuted}>
          {t('allPositions')}
        </AppText>
      </View>
      <View style={styles.list}>
        {rewards.map((r) => (
          <View key={r.position} style={styles.row}>
            <View style={styles.icon}>
              <PositionIcon position={r.position} />
            </View>
            <AppText weight="semibold" size={15} style={styles.name}>
              {t(`winner.${r.position}`, { ord: r.position })}
            </AppText>
            <AppText weight="semibold" size={18} color={colors.primary}>
              {formatINR(r.amount)}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 },
  list: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4, backgroundColor: colors.rowTint, borderRadius: 6 },
  icon: { width: 34, alignItems: 'center' },
  name: { flex: 1, marginLeft: 8 },
});
