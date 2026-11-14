'use client';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => { try { console.error('APP_ERROR', error?.message); } catch { /* تجاهل */ } }, [error]);
  return (
    <main dir="rtl" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#ECF3FD', color: '#0f172a', fontFamily: 'Cairo, system-ui, sans-serif', textAlign: 'center' }}>
      <div style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h1 style={{ fontSize: 22, margin: '10px 0 6px' }}>حصلت مشكلة غير متوقعة</h1>
        <p style={{ opacity: .7, margin: '0 0 20px', lineHeight: 1.8 }}>جرّب تاني، ولو المشكلة فضلت ارجع للرئيسية.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button type="button" onClick={() => reset()} style={{ background: '#014D6F', color: '#fff', border: 0, padding: '12px 24px', borderRadius: 12, fontWeight: 800, cursor: 'pointer', font: 'inherit' }}>حاول تاني</button>
          <a href="/" style={{ border: '1px solid #94a3b8', color: 'inherit', padding: '12px 24px', borderRadius: 12, fontWeight: 800, textDecoration: 'none' }}>الرئيسية</a>
        </div>
      </div>
    </main>
  );
}
