export default function SpikeLogo({ size = 120, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
    >
      {/* 1. مقبض الحقيبة العلوي المقوس بدقة هندسية */}
      <path
        d="M 185 142 
           C 185 70, 315 70, 315 142"
        stroke="#E86A53"
        strokeWidth="38"
        strokeLinecap="round"
        fill="none"
      />

      {/* 2. السهم العلوي الأيسر (المنطلق نحو المركز) */}
      <path
        d="M 85 110 
           L 182 207 
           L 200 155 
           L 240 155 
           L 240 240 
           L 155 240 
           L 155 200 
           L 207 182 
           L 110 85 
           Z"
        fill="#E86A53"
      />

      {/* 3. السهم العلوي الأيمن (المنطلق نحو المركز) */}
      <path
        d="M 415 110 
           L 390 85 
           L 293 182 
           L 345 200 
           L 345 240 
           L 260 240 
           L 260 155 
           L 300 155 
           L 318 207 
           Z"
        fill="#E86A53"
      />

      {/* 4. السهم السفلي الأيسر (المنطلق نحو المركز) */}
      <path
        d="M 85 390 
           L 110 415 
           L 207 318 
           L 155 300 
           L 155 260 
           L 240 260 
           L 240 345 
           L 200 345 
           L 182 293 
           Z"
        fill="#E86A53"
      />

      {/* 5. السهم السفلي الأيمن (المنطلق نحو المركز) */}
      <path
        d="M 415 390 
           L 318 293 
           L 300 345 
           L 260 345 
           L 260 260 
           L 345 260 
           L 345 300 
           L 293 318 
           L 390 415 
           Z"
        fill="#E86A53"
      />
    </svg>
  );
}
