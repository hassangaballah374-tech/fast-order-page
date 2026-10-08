'use client';

import React from 'react';

export const SPIKE_LOGO_URL = 'https://kunmfgpqyyhmpcpvwuuk.supabase.co/storage/v1/object/public/branding/WhatsApp%20Image%202026-10-06%20at%2011.48.20%20PM.jpeg';

export default function SpikeBrandHeader({ 
  height = 'h-11', 
  className = '', 
  showSlogan = true 
}) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* اللوجو الرسمي من Supabase */}
      <img
        src={SPIKE_LOGO_URL}
        alt="SPIKE | سبايك"
        className={`${height} w-auto object-contain rounded-xl shadow-sm shrink-0`}
        loading="eager"
      />

      {/* الاسم وتحته السلوجن مع وضوح اللون البيج في الوضع الليلي */}
      <div className="flex flex-col justify-center leading-tight">
        <div className="flex items-center gap-1.5 font-black text-xl tracking-tight text-[#0E1E38] dark:text-[#F7F4EC]">
          <span>سبايك</span>
          <span className="font-light text-slate-400 dark:text-slate-500 text-lg">|</span>
          <span className="tracking-wider">SPIKE</span>
        </div>

        {showSlogan && (
          <span className="text-[11px] font-bold text-[#E86A53] mt-0.5 tracking-normal">
            ابنِ متجرك.. وضاعف طلباتك
          </span>
        )}
      </div>
    </div>
  );
}
