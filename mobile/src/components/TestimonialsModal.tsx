import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../api/SessionContext';
import type { Testimonial } from '../api/types';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';
import { errorMessage } from '../utils/errors';
import { AppText } from './AppText';
import { Card } from './Card';

export function TestimonialsModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const api = useApi();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (next?: string) => {
      setLoading(true);
      setError(null);
      try {
        const page = await api.getTestimonials(next);
        setItems((prev) => (next ? [...prev, ...page.testimonials] : page.testimonials));
        setCursor(page.nextCursor);
      } catch (e) {
        setError(errorMessage(t, e));
      } finally {
        setLoading(false);
      }
    },
    [api, t]
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Modal animationType="slide" visible onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <AppText weight="bold" size={18}>
            {t('testimonialsTitle')}
          </AppText>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('demoClose')}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
        </View>

        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <Card>
              <View style={styles.person}>
                {item.avatarUrl ? <Image source={{ uri: item.avatarUrl }} style={styles.avatar} /> : <View style={styles.avatar} />}
                <View style={styles.flex}>
                  <AppText weight="semibold" size={14}>
                    {item.userName}
                  </AppText>
                  {item.competitionTitle && (
                    <AppText size={12} color={colors.textMuted}>
                      {item.competitionTitle}
                    </AppText>
                  )}
                </View>
                <View style={styles.stars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons key={i} name={i < item.rating ? 'star' : 'star-outline'} size={14} color={colors.gold} />
                  ))}
                </View>
              </View>
              <AppText size={13.5} color={colors.textMuted} style={styles.text}>
                {item.text}
              </AppText>
            </Card>
          )}
          ListEmptyComponent={!loading && !error ? <AppText size={14} color={colors.textMuted} style={styles.center}>{t('noTestimonials')}</AppText> : null}
          ListFooterComponent={
            <View style={styles.footer}>
              {loading && <ActivityIndicator color={colors.primary} />}
              {error && (
                <Pressable onPress={() => load(cursor ?? undefined)}>
                  <AppText size={13} color={colors.danger} style={styles.center}>
                    {error} {t('retry')}
                  </AppText>
                </Pressable>
              )}
              {!loading && !error && cursor && (
                <Pressable onPress={() => load(cursor)} accessibilityRole="button">
                  <AppText weight="semibold" size={14} color={colors.primary} style={styles.center}>
                    {t('loadMore')}
                  </AppText>
                </Pressable>
              )}
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14 },
  list: { padding: 14, paddingBottom: 40 },
  sep: { height: 10 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E1E9E9' },
  stars: { flexDirection: 'row', gap: 1 },
  text: { marginTop: 10, lineHeight: 21 },
  footer: { paddingVertical: 16 },
  center: { textAlign: 'center' },
});
