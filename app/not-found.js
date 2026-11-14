import Link from 'next/link';
import SpikeLogo from '../components/SpikeLogo';

export const metadata = { title: 'الصفحة غير موجودة | سبايك' };

export default function NotFound() {
  return (
    <main dir="rtl" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#ECF3FD', color: '#0f172a', fontFamily: 'Cairo, system-ui, sans-serif', textAlign: 'center' }}>
      <div style={{ maxWidth: 420 }}>
        <SpikeLogo dark={false} style={{ height: 44, margin: '0 auto 18px' }} />
        <div style={{ fontSize: 64, fontWeight: 900, color: '#014D6F', lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: 22, margin: '10px 0 6px' }}>الصفحة دي مش موجودة</h1>
        <p style={{ opacity: .7, margin: '0 0 20px', lineHeight: 1.8 }}>ممكن الرابط اتغيّر أو اتحذف. ارجع للرئيسية وكمّل من هناك.</p>
        <Link href="/" style={{ display: 'inline-block', background: '#014D6F', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 800, textDecoration: 'none' }}>الرئيسية</Link>
      </div>
    </main>
  );
}
