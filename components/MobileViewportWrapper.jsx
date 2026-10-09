'use client';

import React from 'react';
import { useApp } from '../context/AppContext';

export default function MobileViewportWrapper({ children }) {
  const { isMobileView, isDark } = useApp();

  if (!isMobileView) {
    return <>{children}</>;
  }

  return (
    <div className={`min-h-screen py-8 px-4 flex justify-center items-start transition-colors duration-300 ${
      isDark ? 'bg-slate-950' : 'bg-slate-200'
    }`}>
      {/* إطار الهاتف بالأبعاد القياسية الدقيقة: 375px */}
      <div className={`w-full max-w-[375px] min-h-[812px] rounded-[40px] shadow-2xl border-[8px] overflow-hidden flex flex-col transition-all duration-200 ${
        isDark ? 'border-slate-800 bg-[#0E1E38]' : 'border-slate-900 bg-white'
      }`}>
        <div className="w-full flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
