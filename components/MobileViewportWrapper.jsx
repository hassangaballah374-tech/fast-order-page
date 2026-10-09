'use client';

import React from 'react';
import { useApp } from '../context/AppContext';

export default function MobileViewportWrapper({ children }) {
  const { isMobileView, toggleMobileView, isDark } = useApp();

  return (
    <div className="relative min-h-screen">
      {/* 🔘 زر التبديل العائم الثابت */}
      <button
        type="button"
        onClick={toggleMobileView}
        style={{ zIndex: 99999 }}
        className={`fixed top-4 left-4 w-11 h-11 rounded-xl shadow-2xl border-2 flex items-center justify-center text-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
          isMobileView
            ? 'bg-[#00B050] text-white border-emerald-400 ring-4 ring-emerald-500/20'
            : isDark
            ? 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800'
            : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
        }`}
        title={isMobileView ? 'الرجوع للشاشة الكاملة' : 'معاينة وضع الموبايل'}
      >
        {isMobileView ? '💻' : '📱'}
      </button>

      {/* العرض بمقاس أكبر بحواف مستقيمة وغير دائرية */}
      {isMobileView ? (
        <div className={`min-h-screen py-8 px-4 flex justify-center items-center ${
          isDark ? 'bg-slate-950' : 'bg-slate-300/80'
        }`}>
          <div 
            style={{ 
              width: '8.4cm', 
              height: '18cm',
              maxHeight: '92vh' 
            }}
            className={`shadow-[0_25px_60px_rgba(0,0,0,0.35)] border-[5px] rounded-lg overflow-hidden flex flex-col transition-all duration-200 ${
              isDark ? 'border-slate-700 bg-[#0E1E38]' : 'border-slate-800 bg-white'
            }`}
          >
            {/* المحتوى الفعلي مع تمرير سلس وشاشة مستوية */}
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
