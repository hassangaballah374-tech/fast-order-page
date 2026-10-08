'use client';

import React from 'react';

// يمكنك لصق كود Base64 للصورة هنا أو استخدام رابط مباشر
export default function SpikeBrandHeader({ 
  height = 'h-11', 
  className = '', 
  showSlogan = true 
}) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <img
        src="/spike-brand.jpg"
        alt="سبايك | SPIKE - ابنِ متجرك.. وضاعف طلباتك"
        className={`${height} w-auto object-contain rounded-lg shadow-sm`}
        onError={(e) => {
          // في حال عدم العثور على ملف الصورة محلياً، يظهر الشعار الاحتياطي بالنصوص والألوان تلقائياً
          e.target.style.display = 'none';
        }}
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
