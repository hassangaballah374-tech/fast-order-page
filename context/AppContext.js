'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [lang, setLang] = useState('ar');
  const [theme, setTheme] = useState('light');
  const [isMounted, setIsMounted] = useState(false);

  // 1. قراءة التفضيلات المحفوظة عند فتح الموقع
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('spike_lang') || 'ar';
      const savedTheme = localStorage.getItem('spike_theme') || 'light';
      setLang(savedLang);
      setTheme(savedTheme);

      // تطبيق الاتجاه والمظهر على الـ HTML الأساسي فوراً
      applyThemeAndLang(savedTheme, savedLang);
    } catch (e) {
      console.error(e);
    }
    setIsMounted(true);
  }, []);

  const applyThemeAndLang = (currentTheme, currentLang) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // ضبط الوضع الليلي/النهاري على جذر الموقع
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // ضبط اتجاه ولغة الصفحة عالمياً
    root.setAttribute('lang', currentLang);
    root.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
  };

  // 2. دالة تبديل اللغة مع الحفظ الدائم
  const toggleLanguage = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    try {
      localStorage.setItem('spike_lang', nextLang);
      applyThemeAndLang(theme, nextLang);
    } catch (e) {
      console.error(e);
    }
  };

  // 3. دالة تبديل المود (ليلي / نهاري) مع الحفظ الدائم
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('spike_theme', nextTheme);
      applyThemeAndLang(nextTheme, lang);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        theme,
        toggleLanguage,
        toggleTheme,
        isDark: theme === 'dark',
      }}
    >
      {/* تجنب الوميض أثناء القراءة من LocalStorage */}
      <div className={theme === 'dark' ? 'dark' : ''} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    return {
      lang: 'ar',
      theme: 'light',
      isDark: false,
      toggleLanguage: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
