'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { PageHead, Empty } from './ui';

const Loading = () => <div className="card"><p className="mut">جاري التحميل...</p></div>;
const L = (loader, name) => dynamic(() => loader().then((m) => m[name]), { ssr: false, loading: Loading });

function Soon() {
  return (
    <>
      <PageHead title="قريباً" sub="هذه الشاشة تصل في الجزء الثاني من التحديث" />
      <div className="card"><Empty icon="🛠️" t="هذه الشاشة قيد التجهيز وستعمل بعد رفع الجزء الثاني" /></div>
    </>
  );
}

const Orders = L(() => import('./screens/Orders'), 'OrdersScreen');
const Abandoned = L(() => import('./screens/Orders'), 'AbandonedScreen');
const BlockedOrders = dynamic(() => import('./screens/Orders').then((m) => function B() { return <m.BlockedScreen kind="order" />; }), { ssr: false, loading: Loading });
const BlockedOtp = dynamic(() => import('./screens/Orders').then((m) => function B() { return <m.BlockedScreen kind="otp" />; }), { ssr: false, loading: Loading });

const base = {
  stats: L(() => import('./screens/Stats'), 'StatsScreen'),
  orders: Orders,
  abandoned: Abandoned,
  blocked_orders: BlockedOrders,
  blocked_otp: BlockedOtp,
  customers: L(() => import('./screens/Orders'), 'CustomersScreen'),
  newsletter: L(() => import('./screens/Orders'), 'NewsletterScreen'),
};

/* أي شاشة غير موجودة بعد تعرض "قريباً" بدل ما الصفحة تقع */
export const SCREENS = new Proxy(base, { get: (t, k) => (k in t ? t[k] : Soon) });
