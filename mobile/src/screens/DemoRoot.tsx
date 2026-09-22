import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createCompetitionApi } from '../api/competitionApi';
import { SessionProvider } from '../api/SessionContext';
import type { CompetitionListItem, DemoUser } from '../api/types';
import { DemoSwitcher } from '../components/DemoSwitcher';
import { ErrorView, LoadingView } from '../components/StateViews';
import { useLanguage } from '../i18n/LanguageContext';
import { errorMessage } from '../utils/errors';
import { CompetitionDetailsScreen } from './CompetitionDetailsScreen';

const ENV_USER = process.env.EXPO_PUBLIC_USER_ID;
const ENV_COMPETITION = process.env.EXPO_PUBLIC_COMPETITION_ID;

/**
 * Stand-in for the rest of the app (login + navigation), which is out of scope.
 * It picks a user and a competition and hands `competitionId` to the real screen,
 * which is exactly what a navigation param would do in production.
 */
export function DemoRoot() {
  const { t, lang } = useLanguage();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [userId, setUserId] = useState<string | null>(ENV_USER ?? null);
  const [competitionId, setCompetitionId] = useState<string | null>(ENV_COMPETITION ?? null);
  const [bootError, setBootError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setBootError(null);
        let list: DemoUser[] = [];
        try {
          list = (await createCompetitionApi({ userId: null, lang: 'en' }).listDemoUsers()).users;
        } catch (e) {
          if (!ENV_USER) throw e; // dev routes are optional only when a user id is supplied
        }
        const uid = ENV_USER ?? list[0]?.id ?? null;
        if (!uid) throw new Error('No users found. Run `npm run seed` in the backend.');
        let cid = ENV_COMPETITION ?? null;
        if (!cid) cid = (await createCompetitionApi({ userId: uid, lang: 'en' }).listCompetitions()).competitions[0]?.id ?? null;
        if (cancelled) return;
        setUsers(list);
        setUserId(uid);
        setCompetitionId(cid);
      } catch (e) {
        if (!cancelled) setBootError(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const current = users.find((u) => u.id === userId);
  const session = useMemo(
    () => ({ userId: userId ?? '', userName: current?.name ?? '', avatarUrl: current ? `https://i.pravatar.cc/120?u=${current.referralCode}` : null }),
    [userId, current]
  );

  const loadCompetitions = useCallback(
    async (): Promise<CompetitionListItem[]> =>
      (await createCompetitionApi({ userId, lang }).listCompetitions()).competitions,
    [userId, lang]
  );

  if (bootError) return <ErrorView message={errorMessage(t, bootError)} onRetry={() => setAttempt((a) => a + 1)} />;
  if (!userId || !competitionId) return <LoadingView />;

  return (
    <SessionProvider value={session}>
      {/* key: switching user or competition remounts the screen so no state leaks between them */}
      <CompetitionDetailsScreen
        key={`${userId}:${competitionId}`}
        competitionId={competitionId}
        headerExtra={
          users.length > 0 ? (
            <DemoSwitcher
              users={users}
              userId={userId}
              competitionId={competitionId}
              loadCompetitions={loadCompetitions}
              onSelectUser={setUserId}
              onSelectCompetition={setCompetitionId}
            />
          ) : null
        }
      />
    </SessionProvider>
  );
}
