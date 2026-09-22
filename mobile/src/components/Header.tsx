import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';
import { AppText } from './AppText';

/** "← Go back" and the ENG / हिंदी switch. Changing language refetches server-side content. */
export function Header({ onBack, extra }: { onBack?: () => void; extra?: React.ReactNode }) {
  const { lang, setLang, t } = useLanguage();
  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} style={styles.back} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('goBack')}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
        <AppText weight="medium" size={17}>
          {t('goBack')}
        </AppText>
      </Pressable>

      <View style={styles.right}>
      {extra}
      <View style={styles.toggle} accessibilityRole="radiogroup">
        <Pressable onPress={() => setLang('en')} style={[styles.seg, lang === 'en' && styles.segActive]} accessibilityRole="radio" accessibilityState={{ selected: lang === 'en' }}>
          <AppText weight="semibold" size={13} color={lang === 'en' ? '#fff' : colors.textMuted}>
            ENG
          </AppText>
        </Pressable>
        <Pressable onPress={() => setLang('hi')} style={[styles.seg, lang === 'hi' && styles.segActive]} accessibilityRole="radio" accessibilityState={{ selected: lang === 'hi' }}>
          <AppText weight="semibold" size={13} color={lang === 'hi' ? '#fff' : colors.textMuted}>
            हिंदी
          </AppText>
        </Pressable>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggle: { flexDirection: 'row', backgroundColor: '#E9EEEE', borderRadius: 999, padding: 3 },
  seg: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  segActive: { backgroundColor: colors.primary },
});
