'use client';
import { useEffect } from 'react';
import { useLang } from '../I18n';

/* تبديل اللغة (عربي / English): بيتحفظ، وبيقلب اتجاه الصفحة كلها */
export default function LangToggle({ className = 'mode' }) {
  const { lang, toggleLanguage } = useLang();
  useEffect(() => {
    const r = document.querySelector('.spk');
    if (r) { r.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl'); r.setAttribute('lang', lang); }
  }, [lang]);
  return <button type="button" className={className} onClick={toggleLanguage} aria-label={lang === 'en' ? 'العربية' : 'English'} title={lang === 'en' ? 'العربية' : 'English'} style={{ fontSize: 12, fontWeight: 800 }}>{lang === 'en' ? 'ع' : 'EN'}</button>;
}
