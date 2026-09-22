import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CompetitionView } from '../api/types';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';
import { AppText } from './AppText';
import { Card } from './Card';

type TabKey = 'about' | 'judging' | 'rules';
const COLLAPSED_COUNT = 3;

function Expandable<T>({ items, render }: { items: T[]; render: (item: T, index: number) => React.ReactNode }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const canExpand = items.length > COLLAPSED_COUNT;
  const visible = expanded || !canExpand ? items : items.slice(0, COLLAPSED_COUNT);

  return (
    <View>
      <View style={styles.list}>{visible.map(render)}</View>
      {canExpand && (
        <Pressable style={styles.more} onPress={() => setExpanded((e) => !e)} accessibilityRole="button" accessibilityState={{ expanded }}>
          <AppText weight="medium" size={14} color={colors.primary}>
            {expanded ? t('viewLess') : t('viewMore')}
          </AppText>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

export function InfoTabs({ tabs }: { tabs: CompetitionView['tabs'] }) {
  const { t } = useLanguage();
  const [active, setActive] = useState<TabKey>('about');

  const headers: { key: TabKey; label: string }[] = [
    { key: 'about', label: t('tabAbout') },
    { key: 'judging', label: t('tabJudging') },
    { key: 'rules', label: t('tabRules') },
  ];

  return (
    <Card style={styles.card}>
      <View style={styles.tabBar} accessibilityRole="tablist">
        {headers.map((h) => {
          const selected = h.key === active;
          return (
            <Pressable
              key={h.key}
              style={[styles.tab, selected && styles.tabActive]}
              onPress={() => setActive(h.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <AppText weight={selected ? 'semibold' : 'medium'} size={13} color={selected ? colors.primary : colors.textMuted} numberOfLines={2} style={styles.tabText}>
                {h.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.body}>
        {active === 'about' &&
          (tabs.about.length ? (
            <Expandable items={tabs.about} render={(p, i) => <AppText key={i} size={14} color={colors.textMuted} style={styles.para}>{p}</AppText>} />
          ) : (
            <Empty />
          ))}

        {active === 'judging' &&
          (tabs.judgingParameters.length ? (
            <Expandable
              items={tabs.judgingParameters}
              render={(p, i) => (
                <View key={i} style={styles.paramRow}>
                  <AppText size={14} color={colors.text} style={styles.paramName}>
                    {p.name}
                  </AppText>
                  <AppText weight="semibold" size={14} color={colors.primary}>
                    {p.weight}%
                  </AppText>
                </View>
              )}
            />
          ) : (
            <Empty />
          ))}

        {active === 'rules' &&
          (tabs.rules.length ? (
            <Expandable
              items={tabs.rules}
              render={(r, i) => (
                <View key={i} style={styles.ruleRow}>
                  <View style={styles.bullet} />
                  <AppText size={14} color={colors.textMuted} style={styles.ruleText}>
                    {r}
                  </AppText>
                </View>
              )}
            />
          ) : (
            <Empty />
          ))}
      </View>
    </Card>
  );
}

function Empty() {
  const { t } = useLanguage();
  return (
    <AppText size={14} color={colors.textSoft}>
      {t('emptyTab')}
    </AppText>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 10 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginHorizontal: 14 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { textAlign: 'center' },
  body: { paddingHorizontal: 14, paddingTop: 12 },
  list: { gap: 4 },
  para: { lineHeight: 24 },
  more: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 6, paddingTop: 6, paddingBottom: 2 },
  paramRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.rowTint },
  paramName: { flex: 1, paddingRight: 12 },
  ruleRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 3 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 9 },
  ruleText: { flex: 1, lineHeight: 22 },
});
