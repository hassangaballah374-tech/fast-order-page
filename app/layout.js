import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'متجرنا الرسمي',
  description: 'أفضل المنتجات مع الدفع عند الاستلام',
};

export default function RootLayout({ children }) {
  // استبدل الأرقام بالأسفل برقم البيكسل الخاص بك
  const FB_PIXEL_ID = '870300779500843';

  return (
    <html lang="ar" dir="rtl">
      <head>
        {FB_PIXEL_ID && FB_PIXEL_ID !== '870300779500843' && (
          <>
            <Script
              id="fb-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${FB_PIXEL_ID}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
