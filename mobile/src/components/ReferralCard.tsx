import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, radius } from '../theme';
import { formatINR } from '../utils/format';
import { AppText } from './AppText';

interface Props {
  link: string;
  rewardPerSignup: number;
  onCopy: () => void;
  onShare: () => void;
}

export function ReferralCard({ link, rewardPerSignup, onCopy, onShare }: Props) {
  const { t } = useLanguage();
  return (
    <View style={styles.card}>
      <Ionicons name="megaphone" size={46} color={colors.primary} style={styles.icon} />
      <View style={styles.middle}>
        <AppText weight="semibold" size={15}>
          {t('referTitle')}
        </AppText>
        <View style={styles.linkBox}>
          <AppText size={12.5} color={colors.text} numberOfLines={1} style={styles.link}>
            {link}
          </AppText>
          <Pressable style={styles.copy} onPress={onCopy} accessibilityRole="button">
            <AppText weight="semibold" size={12} color={colors.primaryDark}>
              {t('copyLink')}
            </AppText>
          </Pressable>
        </View>
      </View>
      <View style={styles.right}>
        <Pressable style={styles.referBtn} onPress={onShare} accessibilityRole="button">
          <AppText weight="semibold" size={14} color="#fff">
            {t('referNow')}
          </AppText>
        </Pressable>
        <AppText size={11} color={colors.primary} style={styles.earn}>
          {t('youEarn', { amount: formatINR(rewardPerSignup).replace('₹ ', '₹') })}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.referralTint, borderRadius: radius.card, padding: 12 },
  icon: { transform: [{ rotate: '-8deg' }] },
  middle: { flex: 1.3, gap: 8 },
  linkBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#CFE6D8', paddingLeft: 8 },
  link: { flex: 1 },
  copy: { paddingHorizontal: 8, paddingVertical: 9, borderLeftWidth: 1, borderLeftColor: '#CFE6D8' },
  right: { flex: 1, gap: 6, alignItems: 'stretch' },
  referBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  earn: { textAlign: 'center' },
});
