import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { useSession, useApi } from '../api/SessionContext';
import type { PaymentInfo } from '../api/types';
import { AdSlot } from '../components/AdSlot';
import { BottomTabBar } from '../components/BottomTabBar';
import { CompetitionSummaryCard } from '../components/CompetitionSummaryCard';
import { CountdownBanner } from '../components/CountdownBanner';
import { DisclaimerStrip } from '../components/DisclaimerStrip';
import { Header } from '../components/Header';
import { ImportantDates } from '../components/ImportantDates';
import { InfoTabs } from '../components/InfoTabs';
import { JudgeCard } from '../components/JudgeCard';
import { PaymentSheet } from '../components/PaymentSheet';
import { PreviousWinners } from '../components/PreviousWinners';
import { ReferralCard } from '../components/ReferralCard';
import { RewardsCard } from '../components/RewardsCard';
import { ErrorView, LoadingView } from '../components/StateViews';
import { StickyCta } from '../components/StickyCta';
import { SubmissionModal } from '../components/SubmissionModal';
import { TestimonialsModal } from '../components/TestimonialsModal';
import { TestimonialsRow } from '../components/TestimonialsRow';
import { Toast } from '../components/Toast';
import { TrustRow } from '../components/TrustRow';
import { useCompetition } from '../hooks/useCompetition';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../i18n/LanguageContext';
import { openRazorpayCheckout } from '../payments/razorpayCheckout';
import { colors, spacing } from '../theme';
import { errorMessage } from '../utils/errors';
import { openUrl } from '../utils/linking';

interface Props {
  competitionId: string;
  onBack?: () => void;
  /** Extra header control (used by the demo switcher). */
  headerExtra?: React.ReactNode;
}

interface PaymentSession {
  payment: PaymentInfo;
  holdExpiresAt: string | null;
}

export function CompetitionDetailsScreen({ competitionId, onBack, headerExtra }: Props) {
  const { t } = useLanguage();
  const api = useApi();
  const insets = useSafeAreaInsets();
  const { data, error, loading, refreshing, refresh, pullToRefresh, retry, getNow } = useCompetition(competitionId);
  const toast = useToast();

  const [ctaBusy, setCtaBusy] = useState(false);
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [showSubmission, setShowSubmission] = useState(false);
  const [showTestimonials, setShowTestimonials] = useState(false);

  const alertError = useCallback((e: unknown) => Alert.alert('', errorMessage(t, e)), [t]);

  const open = useCallback(
    async (url: string) => {
      if (!(await openUrl(url))) Alert.alert('', t('linkFailed'));
    },
    [t]
  );

  // ---- registration + payment ------------------------------------------------------------

  const confirmPayment = useCallback(
    async (payment: PaymentInfo, paymentId: string, signature: string) => {
      setPayBusy(true);
      try {
        await api.verifyPayment(competitionId, { orderId: payment.orderId, paymentId, signature });
        setPaymentSession(null);
        toast.show(t('toastRegistered'));
      } catch (e) {
        setPaymentSession(null);
        alertError(e);
      } finally {
        setPayBusy(false);
        refresh();
      }
    },
    [api, competitionId, alertError, refresh, t, toast]
  );

  /** User backed out / payment failed: hand the spot back immediately instead of waiting for the hold to expire. */
  const abandonPayment = useCallback(async () => {
    setPaymentSession(null);
    try {
      await api.cancelPendingRegistration(competitionId);
      toast.show(t('toastPaymentCancelled'));
    } catch {
      /* the hold will simply expire on its own */
    } finally {
      refresh();
    }
  }, [api, competitionId, refresh, t, toast]);

  const startRegistration = useCallback(async () => {
    setCtaBusy(true);
    try {
      const res = await api.startRegistration(competitionId);
      refresh(); // spot counter + "Payment pending" badge update right away
      if (!res.payment) {
        toast.show(t('toastRegistered')); // free competition: confirmed instantly
        return;
      }
      if (res.payment.provider === 'razorpay') {
        try {
          const r = await openRazorpayCheckout(res.payment);
          await confirmPayment(res.payment, r.paymentId, r.signature);
        } catch {
          await abandonPayment();
        }
      } else {
        setPaymentSession({ payment: res.payment, holdExpiresAt: res.registration.holdExpiresAt });
      }
    } catch (e) {
      alertError(e);
      refresh(); // state changed under us (sold out / closed) - show the truth
    } finally {
      setCtaBusy(false);
    }
  }, [api, competitionId, refresh, toast, t, confirmPayment, abandonPayment, alertError]);

  const onCtaPress = useCallback(() => {
    if (!data) return;
    if (data.cta.action === 'REGISTER' || data.cta.action === 'RESUME_PAYMENT') startRegistration();
    else if (data.cta.action === 'UPLOAD_SUBMISSION') setShowSubmission(true);
  }, [data, startRegistration]);

  // ---- referral --------------------------------------------------------------------------

  const copyLink = useCallback(async () => {
    if (!data) return;
    await Clipboard.setStringAsync(data.referral.link);
    toast.show(t('copied'));
  }, [data, t, toast]);

  const shareLink = useCallback(() => {
    if (!data) return;
    Share.share({ message: t('referMessage', { link: data.referral.link }) }).catch(() => {});
  }, [data, t]);

  // ---- render ----------------------------------------------------------------------------

  let body: React.ReactNode;
  if (!data) {
    body = error ? <ErrorView message={errorMessage(t, error)} onRetry={retry} /> : <LoadingView />;
  } else {
    body = (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={pullToRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <CompetitionSummaryCard view={data} />
        {data.judge && <JudgeCard judge={data.judge} onPlayIntro={open} />}
        {data.countdown && <CountdownBanner key={data.countdown.key} countdown={data.countdown} getNow={getNow} onExpire={refresh} />}
        <ImportantDates dates={data.importantDates} getNow={getNow} />
        <PreviousWinners winners={data.previousWinners} onPlay={open} />
        <InfoTabs tabs={data.tabs} />
        <RewardsCard rewards={data.rewards} />
        <DisclaimerStrip />
        <TrustRow prizeVideoUrl={data.links.prizeVideoUrl} refundPolicyUrl={data.links.refundPolicyUrl} onOpen={open} />
        <ReferralCard link={data.referral.link} rewardPerSignup={data.referral.rewardPerSignup} onCopy={copyLink} onShare={shareLink} />
        <TestimonialsRow onPress={() => setShowTestimonials(true)} />
        <AdSlot ad={data.ad} onOpen={open} />
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header onBack={onBack} extra={headerExtra} />
      <View style={styles.flex}>{body}</View>

      {data && (
        <View style={styles.footer}>
          <StickyCta cta={data.cta} entryFee={data.entryFee} busy={ctaBusy} onPress={onCtaPress} />
        </View>
      )}
      <View style={{ backgroundColor: '#fff', paddingBottom: insets.bottom }}>
        <BottomTabBar />
      </View>

      <Toast message={toast.message} />

      {data && paymentSession && (
        <PaymentSheet
          payment={paymentSession.payment}
          title={data.title}
          holdExpiresAt={paymentSession.holdExpiresAt}
          getNow={getNow}
          busy={payBusy}
          onPay={() => confirmPayment(paymentSession.payment, `pay_mock_${Date.now()}`, 'mock_signature')}
          onCancel={abandonPayment}
          onExpire={() => {
            setPaymentSession(null);
            alertError({ code: 'HOLD_EXPIRED' });
            refresh();
          }}
        />
      )}

      {data && showSubmission && (
        <SubmissionModal
          isUpdate={Boolean(data.viewer.submission)}
          initialUrl={data.viewer.submission?.videoUrl}
          onClose={() => setShowSubmission(false)}
          onSubmit={async (videoUrl, caption) => {
            await api.submitEntry(competitionId, { videoUrl, caption });
            setShowSubmission(false);
            toast.show(t('toastSubmitted'));
            refresh();
          }}
        />
      )}

      {showTestimonials && <TestimonialsModal onClose={() => setShowTestimonials(false)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.screen, paddingTop: 4, paddingBottom: 16, gap: spacing.gap },
  footer: { paddingHorizontal: spacing.screen, paddingTop: 8, paddingBottom: 10, backgroundColor: colors.background },
});
