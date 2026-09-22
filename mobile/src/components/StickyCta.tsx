import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { Cta } from '../api/types';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, radius } from '../theme';
import { formatDate, formatINR } from '../utils/format';
import { AppText } from './AppText';

interface Props {
  cta: Cta;
  entryFee: number;
  busy: boolean;
  onPress: () => void;
}

/**
 * The bottom button. WHAT it says and whether it is tappable is decided by the server
 * (cta.action / cta.enabled); this component only localises and renders it.
 */
export function StickyCta({ cta, entryFee, busy, onPress }: Props) {
  const { t, lang } = useLanguage();

  const params: Record<string, string> = { ...cta.params };
  if (params.at) params.at = formatDate(params.at, lang);
  params.amount = entryFee === 0 ? t('free') : formatINR(entryFee).replace('₹ ', '₹');

  const label = t(`cta.${cta.key}`, params);
  const sub = cta.subKey ? t(`cta.${cta.subKey}`, params) : null;
  const interactive = cta.enabled && !busy;

  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !cta.enabled, busy }}
      style={({ pressed }) => [styles.button, !cta.enabled && styles.disabled, pressed && interactive && styles.pressed]}
    >
      {busy ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.content}>
          <AppText weight="semibold" size={16.5} color="#fff">
            {label}
          </AppText>
          {sub ? (
            <AppText weight="medium" size={12.5} color="rgba(255,255,255,0.9)">
              {sub}
            </AppText>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: colors.primary, borderRadius: radius.button, minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  disabled: { backgroundColor: colors.disabled },
  pressed: { backgroundColor: colors.primaryDark },
  content: { alignItems: 'center' },
});
