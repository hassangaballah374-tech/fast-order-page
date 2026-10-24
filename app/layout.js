import './globals.css';
import { AppProvider } from '../context/AppContext';
import MobileViewportWrapper from '../components/MobileViewportWrapper';

const ICON = 'https://kunmfgpqyyhmpcpvwuuk.supabase.co/storage/v1/object/public/branding/icon.png?v=1';

export const metadata = {
  title: 'سبايك | SPIKE - ابنِ متجرك.. وضاعف طلباتك',
  description: 'المنظومة الأقوى لإدارة المتاجر الإلكترونية، الشحن، والدفع عند الاستلام',
  icons: {
    icon: [{ url: ICON, type: 'image/png' }],
    shortcut: ICON,
    apple: ICON,
  },
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
