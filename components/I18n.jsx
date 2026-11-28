'use client';
import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { tr } from '../lib/i18n';

/* const tx = useT();  tx('نص عربي')  أو  tx('لديك {1} طلب', [n]) */
export function useT() {
  const { lang } = useApp();
  return useCallback((key, vars) => tr(lang, key, vars), [lang]);
}
export function useLang() {
  const { lang, toggleLanguage } = useApp();
  return { lang, toggleLanguage, isEn: lang === 'en' };
}
