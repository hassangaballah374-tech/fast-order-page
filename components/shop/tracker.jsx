'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/* تتبع المتجر: بكسل فيسبوك/تيك توك/سناب/GA4 + GTM. كل حدث يُرسل فقط للبكسلات التي فعّلته التاجر.
   الاستخدام من أي صفحة: track('AddToCart', { value, items:[{id,title,price,qty}] }, eventId) */

const STD = ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Lead'];
const CUR = 'EGP';

let state = null;
const pending = [];

const enabled = (px, ev) => {
  const e = px.events || {};
  return STD.includes(ev) ? e[ev] !== false : e[ev] === true;
};

function loadScript(src) {
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function initFb(id) {
  if (!window.fbq) {
    const n = function fbq() { if (n.callMethod) n.callMethod.apply(n, arguments); else n.queue.push(arguments); };
    window.fbq = n;
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
  }
  window.fbq('init', id);
}

function initTt(id) {
  if (!window.ttq) {
    const w = window;
    const ttq = (w.ttq = w.ttq || []);
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
    ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
    for (let i = 0; i < ttq.methods.length; i += 1) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (t) {
      const e = ttq._i[t] || [];
      for (let n = 0; n < ttq.methods.length; n += 1) ttq.setAndDefer(e, ttq.methods[n]);
      return e;
    };
    ttq.load = function (e, n) {
      const r = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r;
      ttq._t = ttq._t || {}; ttq._t[e] = +new Date();
      ttq._o = ttq._o || {}; ttq._o[e] = n || {};
      const o = document.createElement('script');
      o.type = 'text/javascript'; o.async = true; o.src = `${r}?sdkid=${e}&lib=ttq`;
      const a = document.getElementsByTagName('script')[0];
      a.parentNode.insertBefore(o, a);
    };
  }
  window.ttq.load(id);
}

function initSnap(id) {
  if (!window.snaptr) {
    const a = function snaptr() { if (a.handleRequest) a.handleRequest.apply(a, arguments); else a.queue.push(arguments); };
    a.queue = [];
    window.snaptr = a;
    loadScript('https://sc-static.net/scevent.min.js');
  }
  window.snaptr('init', id, {});
}

function initGa(id) {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
  }
  window.gtag('config', id, { send_page_view: false });
}

function initGtm(id) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  loadScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`);
}

const GA_NAME = { PageView: 'page_view', ViewContent: 'view_item', AddToCart: 'add_to_cart', InitiateCheckout: 'begin_checkout', Purchase: 'purchase', Lead: 'generate_lead' };
const SNAP_NAME = { PageView: 'PAGE_VIEW', ViewContent: 'VIEW_CONTENT', AddToCart: 'ADD_CART', InitiateCheckout: 'START_CHECKOUT', Purchase: 'PURCHASE', Lead: 'SIGN_UP' };
const TT_NAME = { PageView: 'PageView', ViewContent: 'ViewContent', AddToCart: 'AddToCart', InitiateCheckout: 'InitiateCheckout', Purchase: 'CompletePayment', Lead: 'SubmitForm', Contact: 'Contact' };

function send(px, name, d, eventId) {
  const items = Array.isArray(d.items) ? d.items : [];
  const value = Number(d.value) || 0;
  const ids = items.map((i) => String(i.id));
  try {
    if (px.platform === 'facebook' && window.fbq) {
      const data = { currency: CUR, value, content_type: 'product', content_ids: ids, num_items: items.reduce((a, i) => a + (Number(i.qty) || 1), 0) };
      if (items[0]) data.content_name = items[0].title;
      if (name === 'PageView') window.fbq('trackSingle', px.pixel_id, 'PageView', {}, eventId ? { eventID: eventId } : undefined);
      else if (STD.includes(name) || name === 'Contact') window.fbq('trackSingle', px.pixel_id, name, data, eventId ? { eventID: eventId } : undefined);
      else window.fbq('trackSingleCustom', px.pixel_id, name, data);
    } else if (px.platform === 'tiktok' && window.ttq) {
      const inst = window.ttq.instance(px.pixel_id);
      if (name === 'PageView') inst.page();
      else {
        inst.track(TT_NAME[name] || name, {
          value, currency: CUR, content_type: 'product',
          contents: items.map((i) => ({ content_id: String(i.id), content_name: i.title, quantity: Number(i.qty) || 1, price: Number(i.price) || 0 })),
        }, eventId ? { event_id: eventId } : undefined);
      }
    } else if (px.platform === 'snapchat' && window.snaptr) {
      const sn = SNAP_NAME[name];
      if (sn) window.snaptr('track', sn, { price: value, currency: CUR, item_ids: ids, number_items: items.length, transaction_id: name === 'Purchase' ? eventId : undefined });
    } else if (px.platform === 'ga4' && window.gtag) {
      const ga = GA_NAME[name] || name.toLowerCase();
      const payload = { send_to: px.pixel_id, currency: CUR, value, items: items.map((i) => ({ item_id: String(i.id), item_name: i.title, price: Number(i.price) || 0, quantity: Number(i.qty) || 1 })) };
      if (name === 'Purchase') payload.transaction_id = eventId || String(Date.now());
      window.gtag('event', ga, payload);
    }
  } catch { /* لا نوقف المتجر بسبب خطأ في بكسل */ }
}

function dispatch(name, d, eventId) {
  if (!state) return;
  for (const px of state.pixels) {
    if (enabled(px, name)) send(px, name, d, eventId);
  }
  if (state.gtm && window.dataLayer) {
    const items = (d.items || []).map((i) => ({ item_id: String(i.id), item_name: i.title, price: Number(i.price) || 0, quantity: Number(i.qty) || 1 }));
    window.dataLayer.push({
      event: GA_NAME[name] || name.toLowerCase(),
      event_id: eventId || undefined,
      ecommerce: { currency: CUR, value: Number(d.value) || 0, transaction_id: name === 'Purchase' ? eventId : undefined, items },
    });
  }
}

export function track(name, data = {}, eventId) {
  if (typeof window === 'undefined') return;
  if (!state) { pending.push([name, data, eventId]); return; }
  dispatch(name, data, eventId);
}

export default function Tracker({ pixels, gtm }) {
  const path = usePathname();

  useEffect(() => {
    if (state) return;
    state = { pixels: pixels || [], gtm: gtm || '' };
    const done = new Set();
    for (const px of state.pixels) {
      const k = `${px.platform}:${px.pixel_id}`;
      if (done.has(k)) continue;
      done.add(k);
      try {
        if (px.platform === 'facebook') initFb(px.pixel_id);
        else if (px.platform === 'tiktok') initTt(px.pixel_id);
        else if (px.platform === 'snapchat') initSnap(px.pixel_id);
        else if (px.platform === 'ga4') initGa(px.pixel_id);
      } catch { /* تجاهل */ }
    }
    if (state.gtm) { try { initGtm(state.gtm); } catch { /* تجاهل */ } }
    while (pending.length) { const [n, d, e] = pending.shift(); dispatch(n, d, e); }
  }, []);

  useEffect(() => { track('PageView', {}); }, [path]);

  return null;
}
