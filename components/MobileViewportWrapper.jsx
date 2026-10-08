'use client';

import React from 'react';
import { useApp } from '../context/AppContext';

export default function MobileViewportWrapper({ children }) {
  const { isMobileView, toggleMobileView, isDark, lang } = useApp();
  const isAr = lang === 'ar';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isMobileView ? 'bg-slate-900/95 py-6 px-2 flex flex-col items-center justify-start overflow-x-hidden' : ''}`}>
      
      {/* 📱 شريط التحكم العلوي العائم الثابت دائماً في كل الصفحات */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 px-3.5 py-1.5 rounded-full shadow-2xl">
        <button
          type="button"
          onClick={toggleMobileView}
          className={`flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full transition-all cursor-pointer ${
            isMobileView 
              ? 'bg-[#00B050] text-white shadow-md' 
              : 'bg-white/10 hover:bg-white/20 text-slate-200'
          }`}
          title="تبديل وضع العرض"
        >
          <span>{isMobileView ? '📱 وضع الموبايل (نشط)' : '💻 شاشة كاملة'}</span>
        </button>

        {isMobileView && (
          <span className="text-[10px] text-slate-400 font-mono border-r border-slate-700 pr-2">
            390 × 844
          </span>
        )}
      </div>

      {/* إذا كان وضع الموبايل مفعلاً، يتم تحجيم الصفحة داخل إطار هاتف حقيقي */}
      {isMobileView ? (
        <div className="relative mt-8 w-full max-w-[390px] min-h-[844px] bg-white dark:bg-[#0E1E38] rounded-[48px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border-[10px] border-slate-800 overflow-hidden flex flex-col transition-all duration-300">
          
          {/* Dynamic Island / Notch الهاتف */}
          <div className="w-full bg-slate-800 h-6 flex items-center justify-center relative select-none">
            <div className="w-24 h-4 bg-black rounded-full" />
          </div>

          {/* محتوى الصفحة الفعلي داخل إطار الهاتف */}
          <div className="w-full flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </div>

          {/* شريط الإيماءات السفلي للهاتف */}
          <div className="w-full bg-transparent py-1 flex items-center justify-center select-none pointer-events-none">
            <div className="w-32 h-1 bg-slate-400/50 rounded-full" />
          </div>
        </div>
      ) : (
        /* العرض الطبيعي الكامل للمتصفح */
        <>{children}</>
      )}

    </div>
  );
}
