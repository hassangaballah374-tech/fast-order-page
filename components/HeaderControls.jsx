'use client';

import React from 'react';
import { useApp } from '../context/AppContext';

export default function HeaderControls({ className = '' }) {
  const { lang, toggleLanguage, toggleTheme, isDark, isMobileView, toggleMobileView } = useApp();

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* 📱 / 💻 زر تبديل العرض (أيقونة الموبايل أو اللاب فقط بجانب اللغة) */}
      <button
        type="button"
        onClick={toggleMobileView}
        className={`w-9 h-9 rounded-xl border flex items-center justify-center text-base transition cursor-pointer ${
          isMobileView
            ? 'bg-[#00B050] text-white border-[#00B050] shadow-sm'
            : isDark
            ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
        }`}
        title={isMobileView ? 'التبديل إلى شاشة الكمبيوتر' : 'التبديل إلى شاشة الموبايل'}
      >
        {isMobileView ? '💻' : '📱'}
      </button>

      {/* 🌐 زر تبديل اللغة */}
      <button
        type="button"
        onClick={toggleLanguage}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
          isDark
            ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
        }`}
      >
        <span>🌐</span>
        <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
      </button>

      {/* 🌙 / ☀️ زر تبديل المظهر */}
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm transition cursor-pointer ${
          isDark
            ? 'border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700'
            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
        }`}
        title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
      >
        {isDark ? '☀️' : '🌙'}
      </button>
    </div>
  );
}
