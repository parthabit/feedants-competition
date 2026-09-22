import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { ApiError } from '../api/client';
import { useApi } from '../api/SessionContext';
import type { CompetitionView } from '../api/types';

const POLL_MS = 20_000;

/**
 * Loads a competition and keeps it fresh:
 *  - refetches when the app returns to the foreground
 *  - polls every 20s while visible so the spot counter tracks other users' bookings
 *  - `refresh()` is called after every user action and whenever a countdown hits zero
 *  - out-of-order responses are discarded (a slow old response can never overwrite a newer one)
 *  - keeps showing the last good data during background refreshes and transient errors
 *  - exposes `getNow()` = server time, so countdowns are right even if the phone clock is wrong
 */
export function useCompetition(competitionId: string) {
  const api = useApi();
  const [data, setData] = useState<CompetitionView | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const requestSeq = useRef(0);
  const clockOffsetMs = useRef(0);
  const hasData = useRef(false);

  const load = useCallback(
    async (mode: 'initial' | 'silent' | 'pull' = 'silent') => {
      const seq = ++requestSeq.current;
      if (mode === 'initial' && !hasData.current) setLoading(true);
      if (mode === 'pull') setRefreshing(true);
      try {
        const view = await api.getCompetition(competitionId);
        if (seq !== requestSeq.current) return;
        clockOffsetMs.current = Date.parse(view.serverTime) - Date.now();
        hasData.current = true;
        setData(view);
        setError(null);
      } catch (e) {
        if (seq !== requestSeq.current) return;
        // A failed silent refresh must not blow away a screen the user is looking at.
        if (!hasData.current || mode !== 'silent') setError(e instanceof ApiError ? e : new ApiError(0, 'UNKNOWN', String(e)));
      } finally {
        if (seq === requestSeq.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [api, competitionId]
  );

  // Initial load (and reload when language changes, since content is localised server-side)
  useEffect(() => {
    load('initial');
  }, [load]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (!timer) timer = setInterval(() => load('silent'), POLL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    if (AppState.currentState === 'active') start();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        load('silent');
        start();
      } else {
        stop();
      }
    });
    return () => {
      stop();
      sub.remove();
    };
  }, [load]);

  const getNow = useCallback(() => Date.now() + clockOffsetMs.current, []);
  const refresh = useCallback(() => load('silent'), [load]);
  const pullToRefresh = useCallback(() => load('pull'), [load]);
  const retry = useCallback(() => load('initial'), [load]);

  return { data, error, loading, refreshing, refresh, pullToRefresh, retry, getNow };
}
