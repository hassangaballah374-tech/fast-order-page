import './globals.css';
import { AppProvider } from '../context/AppContext';
import MobileViewportWrapper from '../components/MobileViewportWrapper';
import MotionFX from '../components/MotionFX';
import PwaBoot from '../components/PwaBoot';
import PullRefresh from '../components/PullRefresh';
import { BrandProvider } from '../components/BrandContext';
import { getBrand } from '../lib/brandServer';
import { withV } from '../lib/brand';

export const dynamic = 'force-dynamic';

const ICON = '/brand/icon-512.png?v=2';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#014D6F',
};

export async function generateMetadata() {
  const b = await getBrand();
  const ic = withV(b.icon, b.v);
  return {
    applicationName: b.name,
    appleWebApp: { capable: true, title: b.name, statusBarStyle: 'default' },
    formatDetection: { telephone: false },
    title: { default: `${b.name} | ${b.name_en} - ${b.tagline}`, template: `%s | ${b.name}` },
    description: b.description,
    icons: ic ? { icon: [{ url: ic }], shortcut: ic, apple: [{ url: ic }] } : {
      icon: [
        { url: '/favicon.ico?v=2', sizes: 'any' },
        { url: '/brand/icon-32.png?v=2', type: 'image/png', sizes: '64x64' },
        { url: ICON, type: 'image/png', sizes: '512x512' },
      ],
      shortcut: '/favicon.ico?v=2',
      apple: [{ url: '/brand/apple-icon.png?v=2', sizes: '180x180', type: 'image/png' }],
    },
  };
}

export default async function RootLayout({ children }) {
  const brand = await getBrand();
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased transition-colors duration-200 min-h-screen">
        <BrandProvider initial={brand}>
        <AppProvider>
          <MobileViewportWrapper>
            <MotionFX />
            {children}
            <PwaBoot />
            <PullRefresh />
          </MobileViewportWrapper>
        </AppProvider>
        </BrandProvider>
      </body>
    </html>
  );
}
