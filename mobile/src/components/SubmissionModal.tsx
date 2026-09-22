import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, fonts, radius } from '../theme';
import { errorMessage } from '../utils/errors';
import { AppText } from './AppText';

interface Props {
  initialUrl?: string;
  isUpdate: boolean;
  onSubmit: (videoUrl: string, caption?: string) => Promise<void>;
  onClose: () => void;
}

const isHttpUrl = (v: string) => /^https?:\/\/\S+\.\S+/i.test(v.trim());

/**
 * File hosting is out of scope, so participants submit a link. The server re-validates the link
 * and, more importantly, re-checks registration + the submission window (never trust the client).
 */
export function SubmissionModal({ initialUrl = '', isUpdate, onSubmit, onClose }: Props) {
  const { t } = useLanguage();
  const [url, setUrl] = useState(initialUrl);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!isHttpUrl(url)) {
      setError(t('invalidLink'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(url.trim(), caption.trim() || undefined);
    } catch (e) {
      setError(errorMessage(t, e));
      setBusy(false);
    }
  };

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={styles.sheet}>
          <AppText weight="bold" size={18}>
            {t('submitTitle')}
          </AppText>
          <AppText size={13} color={colors.textMuted} style={styles.help}>
            {t('submitHelp')}
          </AppText>

          <AppText weight="medium" size={13} style={styles.label}>
            {t('submitLink')}
          </AppText>
          <TextInput
            value={url}
            onChangeText={(v) => {
              setUrl(v);
              setError(null);
            }}
            placeholder="https://"
            placeholderTextColor={colors.textSoft}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={[styles.input, error ? styles.inputError : null]}
          />

          <AppText weight="medium" size={13} style={styles.label}>
            {t('submitCaption')}
          </AppText>
          <TextInput value={caption} onChangeText={setCaption} maxLength={300} style={styles.input} placeholderTextColor={colors.textSoft} />

          {error && (
            <AppText size={12.5} color={colors.danger} style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </AppText>
          )}

          <Pressable style={[styles.submit, busy && styles.busy]} disabled={busy} onPress={submit} accessibilityRole="button">
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <AppText weight="semibold" size={16} color="#fff">
                {isUpdate ? t('submitUpdate') : t('submitAction')}
              </AppText>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,30,28,0.5)', justifyContent: 'flex-end' },
  dismiss: { flex: 1 },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, paddingBottom: 30 },
  help: { marginTop: 4, lineHeight: 19 },
  label: { marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontFamily: fonts.regular, fontSize: 14, color: colors.text, backgroundColor: colors.background },
  inputError: { borderColor: colors.danger },
  error: { marginTop: 8 },
  submit: { marginTop: 20, backgroundColor: colors.primary, borderRadius: radius.button, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  busy: { opacity: 0.7 },
});
