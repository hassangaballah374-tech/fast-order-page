import './globals.css';
import { AppProvider } from '../context/AppContext';
import MobileViewportWrapper from '../components/MobileViewportWrapper';
import SpikeSessionBar from '../components/SpikeSessionBar';

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
