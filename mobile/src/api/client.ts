import { Platform } from 'react-native';

const RAW_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
// The Android emulator reaches the host machine at 10.0.2.2, not localhost.
export const API_BASE =
  Platform.OS === 'android' ? RAW_BASE.replace('://localhost', '://10.0.2.2').replace('://127.0.0.1', '://10.0.2.2') : RAW_BASE;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  userId?: string | null;
  lang?: string;
  timeoutMs?: number;
}

/** Thin fetch wrapper: timeout, JSON, and the server's { error: { code, message } } shape mapped to ApiError. */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, userId, lang, timeoutMs = 12000 } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(userId ? { 'x-user-id': userId } : {}),
        ...(lang ? { 'Accept-Language': lang } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      /* empty or non-JSON body */
    }

    if (!res.ok) {
      throw new ApiError(res.status, json?.error?.code || 'HTTP_ERROR', json?.error?.message || `Request failed (${res.status})`);
    }
    return json as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const aborted = (err as Error)?.name === 'AbortError';
    throw new ApiError(0, aborted ? 'TIMEOUT' : 'NETWORK', aborted ? 'The request timed out' : 'Could not reach the server');
  } finally {
    clearTimeout(timer);
  }
}
