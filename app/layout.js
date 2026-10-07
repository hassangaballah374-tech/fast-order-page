import './globals.css';
import { AppProvider } from '../context/AppContext';

export const metadata = {
  title: 'NEXT ORDER | Platform',
  description: 'منظومة التجارة الإلكترونية والدفع عند الاستلام المتكاملة',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
