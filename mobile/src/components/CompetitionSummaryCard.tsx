import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CompetitionView } from '../api/types';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, radius } from '../theme';
import { formatINR } from '../utils/format';
import { AppText } from './AppText';
import { Card } from './Card';
import { Chip } from './Chip';
import { SpotsMeter } from './SpotsMeter';

function StatusBadge({ view }: { view: CompetitionView }) {
  const { t } = useLanguage();
  const status = view.viewer.registration?.status;

  let config: { label: string; icon: keyof typeof Ionicons.glyphMap; fg: string; bg: string; border: string } | null = null;
  if (view.status === 'CANCELLED') {
    config = { label: t('cancelledBadge'), icon: 'close-circle', fg: colors.danger, bg: colors.dangerTint, border: '#F3C1BC' };
  } else if (status === 'CONFIRMED') {
    config = { label: t('registered'), icon: 'checkmark-circle', fg: colors.primaryDark, bg: colors.primaryTint, border: colors.primaryTintBorder };
  } else if (status === 'PENDING_PAYMENT') {
    config = { label: t('paymentPending'), icon: 'time', fg: colors.warning, bg: colors.warningTint, border: '#F0D9A8' };
  }
  if (!config) return null;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Ionicons name={config.icon} size={20} color={config.fg} />
      <AppText weight="medium" size={14} color={config.fg}>
        {config.label}
      </AppText>
    </View>
  );
}

export function CompetitionSummaryCard({ view }: { view: CompetitionView }) {
  const { t } = useLanguage();
  return (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <AppText weight="bold" size={21} style={styles.title} numberOfLines={2}>
          {view.title}
        </AppText>
        <StatusBadge view={view} />
      </View>

      <View style={styles.chips}>
        <Chip label={view.category.label} />
        <Chip label={view.format === 'MULTI_WIN' ? t('multiWin') : t('singleWin')} />
        {view.hasCertificate && (
          <View style={styles.cert}>
            <Ionicons name="trophy-outline" size={20} color={colors.primary} />
            <AppText weight="medium" size={14} color={colors.primary}>
              {t('winnersCertificate')}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <AppText size={14} color={colors.textMuted}>
            {t('prizePool')}
          </AppText>
          <AppText weight="bold" size={32} color={colors.primary} style={styles.big}>
            {formatINR(view.prizePool)}
          </AppText>
        </View>
        <View style={styles.stat}>
          <AppText size={14} color={colors.textMuted}>
            {t('entryFee')}
          </AppText>
          <AppText weight="bold" size={view.entryFee === 0 ? 26 : 30} style={styles.big}>
            {view.entryFee === 0 ? t('free') : formatINR(view.entryFee)}
          </AppText>
        </View>
        <SpotsMeter {...view.spots} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  chips: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  cert: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 16, gap: 14 },
  stat: { gap: 0 },
  big: { lineHeight: 42 },
});
