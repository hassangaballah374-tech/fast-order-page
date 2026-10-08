'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [lang, setLang] = useState('ar');
  const [theme, setTheme] = useState('light');
  const [isMobileView, setIsMobileView] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('spike_lang') || 'ar';
      const savedTheme = localStorage.getItem('spike_theme') || 'light';
      const savedMobile = localStorage.getItem('spike_mobile_view') === 'true';
      
      setLang(savedLang);
      setTheme(savedTheme);
      setIsMobileView(savedMobile);
      syncDom(savedTheme, savedLang);
    } catch (e) {
      console.error(e);
    }
    setMounted(true);
  }, []);

  const syncDom = (currentTheme, currentLang) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    root.setAttribute('lang', currentLang);
    root.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    try {
      localStorage.setItem('spike_lang', nextLang);
      syncDom(theme, nextLang);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('spike_theme', nextTheme);
      syncDom(nextTheme, lang);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMobileView = () => {
    setIsMobileView(prev => {
      const next = !prev;
      try {
        localStorage.setItem('spike_mobile_view', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        theme,
        toggleLanguage,
        toggleTheme,
        isDark: theme === 'dark',
        isMobileView,
        toggleMobileView,
      }}
    >
      <div className={theme === 'dark' ? 'dark' : ''} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    return {
      lang: 'ar',
      theme: 'light',
      isDark: false,
      isMobileView: false,
      toggleLanguage: () => {},
      toggleTheme: () => {},
      toggleMobileView: () => {},
    };
  }
  return ctx;
}
