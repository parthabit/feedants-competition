import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import type { PaymentInfo } from '../api/types';
import { useCountdown } from '../hooks/useCountdown';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, radius } from '../theme';
import { formatINR, formatMinSec } from '../utils/format';
import { AppText } from './AppText';

interface Props {
  payment: PaymentInfo;
  title: string;
  holdExpiresAt: string | null;
  getNow: () => number;
  busy: boolean;
  onPay: () => void;
  onCancel: () => void;
  onExpire: () => void;
}

/**
 * Simulated checkout used when the backend runs PAYMENT_PROVIDER=mock (the default),
 * so the reserve -> pay -> confirm flow is demoable without a Razorpay account.
 * Shows the live hold timer: when it hits zero the spot is released server-side.
 */
export function PaymentSheet({ payment, title, holdExpiresAt, getNow, busy, onPay, onCancel, onExpire }: Props) {
  const { t } = useLanguage();
  const remaining = useCountdown(holdExpiresAt, getNow, onExpire);
  const amount = formatINR(payment.amountPaise / 100);

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <AppText weight="bold" size={18}>
            {t('payTitle')}
          </AppText>
          <AppText size={13.5} color={colors.textMuted} style={styles.sub}>
            {t('payAmount', { title })}
          </AppText>
          <AppText weight="bold" size={36} color={colors.primary} style={styles.amount}>
            {amount}
          </AppText>

          {holdExpiresAt && (
            <View style={styles.hold}>
              <AppText weight="medium" size={13} color={colors.warning}>
                {t('payHold', { time: formatMinSec(remaining) })}
              </AppText>
            </View>
          )}
          <AppText size={12} color={colors.textSoft} style={styles.note}>
            {t('payTestMode')}
          </AppText>

          <Pressable style={[styles.pay, busy && styles.busy]} disabled={busy} onPress={onPay} accessibilityRole="button">
            {busy ? <ActivityIndicator color="#fff" /> : <AppText weight="semibold" size={16} color="#fff">{t('payNow', { amount })}</AppText>}
          </Pressable>
          <Pressable style={styles.link} disabled={busy} onPress={onCancel} accessibilityRole="button">
            <AppText weight="medium" size={14} color={colors.textMuted}>
              {t('payCancel')}
            </AppText>
          </Pressable>
          <Pressable style={styles.link} disabled={busy} onPress={onCancel} accessibilityRole="button">
            <AppText size={12.5} color={colors.danger}>
              {t('payFail')}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,30,28,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, paddingBottom: 34 },
  sub: { marginTop: 2 },
  amount: { marginTop: 12, lineHeight: 46 },
  hold: { alignSelf: 'flex-start', backgroundColor: colors.warningTint, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4 },
  note: { marginTop: 10 },
  pay: { marginTop: 18, backgroundColor: colors.primary, borderRadius: radius.button, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  busy: { opacity: 0.7 },
  link: { alignItems: 'center', paddingVertical: 10 },
});
