import React, { createContext, useContext, useMemo } from 'react';
import { createCompetitionApi, CompetitionApi } from './competitionApi';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Who is using the app. In production this comes from the auth layer (JWT).
 * For this assignment the backend accepts an `x-user-id` header, and the demo bootstrap picks the user.
 */
interface SessionValue {
  userId: string;
  userName: string;
  avatarUrl: string | null;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ value, children }: { value: SessionValue; children: React.ReactNode }) {
  const memo = useMemo(() => value, [value.userId, value.userName, value.avatarUrl]); // eslint-disable-line react-hooks/exhaustive-deps
  return <SessionContext.Provider value={memo}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}

/** API client bound to the current user + language. Identity changes only when either changes. */
export function useApi(): CompetitionApi {
  const { userId } = useSession();
  const { lang } = useLanguage();
  return useMemo(() => createCompetitionApi({ userId, lang }), [userId, lang]);
}
