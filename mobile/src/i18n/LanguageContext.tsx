import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Lang } from '../api/types';
import { StringKey, translate } from './strings';

type TFunction = (key: StringKey | (string & {}), params?: Record<string, string | number>) => string;

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFunction;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const t = useCallback<TFunction>((key, params) => translate(lang, key, params), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
