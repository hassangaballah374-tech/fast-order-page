'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [lang, setLang] = useState('ar'); // 'ar' | 'en'
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'

  useEffect(() => {
    // قراءة الإعدادات المحفوظة مسبقاً
    const savedLang = localStorage.getItem('app_lang') || 'ar';
    const savedTheme = localStorage.getItem('app_theme') || 'dark';
    setLang(savedLang);
    setTheme(savedTheme);
    applySettings(savedLang, savedTheme);
  }, []);

  const applySettings = (selectedLang, selectedTheme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      // ضبط الاتجاه واللغة
      root.setAttribute('dir', selectedLang === 'ar' ? 'rtl' : 'ltr');
      root.setAttribute('lang', selectedLang);

      // ضبط كلاس الثيم
      if (selectedTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    localStorage.setItem('app_lang', nextLang);
    applySettings(nextLang, theme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('app_theme', nextTheme);
    applySettings(lang, nextTheme);
  };

  return (
    <AppContext.Provider value={{ lang, theme, toggleLanguage, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
