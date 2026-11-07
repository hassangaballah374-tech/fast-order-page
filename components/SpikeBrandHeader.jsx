'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import SpikeLogo from './SpikeLogo';

export const SPIKE_LOGO_URL = 'https://kunmfgpqyyhmpcpvwuuk.supabase.co/storage/v1/object/public/branding/icon.png?v=1';

export default function SpikeBrandHeader({ 
  height = 'h-11', 
  className = '', 
  showSlogan = true 
}) {
  const { theme } = useApp?.() || { theme: 'light' };
  const isDark = theme === 'dark';

  // تحديد اللون مباشرة وبشكل قاطع حسب الثيم
  
  

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* الشعار الرسمي: نسخة نهارية/ليلية (فيه الاسم والسلوجن) */}
      <SpikeLogo dark={isDark} className={`${height} w-auto object-contain shrink-0`} loading="eager" />

      {showSlogan && (
        <span className="hidden sm:block text-[11px] font-bold text-[#0E8FC0] tracking-normal">
          ابنِ متجرك.. وضاعف طلباتك
        </span>
      )}
    </div>
  );
}
