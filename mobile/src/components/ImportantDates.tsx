import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ImportantDateKey } from '../api/types';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';
import { formatDate, formatTime } from '../utils/format';
import { AppText } from './AppText';
import { Card } from './Card';

interface Props {
  dates: { key: ImportantDateKey; at: string | null }[];
  getNow: () => number;
}

const ICONS: Record<ImportantDateKey, React.ReactElement> = {
  REGISTER_BEFORE: <Ionicons name="calendar-outline" size={30} color={colors.primary} />,
  SUBMISSION_STARTS: <MaterialCommunityIcons name="send-outline" size={30} color={colors.primary} />,
  SUBMISSION_ENDS: <MaterialCommunityIcons name="tray-arrow-up" size={30} color={colors.primary} />,
  RESULT_DATE: <Ionicons name="trophy-outline" size={30} color={colors.primary} />,
};

function DateCell({ dateKey, at, getNow }: { dateKey: ImportantDateKey; at: string; getNow: () => number }) {
  const { t, lang } = useLanguage();
  const passed = Date.parse(at) <= getNow(); // dates already behind us are visually quieter
  return (
    <View style={[styles.cell, passed && styles.passed]}>
      {ICONS[dateKey]}
      <View>
        <AppText size={12} color={colors.textMuted}>
          {t(`date.${dateKey}`)}
        </AppText>
        <AppText weight="semibold" size={15}>
          {formatDate(at, lang)}
        </AppText>
        <AppText weight="semibold" size={14}>
          {formatTime(at)}
        </AppText>
      </View>
    </View>
  );
}

export function ImportantDates({ dates, getNow }: Props) {
  const { t } = useLanguage();
  const valid = dates.filter((d): d is { key: ImportantDateKey; at: string } => Boolean(d.at));
  const rows = [valid.slice(0, 2), valid.slice(2, 4)].filter((r) => r.length > 0);

  return (
    <Card>
      <AppText weight="semibold" size={15} style={styles.title}>
        {t('importantDates')}
      </AppText>
      <View style={styles.grid}>
        {rows.map((row, ri) => (
          <View key={ri} style={[styles.gridRow, ri > 0 && styles.rowDivider]}>
            {row.map((d, ci) => (
              <View key={d.key} style={[styles.cellWrap, ci === 0 && row.length > 1 && styles.colDivider]}>
                <DateCell dateKey={d.key} at={d.at} getNow={getNow} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 10 },
  grid: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden' },
  gridRow: { flexDirection: 'row' },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  cellWrap: { flex: 1 },
  colDivider: { borderRightWidth: 1, borderRightColor: colors.border },
  cell: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 14 },
  passed: { opacity: 0.55 },
});
