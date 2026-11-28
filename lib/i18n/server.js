import { cookies } from 'next/headers';
import { tr } from './index';

/* لغة الزائر على السيرفر (من كوكي spike_lang اللي بتتكتب لما يبدّل اللغة). الافتراضي عربي. */
export function getLang() {
  try { return cookies().get('spike_lang')?.value === 'en' ? 'en' : 'ar'; } catch { return 'ar'; }
}
export function getT() {
  const lang = getLang();
  return { lang, T: (k, v) => tr(lang, k, v), dir: lang === 'en' ? 'ltr' : 'rtl' };
}
