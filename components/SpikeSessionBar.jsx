'use client';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

/* ================= إعدادات: عدّل السطرين دول فقط ================= */
export const ADMIN_EMAIL = 'hassanhosny2007@gmail.com'; 
const ADMIN_ROUTE = '/admin';         // مسار صفحة الإدارة
const LOGIN_ROUTE = '/register';      // صفحة تسجيل الدخول
/* مسارات تعتبر صفحات دخول (الأدمن لو سجل منها يروح للإدارة) */
const AUTH_PATH = /login|register|signin|sign-in|signup|sign-up|auth/i;
/* مسارات مش عايز الزرار يظهر فيها (مثلاً صفحات المتجر العامة) */
const HIDE_PREFIXES = ['/dashboard']; // لوحة التاجر فيها زرار خروج خاص بيها. ضيف أي مسار تاني ('/s/' مثلاً)

const isAdminEmail = (e) => (e || '').toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();

export async function spikeLogout(router) {
  try { await supabase.auth.signOut(); } catch (e) { /* تجاهل */ }
  try {
    // بنمسح مفاتيح الجلسة بس، عشان اللغة والثيم يفضلوا محفوظين
    ['user_email', 'is_super_admin', 'merchant_user_id'].forEach((k) => localStorage.removeItem(k));
  } catch (e) { /* تجاهل */ }
  router.replace(LOGIN_ROUTE);
}

export default function SpikeSessionBar() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const goAdmin = () => router.replace(ADMIN_ROUTE);

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const em = data?.session?.user?.email || '';
      setEmail(em);
      // أدمن فاتح صفحة تسجيل دخول وهو أصلاً مسجل → يدخل الإدارة
      if (isAdminEmail(em) && AUTH_PATH.test(window.location.pathname)) goAdmin();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const em = session?.user?.email || '';
      setEmail(em);
      if (event === 'SIGNED_IN' && isAdminEmail(em) && AUTH_PATH.test(window.location.pathname)) {
        goAdmin();
        // لو صفحة الدخول كملت توجيهها لمكان تاني (مثلاً /dashboard) نرجّعه للإدارة
        setTimeout(() => {
          if (!window.location.pathname.startsWith(ADMIN_ROUTE)) goAdmin();
        }, 700);
      }
    });
    return () => { alive = false; sub?.subscription?.unsubscribe(); };
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  if (!email) return null;
  if (pathname.startsWith(ADMIN_ROUTE)) return null; // صفحة الإدارة فيها زرارها الخاص
  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const admin = isAdminEmail(email);
  const btn = {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px',
    border: 0, borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700,
    fontFamily: 'inherit', textAlign: 'start',
  };

  return (
    <div style={{ position: 'fixed', bottom: 16, insetInlineStart: 16, zIndex: 60 }}>
      {open && (
        <div
          style={{
            marginBottom: 10, minWidth: 220, padding: 8, borderRadius: 16,
            background: '#fcfbf7', border: '1px solid #e2ddca', color: '#1f2f33',
            boxShadow: '0 20px 50px -18px rgba(6,73,78,.45)',
          }}
        >
          <div dir="ltr" style={{ padding: '6px 14px 10px', fontSize: 11, color: '#6f7f82', borderBottom: '1px solid #e2ddca', marginBottom: 6, wordBreak: 'break-all' }}>
            {email}
          </div>
          {admin && (
            <button type="button" onClick={() => router.push(ADMIN_ROUTE)} style={{ ...btn, background: '#0a7f86', color: '#fff', marginBottom: 6 }}>
              🛡️ <span>لوحة الإدارة</span>
            </button>
          )}
          <button type="button" onClick={() => spikeLogout(router)} style={{ ...btn, background: 'rgba(201,94,83,.1)', color: '#c95e53' }}>
            🚪 <span>تسجيل الخروج</span>
          </button>
        </div>
      )}
      <button
        type="button"
        aria-label="الحساب"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 46, height: 46, borderRadius: 999, border: '2px solid #fcfbf7', cursor: 'pointer',
          background: admin ? 'linear-gradient(135deg,#f4b987,#e08f4f)' : '#0a7f86', color: admin ? '#3a1d08' : '#fff',
          fontSize: 18, fontWeight: 800, boxShadow: '0 10px 24px -10px rgba(6,73,78,.6)',
        }}
      >
        {admin ? '🛡️' : (email[0] || '?').toUpperCase()}
      </button>
    </div>
  );
}
