import './globals.css';
import { supabase } from '../lib/supabase';

export const metadata = {
  title: 'LMAA STOR',
  description: 'متجرنا الرسمي',
};

export default async function RootLayout({ children }) {
  // جلب إعدادات البيكسلات المستقلة من قاعدة البيانات في السيرفر مباشرة
  let pixelsList = [];
  try {
    const { data: sData } = await supabase
      .from('store_settings')
      .select('pixel_1, pixel_2, pixel_3, pixel_4, facebook_pixel_id, facebook_pixels')
      .limit(1)
      .maybeSingle();

    if (sData) {
      const raw = [
        sData.pixel_1,
        sData.pixel_2,
        sData.pixel_3,
        sData.pixel_4,
        sData.facebook_pixel_id,
        ...(sData.facebook_pixels ? sData.facebook_pixels.split(',') : []),
      ];
      pixelsList = [...new Set(raw.map((p) => (p || '').trim()).filter(Boolean))];
    }
  } catch (e) {
    console.error('Layout Pixels Fetch Error:', e);
  }

  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* حقن سكريبت فيسبوك بيكسل لكافة البيكسلات المدخلة لتعمل في كل صفحات الموقع بالتوازي */}
        {pixelsList.length > 0 && (
          <script
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
                
                ${pixelsList.map((pid) => `fbq('init', '${pid}');`).join('\n')}
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
      </head>
      <body className="bg-slate-950 text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
