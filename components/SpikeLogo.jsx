'use client';

export default function SpikeLogo({ size = 44, className = '' }) {
  return (
    <img
      src="/spike-brand.jpg"
      alt="سبايك | SPIKE"
      style={{ height: `${size}px` }}
      className={`w-auto object-contain rounded-lg ${className}`}
    />
  );
}
