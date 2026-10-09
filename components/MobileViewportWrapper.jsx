'use client';

import React from 'react';
import { useApp } from '../context/AppContext';

export default function MobileViewportWrapper({ children }) {
  const { isMobileView, toggleMobileView, isDark } = useApp();

  return (
    <div className="relative min-h-screen">
      {/* 🔘 زر عائم ثابت دائماً للتبديل بين شاشة اللاب والموبايل */}
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
        title={isMobileView ? 'الرجوع للشاشة الكاملة' : 'معاينة وضع الموبايل (7cm × 15.5cm)'}
      >
        {isMobileView ? '💻' : '📱'}
      </button>

      {/* عرض شاشة الهاتف بالمقاس المحدد: 7 سم عرض × 15.5 سم ارتفاع */}
      {isMobileView ? (
        <div className={`min-h-screen py-6 px-2 flex flex-col justify-center items-center ${
          isDark ? 'bg-slate-950' : 'bg-slate-200'
        }`}>
          <div 
            style={{ 
              width: '7cm', 
              height: '15.5cm',
              maxHeight: '90vh' 
            }}
            className={`rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-[6px] overflow-hidden flex flex-col transition-all duration-200 ${
              isDark ? 'border-slate-800 bg-[#0E1E38]' : 'border-slate-900 bg-white'
            }`}
          >
            {/* كاميرا / نوتش الهاتف العلوي */}
            <div className="w-full bg-transparent py-1 flex items-center justify-center shrink-0 select-none">
              <div className="w-16 h-2.5 bg-black/80 rounded-full" />
            </div>

            {/* محتوى الصفحة داخل الشاشة مع إمكانية التمرير */}
            <div className="w-full flex-1 overflow-y-auto overflow-x-hidden text-[85%]">
              {children}
            </div>

            {/* شريط الإيماءات السفلي */}
            <div className="w-full py-1 flex items-center justify-center shrink-0 select-none pointer-events-none">
              <div className="w-20 h-1 bg-slate-400/40 rounded-full" />
            </div>
          </div>
        </div>
      ) : (
        <>{children}</>
      )}
    </div>
  );
}
