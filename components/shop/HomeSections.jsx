import React from 'react';
import Link from 'next/link';
import { ProductCard, Blocks, NewsletterForm, Stars } from './ui';
import { safeUrl, HOME_SECTION_TYPES } from '../../lib/storeKit';
import { orderByIds } from '../../lib/storeData';

const DEFAULT_TRUST = ['🚚|شحن سريع|لكل محافظات مصر', '💵|الدفع عند الاستلام|ادفع بعد ما تعاين طلبك', '📞|دعم عبر واتساب|نرد عليك بسرعة'];
const lines = (v) => (Array.isArray(v) ? v : String(v || '').split('\n')).map((x) => String(x).trim()).filter(Boolean);

function Head({ s }) {
  if (!s.title && !s.subtitle) return null;
  return <div className="sh">{s.title ? <h2>{s.title}</h2> : null}{s.subtitle ? <p>{s.subtitle}</p> : null}</div>;
}

function Grid({ list }) {
  return <div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>;
}

/* يعرض أقسام الصفحة الرئيسية بالترتيب الذي حدده التاجر */
export default function HomeSections({ cfg, base, products, categories, reviews, blocks, bestIds }) {
  const sections = (cfg.home.sections || []).filter((s) => s && s.enabled !== false && HOME_SECTION_TYPES[s.type]);
  const handled = new Set(sections.filter((s) => s.type === 'blocks').map((s) => s.placement || 'home_top'));
  const topBlocks = blocks.filter((b) => b.placement === 'home_top');
  const bottomBlocks = blocks.filter((b) => b.placement === 'home_bottom');
  let anchored = false;

  if (!products.length && !sections.some((s) => s.type === 'hero')) {
    return <div className="wrap empty"><div style={{ fontSize: 48 }}>🛍️</div><h2>المنتجات قادمة قريباً</h2></div>;
  }

  const byNew = [...products].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));

  return (
    <>
      {!handled.has('home_top') ? <Blocks list={topBlocks} /> : null}
      {sections.map((s) => {
        const lim = Math.max(2, Math.min(24, Number(s.limit) || 8));
        const key = s.id || s.type;
        if (s.type === 'hero') {
          const link = safeUrl(s.button_link) || '#products';
          const img = s.image || cfg.brand.banner;
          return (
            <div className="wrap" key={key}>
              <div className={'hero' + (img ? ' img' : '')} style={img ? { backgroundImage: `url(${img})` } : undefined}>
                <div className="hero-in">
                  <h1>{s.title}</h1>
                  {s.subtitle ? <p>{s.subtitle}</p> : null}
                  {s.button_text ? <a className="b" href={link}>{s.button_text}</a> : null}
                </div>
              </div>
            </div>
          );
        }
        if (s.type === 'trust') {
          const items = lines(s.items);
          return (
            <section className="wrap sec" key={key}>
              <Head s={s} />
              <div className="trust">
                {(items.length ? items : DEFAULT_TRUST).map((l, i) => { const [ic, t, d] = l.split('|'); return <div className="ti" key={i}><i>{ic}</i><span><b>{t}</b><small>{d}</small></span></div>; })}
              </div>
            </section>
          );
        }
        if (s.type === 'categories') {
          if (!categories.length) return null;
          return (
            <section className="wrap sec" key={key}>
              <Head s={s} />
              <div className="cats">
                {categories.map((c) => (
                  <Link key={c.id} href={`${base}/products?cat=${c.id}`} className="cat">
                    {c.image ? <img src={c.image} alt={c.name} loading="lazy" /> : <div className="ph">🏷️</div>}
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          );
        }
        if (s.type === 'featured' || s.type === 'bestsellers' || s.type === 'newest') {
          let list = [];
          if (s.type === 'featured') { list = products.filter((p) => p.featured); if (!list.length) list = products; }
          else if (s.type === 'bestsellers') list = orderByIds(products, bestIds);
          else list = byNew;
          list = list.slice(0, lim);
          if (!list.length) return null;
          const id = !anchored ? 'products' : undefined;
          anchored = true;
          return (
            <section className="wrap sec" key={key} id={id}>
              <Head s={s} />
              <Grid list={list} />
              <div className="center" style={{ marginTop: 16 }}><Link href={`${base}/products`} className="b">عرض كل المنتجات</Link></div>
            </section>
          );
        }
        if (s.type === 'banner') {
          const link = safeUrl(s.button_link);
          return (
            <section className="wrap sec" key={key}>
              <div className="banner">
                {s.image ? <img src={s.image} alt={s.title || ''} loading="lazy" /> : null}
                {(s.title || s.subtitle || s.button_text) ? (
                  <div className="bt">
                    {s.title ? <h3>{s.title}</h3> : null}
                    {s.subtitle ? <p className="mut">{s.subtitle}</p> : null}
                    {link && s.button_text ? <a className="b p" style={{ marginTop: 10 }} href={link}>{s.button_text}</a> : null}
                  </div>
                ) : null}
              </div>
            </section>
          );
        }
        if (s.type === 'testimonials') {
          const list = reviews.filter((r) => r.comment).slice(0, Math.max(2, Math.min(12, Number(s.limit) || 6)));
          if (!list.length) return null;
          return (
            <section className="wrap sec" key={key}>
              <Head s={s} />
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
                {list.map((r) => (
                  <div className="card" key={r.id}>
                    <Stars value={r.rating} />
                    <p style={{ margin: '8px 0' }}>{r.comment}</p>
                    <b className="mut" style={{ fontSize: 13 }}>— {r.customer_name || 'عميل'}</b>
                  </div>
                ))}
              </div>
            </section>
          );
        }
        if (s.type === 'blocks') {
          const pl = s.placement === 'home_bottom' ? 'home_bottom' : 'home_top';
          const list = blocks.filter((b) => b.placement === pl);
          if (!list.length) return null;
          return <section key={key}>{s.title ? <div className="wrap sh"><h2>{s.title}</h2></div> : null}<Blocks list={list} /></section>;
        }
        if (s.type === 'newsletter') {
          return <section className="wrap sec" key={key}><NewsletterForm title={s.title} subtitle={s.subtitle} /></section>;
        }
        return null;
      })}
      {!handled.has('home_bottom') ? <Blocks list={bottomBlocks} /> : null}
    </>
  );
}
