import './globals.css';
import { AppProvider } from '../context/AppContext';
import MobileViewportWrapper from '../components/MobileViewportWrapper';

export const metadata = {
  title: 'سبايك | SPIKE - ابنِ متجرك.. وضاعف طلباتك',
  description: 'المنظومة الأقوى لإدارة المتاجر الإلكترونية، الشحن، والدفع عند الاستلام',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased transition-colors duration-200 min-h-screen">
        <AppProvider>
          <MobileViewportWrapper>
            {children}
          </MobileViewportWrapper>
        </AppProvider>
      </body>
    </html>
  );
}
