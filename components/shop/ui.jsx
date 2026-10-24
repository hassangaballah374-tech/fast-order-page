'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useShop } from './StoreContext';
import { track } from './tracker';
import { useFavs } from './favs';
import { money, effectivePrice, saleActive, safeUrl, youtubeId } from '../../lib/storeKit';

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const lines = (v) => (Array.isArray(v) ? v : String(v || '').split('\n')).map((x) => String(x).trim()).filter(Boolean);

export function Stars({ value = 5 }) {
  const n = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return <span className="stars" aria-label={`${n} من 5`}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>;
}

export const soldOut = (p) => p.track_stock && p.stock_quantity <= 0;

export function ProductCard({ p }) {
  const { base, cur, slug } = useShop();
  const fav = useFavs(slug);
  const price = effectivePrice(p);
  const onSale = saleActive(p) && p.compare_price > price;
  const off = onSale ? Math.round((1 - price / p.compare_price) * 100) : 0;
  const out = soldOut(p);
  return (
    <div className="pc">
      <Link href={`${base}/p/${p.id}`} className="pc-img" aria-label={p.title}>
        {p.images[0] ? <img src={p.images[0]} alt={p.title} loading="lazy" /> : null}
      </Link>
      <button type="button" className={'pc-fav' + (fav.has(p.id) ? ' on' : '')} aria-label="المفضلة" onClick={() => fav.toggle(p.id)}>{fav.has(p.id) ? '♥' : '♡'}</button>
      {out ? <span className="bdg so">نفدت الكمية</span> : off > 0 ? <span className="bdg">خصم {off}%</span> : null}
      <div className="pc-b">
        <Link href={`${base}/p/${p.id}`} className="pc-t">{p.title}</Link>
        {p.rating_count > 0 ? <div className="pc-r"><Stars value={p.rating_avg} /> <span className="mut num">{p.rating_avg} ({p.rating_count})</span></div> : null}
        <div className="pc-p">
          <b className="num">{money(price, cur)}</b>
          {onSale && <span className="old num">{money(p.compare_price, cur)}</span>}
        </div>
        <Link href={`${base}/p/${p.id}`} className="b p sm blk">{out ? 'التفاصيل' : 'اطلب الآن'}</Link>
      </div>
    </div>
  );
}

export function Countdown({ to, onEnd }) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    const end = new Date(to).getTime();
    if (!end) return undefined;
    const tick = () => {
      const d = Math.max(0, end - Date.now());
      setLeft(d);
      if (d === 0 && onEnd) onEnd();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [to]);
  if (left === null) return null;
  const s = Math.floor(left / 1000);
  const parts = [[Math.floor(s / 86400), 'يوم'], [Math.floor((s % 86400) / 3600), 'ساعة'], [Math.floor((s % 3600) / 60), 'دقيقة'], [s % 60, 'ثانية']];
  return (
    <div className="cd num" dir="ltr">
      {parts.map(([v, l]) => <div key={l}>{String(v).padStart(2, '0')}<small>{l}</small></div>)}
    </div>
  );
}

/* عناصر UI Blocks التي يضيفها التاجر */
export function Blocks({ list }) {
  const items = Array.isArray(list) ? list : [];
  if (!items.length) return null;
  return (
    <>
      {items.map((b) => {
        const c = b.content || {};
        const link = safeUrl(c.link);
        if (b.kind === 'announcement') {
          const bg = HEX.test(c.bg) ? c.bg : '#0a7f86';
          const fg = HEX.test(c.fg) ? c.fg : '#ffffff';
          const inner = <div className="bl-ann" style={{ background: bg, color: fg }}>{c.text}</div>;
          return <div className="wrap" key={b.id}>{link ? <a href={link}>{inner}</a> : inner}</div>;
        }
        if (b.kind === 'countdown') {
          if (!c.ends_at || new Date(c.ends_at).getTime() <= Date.now()) return null;
          return (
            <div className="wrap" key={b.id}>
              <div className="bl-cd">
                <h3>{c.title}</h3>
                <Countdown to={c.ends_at} />
                {link && c.button_text ? <a className="b p" href={link}>{c.button_text}</a> : null}
              </div>
            </div>
          );
        }
        if (b.kind === 'trust') {
          return (
            <div className="wrap bl" key={b.id}>
              <div className="trust">
                {lines(c.items).map((l, i) => {
                  const [ic, t, d] = l.split('|');
                  return <div className="ti" key={i}><i>{ic}</i><span><b>{t}</b><small>{d}</small></span></div>;
                })}
              </div>
            </div>
          );
        }
        if (b.kind === 'faq') {
          return (
            <div className="wrap bl bl-faq" key={b.id}>
              {lines(c.items).map((l, i) => {
                const [q, a] = l.split('|');
                return <details key={i}><summary>{q}</summary><p>{a}</p></details>;
              })}
            </div>
          );
        }
        if (b.kind === 'image') {
          if (!c.image) return null;
          const img = <img src={c.image} alt={c.alt || ''} loading="lazy" style={{ borderRadius: 'var(--r)', width: '100%' }} />;
          return <div className="wrap bl" key={b.id}>{link ? <a href={link}>{img}</a> : img}</div>;
        }
        if (b.kind === 'video') {
          const id = youtubeId(c.url);
          if (!id) return null;
          return (
            <div className="wrap bl" key={b.id}>
              {c.title ? <h3>{c.title}</h3> : null}
              <div className="vid"><iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title={c.title || 'video'} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" /></div>
            </div>
          );
        }
        if (b.kind === 'text') {
          return (
            <div className="wrap bl" key={b.id}>
              {c.title ? <h3>{c.title}</h3> : null}
              <p className="desc">{c.body}</p>
            </div>
          );
        }
        return null;
      })}
    </>
  );
}

export function NewsletterForm({ title, subtitle }) {
  const { slug } = useShop();
  const [v, setV] = useState('');
  const [hp, setHp] = useState('');
  const [st, setSt] = useState({ busy: false, msg: '', ok: false });
  const send = async (e) => {
    e.preventDefault();
    setSt({ busy: true, msg: '', ok: false });
    try {
      const r = await fetch('/api/store/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, contact: v, hp }) });
      const j = await r.json();
      if (j.ok) { setSt({ busy: false, msg: 'تم الاشتراك بنجاح، شكراً لك 💚', ok: true }); setV(''); track('Lead', {}); } else setSt({ busy: false, msg: j.error || 'تعذر الاشتراك', ok: false });
    } catch { setSt({ busy: false, msg: 'تعذر الاتصال، حاول مرة أخرى', ok: false }); }
  };
  return (
    <div className="card center">
      <h3>{title}</h3>
      {subtitle ? <p className="mut" style={{ marginBottom: 12 }}>{subtitle}</p> : null}
      <form onSubmit={send} className="cpn" style={{ maxWidth: 440, margin: '12px auto 0' }}>
        <input className="in" placeholder="بريدك الإلكتروني أو رقم موبايلك" value={v} onChange={(e) => setV(e.target.value)} />
        <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} />
        <button type="submit" className="b p" disabled={st.busy || !v.trim()}>{st.busy ? '...' : 'اشترك'}</button>
      </form>
      {st.msg ? <p className={st.ok ? 'okm' : 'err'} style={{ marginTop: 10 }}>{st.msg}</p> : null}
    </div>
  );
}
