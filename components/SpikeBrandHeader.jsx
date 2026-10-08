'use client';
import SpikeLogo from './SpikeLogo';

export default function SpikeBrandHeader({ logoSize = 42, className = '' }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <SpikeLogo size={logoSize} />
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
        <span className="text-[10px] font-bold text-[#E86A53] mt-1 tracking-normal">
          ابنِ متجرك.. وضاعف طلباتك
        </span>
      </div>
    </div>
  );
}
