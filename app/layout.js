import './globals.css';
import { AppProvider } from '../context/AppContext';
import MobileViewportWrapper from '../components/MobileViewportWrapper';
import SpikeSessionBar from '../components/SpikeSessionBar';

export const metadata = {
  title: 'سبايك | SPIKE - ابنِ متجرك.. وضاعف طلباتك',
  description: 'المنظومة الأقوى لإدارة المتاجر الإلكترونية، الشحن، والدفع عند الاستلام',
};
export const metadata = {
  title: 'Salesku | Spike Platform',
  description: 'منصة سبايك لإدارة المتاجر الإلكترونية',
  icons: {
    icon: '/favicon.ico', // أو مسار رابط لوجو المتجر بتاعك من قاعدة البيانات
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased transition-colors duration-200 min-h-screen">
        <AppProvider>
          <MobileViewportWrapper>
            {children}
          </MobileViewportWrapper>
          <SpikeSessionBar />
        </AppProvider>
      </body>
    </html>
  );
}
