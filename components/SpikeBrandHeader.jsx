'use client';

import React from 'react';

export const SPIKE_LOGO_URL = 'https://kunmfgpqyyhmpcpvwuuk.supabase.co/storage/v1/object/public/branding/WhatsApp%20Image%202026-10-06%20at%2011.48.20%20PM.jpeg';

export default function SpikeBrandHeader({ 
  height = 'h-10', 
  className = '', 
  showSlogan = true 
}) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* صورة اللوجو المباشرة من Supabase */}
      <img
        src={SPIKE_LOGO_URL}
        alt="سبايك | SPIKE"
        className={`${height} w-auto object-contain rounded-xl shadow-sm shrink-0`}
        loading="eager"
      />

      {/* الاسم والسلوجن في سطر واحد بجانب بعض */}
      <div className="flex items-center gap-2.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5 font-black text-xl tracking-tight text-[#0E1E38] dark:text-white">
          <span>سبايك</span>
          <span className="font-light text-slate-400 text-lg">|</span>
          <span className="tracking-wider">SPIKE</span>
        </div>

        {showSlogan && (
          <>
            <span className="text-slate-300 dark:text-slate-700 font-bold">•</span>
            <span className="text-xs font-bold text-[#E86A53] tracking-normal">
              ابنِ متجرك.. وضاعف طلباتك
            </span>
          </>
        )}
      </div>
    </div>
  );
}
