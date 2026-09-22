import { ApiError } from '../api/client';

type T = (key: string, params?: Record<string, string | number>) => string;

/** Maps backend error codes to friendly, localised copy. Never shows raw server text. */
export function errorMessage(t: T, err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'NETWORK' || err.code === 'TIMEOUT') return t('errNetwork');
    if (err.code === 'NOT_FOUND') return t('errNotFound');
    const key = `err.${err.code}`;
    const msg = t(key);
    return msg === key ? t('errGeneric') : msg;
  }
  return t('errGeneric');
}
