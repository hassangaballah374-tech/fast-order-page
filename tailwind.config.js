/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // تفعيل التحكم بالوضع الليلي عن طريق الـ class
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // أضفنا مسار المكونات لضمان تطبيق الألوان عليها
  ],
  theme: {
    extend: {
      colors: {
        // إضافات هوية ألوان الأفوكادو لمنصة سبايك
        avocado: {
          DEFAULT: '#6B8E23', // الأخضر الزيتوني الأساسي
          light: '#E2EEDB',   // الأخضر الفاتح الناعم للإحصائيات والنجاح
          cream: '#FDF6EC',   // الأصفر الكريمي لخلفيات البطاقات
        },
      },
    },
  },
  plugins: [],
}
