'use client';
import React, { useMemo, useState } from 'react';
import { SHOP_CSS } from '../shop/style';
import { THEMES } from '../../lib/storeKit';
import { THEME_CATS, allThemeCss, FONTS_ALL } from '../../lib/themes100';

/* اختيار الثيم: بحث + تصنيفات + معاينة حية مصغّرة لكل ثيم بنفس CSS المتجر الحقيقي */
const fontsHref = `https://fonts.googleapis.com/css2?${FONTS_ALL.map((f) => `family=${f.replace(/ /g, '+')}`).join('&')}&display=swap`;
const onColor = (hex) => {
  const m = String(hex).replace('#', ''); const f = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111111' : '#ffffff';
};

function Mini({ t }) {
  const style = {
    '--c': t.color, '--onc': onColor(t.color), '--bg': t.bg, '--card': t.card, '--ink': t.ink, '--mut': t.mut, '--ln': t.ln,
    '--r': `${t.radius}px`, '--cols': 2, '--font': `'${t.font}'`,
    width: 330, minHeight: 0, zoom: 0.5, pointerEvents: 'none', fontFamily: `'${t.font}', sans-serif`, padding: 12, color: t.ink, background: t.bg,
  };
  return (
    <div className="spk soft" data-p={t.p || 'clean'} data-pat={t.pat || 'none'} style={style} dir="rtl">
      <div className="hd" style={{ position: 'static', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', marginBottom: 10 }}>
        <b className="logo" style={{ fontSize: 18 }}>متجري</b>
        <span style={{ marginInlineStart: 'auto', fontSize: 13, color: t.mut }}>السلة 🛒</span>
      </div>
      <div className="hero" style={{ marginTop: 0, marginBottom: 12 }}>
        <div className="hero-in" style={{ padding: '22px 18px' }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>عروض الموسم</h1>
          <p style={{ margin: '6px 0 12px', fontSize: 13 }}>خصم حتى 40%</p>
          <span className="b" style={{ display: 'inline-block', padding: '7px 16px', fontSize: 13 }}>تسوّق الآن</span>
        </div>
      </div>
      <div className="sh" style={{ marginBottom: 8 }}><h2 style={{ fontSize: 18, margin: 0 }}>الأكثر مبيعاً</h2></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[1, 2].map((i) => (
          <div className="pc" key={i}>
            <div className="pc-img" style={{ aspectRatio: '4/3' }} />
            <div className="pc-b">
              <div className="pc-t" style={{ minHeight: 0 }}>منتج رقم {i}</div>
              <div className="pc-p"><b>199 ج.م</b></div>
              <span className="b p" style={{ display: 'block', textAlign: 'center', padding: '6px 0', fontSize: 12, marginTop: 4 }}>اطلب الآن</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ThemePicker({ value, onPick }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('الكل');
  const css = useMemo(() => `${SHOP_CSS}\n${allThemeCss()}`, []);
  const list = useMemo(() => THEMES.filter((t) => (cat === 'الكل' || t.cat === cat) && (!q.trim() || `${t.name} ${t.desc} ${t.cat}`.includes(q.trim()))), [q, cat]);
  return (
    <div style={{ marginTop: 16 }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <link rel="stylesheet" href={fontsHref} />
      <h3 style={{ marginBottom: 8 }}>🎨 اختر الثيم <small className="mut">({list.length} من {THEMES.length})</small></h3>
      <input
        className="in" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن ثيم: ذهبي، نيون، أطفال، مينيمال…"
        style={{ width: '100%', marginBottom: 10 }}
      />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {THEME_CATS.map((c) => (
          <button key={c} type="button" onClick={() => setCat(c)} className={'btn sm' + (cat === c ? ' p' : '')}>{c}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
        {list.map((t) => {
          const act = value === t.id;
          return (
            <button
              key={t.id} type="button" onClick={() => onPick(t)}
              style={{ textAlign: 'start', padding: 8, borderRadius: 16, cursor: 'pointer', background: 'var(--card, #fff)', border: act ? '2.5px solid #0a7f86' : '1.5px solid rgba(0,0,0,.1)', boxShadow: act ? '0 0 0 4px rgba(10,127,134,.15)' : 'none' }}
            >
              <div style={{ height: 200, overflow: 'hidden', borderRadius: 10, background: t.bg }}><Mini t={t} /></div>
              <b style={{ display: 'block', marginTop: 8 }}>{act ? '✓ ' : ''}{t.name}</b>
              <small className="mut" style={{ display: 'block' }}>{t.desc} · {t.cat}</small>
            </button>
          );
        })}
        {!list.length && <p className="mut">مفيش ثيم بالاسم ده، جرّب كلمة تانية.</p>}
      </div>
    </div>
  );
}
