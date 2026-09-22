import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../api/SessionContext';
import { useLanguage } from '../i18n/LanguageContext';
import { colors } from '../theme';
import { AppText } from './AppText';

/** App-level navigation from the design. "Competitions" is the active tab on this screen. */
export function BottomTabBar() {
  const { t } = useLanguage();
  const { avatarUrl } = useSession();

  const Item = ({ icon, label, active }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean }) => (
    <View style={styles.item} accessibilityRole="button" accessibilityState={{ selected: !!active }}>
      <Ionicons name={icon} size={26} color={active ? colors.primary : '#7D8A89'} />
      <AppText weight={active ? 'semibold' : 'regular'} size={11.5} color={active ? colors.primary : '#7D8A89'}>
        {label}
      </AppText>
    </View>
  );

  return (
    <View style={styles.bar}>
      <Item icon="home" label={t('tabHome')} />
      <Item icon="search-outline" label={t('tabExplore')} />
      <View style={styles.item}>
        <View style={styles.plus}>
          <Ionicons name="add" size={32} color="#fff" />
        </View>
      </View>
      <Item icon="trophy" label={t('tabCompetitions')} active />
      <View style={styles.item}>
        {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <Ionicons name="person-circle" size={30} color="#7D8A89" />}
        <AppText size={11.5} color="#7D8A89">
          {t('tabProfile')}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#fff', paddingTop: 8, paddingBottom: 6, borderTopWidth: 1, borderTopColor: colors.border },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  plus: { width: 56, height: 46, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: -14 },
  avatar: { width: 30, height: 30, borderRadius: 15 },
});
