import './globals.css';

export const metadata = {
  title: 'طلب المنتج - العرض الحصري',
  description: 'الدفع عند الاستلام مع معاينة المنتج قبل الاستلام',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
