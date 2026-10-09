'use client';

import React from 'react';
import { useApp } from '../context/AppContext';

export default function MobileViewportWrapper({ children }) {
  const { isMobileView, toggleMobileView, isDark } = useApp();

  return (
    <div className="relative min-h-screen">
      {/* 🔘 زر عائم فوري ثابت فوق كل الصفحات في الركن العلوي */}
      <button
        type="button"
        onClick={toggleMobileView}
        style={{ zIndex: 99999 }}
        className={`fixed top-4 left-4 w-11 h-11 rounded-2xl shadow-2xl border-2 flex items-center justify-center text-xl transition-transform hover:scale-110 active:scale-95 cursor-pointer ${
          isMobileView
            ? 'bg-[#00B050] text-white border-emerald-400 ring-4 ring-emerald-500/20'
            : isDark
            ? 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800'
            : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
        }`}
        title={isMobileView ? 'الرجوع لشاشة اللاب توب' : 'التحويل لشاشة الموبايل'}
      >
        {isMobileView ? '💻' : '📱'}
      </button>

      {/* العرض إما داخل إطار موبايل حقيقي أو شاشة كاملة */}
      {isMobileView ? (
        <div className={`min-h-screen py-10 px-4 flex justify-center items-start ${
          isDark ? 'bg-slate-950' : 'bg-slate-200'
        }`}>
          <div className={`w-full max-w-[375px] min-h-[812px] rounded-[44px] shadow-2xl border-[10px] overflow-hidden flex flex-col transition-all duration-300 ${
            isDark ? 'border-slate-800 bg-[#0E1E38]' : 'border-slate-900 bg-white'
          }`}>
            <div className="w-full flex-1 overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </div>
        </div>
      ) : (
        <>{children}</>
      )}
    </div>
  );
}
