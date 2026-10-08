'use client';

import React from 'react';

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
        loading="eager"
        priority="true"
      />
    </div>
  );
}
