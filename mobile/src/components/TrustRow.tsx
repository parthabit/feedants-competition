import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';
import { AppText } from './AppText';
import { Card } from './Card';

interface Props {
  prizeVideoUrl: string | null;
  refundPolicyUrl: string | null;
  onOpen: (url: string) => void;
}

export function TrustRow({ prizeVideoUrl, refundPolicyUrl, onOpen }: Props) {
  const { t } = useLanguage();
  return (
    <Card style={styles.card}>
      <Pressable style={styles.left} disabled={!prizeVideoUrl} onPress={() => prizeVideoUrl && onOpen(prizeVideoUrl)} accessibilityRole="button">
        <View style={styles.playBox}>
          <View style={styles.playDot}>
            <Ionicons name="play" size={16} color="#fff" />
          </View>
        </View>
        <View style={styles.flex}>
          <AppText weight="semibold" size={13.5} style={styles.leftTitle}>
            {t('prizeVideoTitle')}
          </AppText>
          <AppText size={11.5} color={colors.textMuted}>
            {t('prizeVideoSub')}
          </AppText>
        </View>
      </Pressable>

      <View style={styles.right}>
        <Pressable style={styles.line} disabled={!refundPolicyUrl} onPress={() => refundPolicyUrl && onOpen(refundPolicyUrl)} accessibilityRole="link">
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.text} />
          <AppText size={13}>{t('refundPolicy')}</AppText>
        </Pressable>
        <View style={styles.line}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.text} />
          <AppText size={12} style={styles.flex}>
            {t('securePayments')}{' '}
            <AppText weight="bold" size={13} color={colors.razorpay} style={styles.razorpay}>
              Razorpay
            </AppText>
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  flex: { flex: 1 },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  leftTitle: { lineHeight: 19 },
  playBox: { width: 54, height: 54, borderRadius: 10, backgroundColor: '#CDE8E3', alignItems: 'center', justifyContent: 'center' },
  playDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#0B3E3B', alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  right: { flex: 1, gap: 10 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  razorpay: { fontStyle: 'italic' },
});
