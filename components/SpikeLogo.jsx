'use client';

export default function SpikeLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      shapeRendering="geometricPrecision"
    >
      {/* 1. مقبض الحقيبة العلوي المقوس بدقة */}
      <path
        d="M 148 112 C 148 42, 252 42, 252 112"
        stroke="#E86A53"
        strokeWidth="24"
        strokeLinecap="round"
        fill="none"
      />

      {/* 2. السهم العلوي الأيسر (الزاوية 45° متجه للمركز) */}
      <path
        d="M 66 110 
           L 108 68 
           L 174 134 
           L 160 120 
           L 160 125 
           L 182 125 
           L 192 216 
           L 101 206 
           L 101 184 
           L 126 184 
           Z"
        fill="#E86A53"
      />

      {/* 3. السهم العلوي الأيمن */}
      <path
        d="M 334 110 
           L 274 184 
           L 299 184 
           L 299 206 
           L 208 216 
           L 218 125 
           L 240 125 
           L 226 134 
           L 292 68 
           Z"
        fill="#E86A53"
      />

      {/* 4. السهم السفلي الأيسر */}
      <path
        d="M 66 338 
           L 126 264 
           L 101 264 
           L 101 242 
           L 192 232 
           L 182 323 
           L 160 323 
           L 174 314 
           L 108 380 
           Z"
        fill="#E86A53"
      />

      {/* 5. السهم السفلي الأيمن */}
      <path
        d="M 334 338 
           L 292 380 
           L 226 314 
           L 240 323 
           L 218 323 
           L 208 232 
           L 299 242 
           L 299 264 
           L 274 264 
           Z"
        fill="#E86A53"
      />
    </svg>
  );
}
