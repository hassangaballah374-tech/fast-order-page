'use client';

import React from 'react';
import { useApp } from '../context/AppContext';

export default function MobileViewportWrapper({ children }) {
  const { isMobileView, toggleMobileView, isDark } = useApp();

  // إذا كان وضع الموبايل غير مفعل، يتم عرض الصفحة بالكامل دون أي تعديل
  if (!isMobileView) {
    return <>{children}</>;
  }

  return (
    <div 
      className={`min-h-screen w-full py-8 px-4 flex flex-col justify-center items-center transition-colors duration-200 select-none ${
        isDark ? 'bg-slate-950/95' : 'bg-slate-900/90'
      }`}
    >
      {/* 📱 هيكل الهاتف بالأبعاد المطلوبة: 8.4 سم عرض × 18 سم ارتفاع */}
      <div 
        style={{ 
          width: '8.4cm', 
          height: '18cm',
          maxHeight: '94vh'
        }}
        className={`relative flex flex-col rounded-lg border-[3px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden transition-all duration-200 ${
          isDark 
            ? 'border-slate-700 bg-[#0E1E38] text-white' 
            : 'border-slate-700 bg-white text-slate-900'
        }`}
      >
        {/* شريط رأس الهاتف العلوي المدمج (بدون حواف بيضاء) */}
        <div className="h-7 w-full bg-slate-900 text-slate-300 px-3 flex items-center justify-between text-[10px] font-mono shrink-0 select-none border-b border-slate-800">
          <span className="font-bold text-[9px] text-emerald-400">8.4cm × 18cm</span>
          
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-400">Mobile Mode</span>
            {/* زر العودة للشاشة الكاملة */}
            <button
              type="button"
              onClick={toggleMobileView}
              className="text-slate-400 hover:text-white hover:bg-slate-800 rounded px-1 transition cursor-pointer"
              title="العودة لشاشة الكمبيوتر"
            >
              ✕
            </button>
          </div>
        </div>

        {/* جسم الشاشة الفعلي الذي يحتوي على الصفحة مع سكرول مرن */}
        <div className="w-full flex-1 overflow-y-auto overflow-x-hidden text-xs">
          {children}
        </div>

        {/* شريط الإيماءات السفلي للهاتف */}
        <div className="h-4 w-full bg-transparent flex items-center justify-center shrink-0 select-none pointer-events-none">
          <div className="w-24 h-1 bg-slate-500/40 rounded-full" />
        </div>
      </div>
    </div>
  );
}
