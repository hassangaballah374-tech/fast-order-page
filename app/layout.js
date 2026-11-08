import './globals.css';
import { AppProvider } from '../context/AppContext';
import MobileViewportWrapper from '../components/MobileViewportWrapper';
import MotionFX from '../components/MotionFX';
import PwaBoot from '../components/PwaBoot';
import PullRefresh from '../components/PullRefresh';

const ICON = '/brand/icon-512.png?v=2';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#014D6F',
};

export const metadata = {
  applicationName: 'سبايك',
  appleWebApp: { capable: true, title: 'سبايك', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  title: 'سبايك | SPIKE - ابنِ متجرك.. وضاعف طلباتك',
  description: 'المنظومة الأقوى لإدارة المتاجر الإلكترونية، الشحن، والدفع عند الاستلام',
  icons: {
    icon: [
      { url: '/favicon.ico?v=2', sizes: 'any' },
      { url: '/brand/icon-32.png?v=2', type: 'image/png', sizes: '64x64' },
      { url: ICON, type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico?v=2',
    apple: [{ url: '/brand/apple-icon.png?v=2', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased transition-colors duration-200 min-h-screen">
        <AppProvider>
          <MobileViewportWrapper>
            <MotionFX />
            {children}
            <PwaBoot />
            <PullRefresh />
          </MobileViewportWrapper>
        </AppProvider>
      </body>
    </html>
  );
}
