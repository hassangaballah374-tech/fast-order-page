'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { PageHead, Empty } from './ui';

const Loading = () => <div className="card"><p className="mut">جاري التحميل...</p></div>;
const L = (loader, name) => dynamic(() => loader().then((m) => m[name]), { ssr: false, loading: Loading });

function Soon() {
  return (
    <>
      <PageHead title="قريباً" sub="هذه الشاشة قيد التجهيز" />
      <div className="card"><Empty icon="🛠️" t="هذه الشاشة قيد التجهيز" /></div>
    </>
  );
}

const BlockedOrders = dynamic(() => import('./screens/Orders').then((m) => function B() { return <m.BlockedScreen kind="order" />; }), { ssr: false, loading: Loading });
const BlockedOtp = dynamic(() => import('./screens/Orders').then((m) => function B() { return <m.BlockedScreen kind="otp" />; }), { ssr: false, loading: Loading });

const O = () => import('./screens/Orders');
const P = () => import('./screens/Products');
const D = () => import('./screens/Design');
const T = () => import('./screens/Tracking');
const M = () => import('./screens/Marketing');
const G = () => import('./screens/Growth');
const A = () => import('./screens/Account');
const B = () => import('./screens/Billing');

const base = {
  stats: L(() => import('./screens/Stats'), 'StatsScreen'),
  orders: L(O, 'OrdersScreen'),
  abandoned: L(O, 'AbandonedScreen'),
  blocked_orders: BlockedOrders,
  blocked_otp: BlockedOtp,
  customers: L(O, 'CustomersScreen'),
  newsletter: L(O, 'NewsletterScreen'),

  products: L(P, 'ProductsScreen'),
  inventory: L(P, 'InventoryScreen'),
  flash: L(P, 'FlashScreen'),
  categories: L(P, 'CategoriesScreen'),
  reviews: L(P, 'ReviewsScreen'),
  feed: L(P, 'FeedScreen'),
  catalog: L(P, 'CatalogScreen'),

  themes: L(D, 'ThemesScreen'),
  home: L(D, 'HomeScreen'),
  pages: L(D, 'PagesScreen'),
  checkout: L(D, 'CheckoutScreen'),
  thankyou: L(D, 'ThankYouScreen'),
  blocks: L(D, 'BlocksScreen'),
  assets: L(D, 'AssetsScreen'),

  funnels: L(G, 'FunnelsScreen'),
  campaigns: L(G, 'CampaignsScreen'),
  referrals: L(G, 'ReferralsScreen'),
  reports: L(G, 'ReportsScreen'),

  pixels: L(T, 'PixelsScreen'),
  capi: L(T, 'CapiScreen'),
  gtm: L(T, 'GtmScreen'),
  utm: L(T, 'UtmScreen'),

  cross: L(M, 'CrossScreen'),
  bump: L(M, 'BumpScreen'),
  offers: L(M, 'OffersScreen'),
  coupons: L(M, 'CouponsScreen'),
  retarget: L(M, 'RetargetScreen'),
  wa: L(M, 'WaScreen'),
  verify: L(M, 'VerifyScreen'),
  merchant: L(M, 'MerchantScreen'),
  popup: L(M, 'PopupScreen'),
  freeship: L(M, 'FreeShipScreen'),
  downsell: L(M, 'DownsellScreen'),
  scarcity: L(M, 'ScarcityScreen'),

   balance: L(B, 'BalanceScreen'),
  tx: L(B, 'TxScreen'),
  plans: L(B, 'PlansScreen'),
  notifs: L(B, 'NotifsScreen'),
  shipping: L(A, 'ShippingScreen'),
  apps: L(A, 'AppsScreen'),
  services: L(A, 'ServicesScreen'),
  mservices: L(A, 'MServicesScreen'),
  affiliate: L(A, 'AffiliateScreen'),
  settings: L(A, 'SettingsScreen'),
};

/* أي شاشة غير موجودة تعرض "قريباً" بدل ما الصفحة تقع */
export const SCREENS = new Proxy(base, { get: (t, k) => (k in t ? t[k] : Soon) });
