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
      <img
        src={SPIKE_LOGO_URL}
        alt="سبايك | SPIKE"
        className={`${height} w-auto object-contain rounded-lg shadow-sm`}
        loading="eager"
      />
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-black tracking-tight text-[#0E1E38] dark:text-white">
            سبايك
          </span>
          <span className="text-xl font-light text-slate-400">|</span>
          <span className="text-xl font-black tracking-tight text-[#0E1E38] dark:text-white">
            SPIKE
          </span>
        </div>
        {showSlogan && (
          <span className="text-[10px] font-bold text-[#E86A53] mt-1 tracking-normal">
            ابنِ متجرك.. وضاعف طلباتك
          </span>
        )}
      </div>
    </div>
  );
}
