import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CompetitionListItem, DemoUser } from '../api/types';
import { useLanguage } from '../i18n/LanguageContext';
import { colors, radius } from '../theme';
import { AppText } from './AppText';

interface Props {
  users: DemoUser[];
  userId: string;
  competitionId: string;
  loadCompetitions: () => Promise<CompetitionListItem[]>;
  onSelectUser: (id: string) => void;
  onSelectCompetition: (id: string) => void;
}

/**
 * Reviewer tool, not part of the product design: switch the acting user and the competition
 * to see every state (registered, sold out, closed, upcoming, free, results...) without touching the DB.
 */
export function DemoSwitcher({ users, userId, competitionId, loadCompetitions, onSelectUser, onSelectCompetition }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [competitions, setCompetitions] = useState<CompetitionListItem[]>([]);

  const refresh = useCallback(() => loadCompetitions().then(setCompetitions).catch(() => {}), [loadCompetitions]);
  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const Option = ({ selected, label, sub, onPress }: { selected: boolean; label: string; sub?: string; onPress: () => void }) => (
    <Pressable style={[styles.option, selected && styles.optionSelected]} onPress={onPress}>
      <View style={styles.flex}>
        <AppText weight={selected ? 'semibold' : 'medium'} size={14}>
          {label}
        </AppText>
        {sub ? (
          <AppText size={12} color={colors.textMuted}>
            {sub}
          </AppText>
        ) : null}
      </View>
      {selected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
    </Pressable>
  );

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.fab} hitSlop={8} accessibilityLabel={t('demoTitle')}>
        <Ionicons name="options-outline" size={18} color={colors.primaryDark} />
      </Pressable>
      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.panel}>
            <View style={styles.head}>
              <AppText weight="bold" size={17}>
                {t('demoTitle')}
              </AppText>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <AppText weight="semibold" size={14} color={colors.primary}>
                  {t('demoClose')}
                </AppText>
              </Pressable>
            </View>
            <ScrollView>
              <AppText weight="semibold" size={13} color={colors.textMuted} style={styles.section}>
                {t('demoUser')}
              </AppText>
              {users.map((u) => (
                <Option key={u.id} selected={u.id === userId} label={u.name} onPress={() => onSelectUser(u.id)} />
              ))}
              <AppText weight="semibold" size={13} color={colors.textMuted} style={styles.section}>
                {t('demoCompetition')}
              </AppText>
              {competitions.map((c) => (
                <Option
                  key={c.id}
                  selected={c.id === competitionId}
                  label={c.title}
                  sub={`${c.category} · ${c.spotsLeft} left`}
                  onPress={() => {
                    onSelectCompetition(c.id);
                    setOpen(false);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(8,30,28,0.5)', justifyContent: 'center', padding: 20 },
  panel: { backgroundColor: '#fff', borderRadius: 18, padding: 18, maxHeight: '80%' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  section: { marginTop: 14, marginBottom: 6 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.chip, marginBottom: 4 },
  optionSelected: { backgroundColor: colors.primaryTint },
  flex: { flex: 1 },
});
