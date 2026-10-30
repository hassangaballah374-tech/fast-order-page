'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { STYLE_DEFAULT, SECTION_DEFS } from '../../lib/lpSections';
import { track } from './tracker';
import { FONTS_ALL, fontHref } from '../../lib/themes100';

const toOrder = () => { track('LandingCTA', {}); document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
const okLink = (u) => /^(https?:\/\/|\/|#|tel:|mailto:)/i.test(String(u || '').trim());
const hex = (v) => /^#[0-9a-fA-F]{3,8}$/.test(String(v || ''));

function Rv({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`lp-rv ${on ? 'on' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

/* عدّاد أرقام متحرك */
function CountUp({ to, suffix }) {
  const ref = useRef(null);
  const target = Number(to) || 0;
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setN(target); return undefined; }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / 1500);
        setN(Math.round(target * (1 - (1 - k) ** 3)));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target]);
  return <b ref={ref} className="num">{n.toLocaleString('en')}{suffix || ''}</b>;
}

/* رسم الأقسام الجديدة. يرجع null لو النوع غير معروف هنا */
export function renderBlock(s) {
  const d = s.data || {};
  switch (s.type) {
    case 'heading':
      return (
        <section className="lp-sec lp-n lp-hdg" data-size={d.size || 'lg'} data-align={d.align || 'center'}>
          <Rv><h2 className="lp-h2">{d.title}</h2>{d.sub ? <p className="lp-sub">{d.sub}</p> : null}</Rv>
        </section>
      );
    case 'button': {
      const cls = `lp-btn lp-btn-${d.variant || 'solid'} lp-btn-${d.size || 'lg'}`;
      const al = d.align || 'center';
      return (
        <section className="lp-sec lp-n lp-brow" style={{ textAlign: al }}>
          <Rv>
            {okLink(d.link)
              ? <a className={cls} href={d.link} target={/^https?:/i.test(d.link) ? '_blank' : undefined} rel="noopener noreferrer">{d.text || 'اضغط هنا'} <span aria-hidden="true">←</span></a>
              : <button type="button" className={cls} onClick={toOrder}>{d.text || 'اطلب الآن'} <span aria-hidden="true">←</span></button>}
          </Rv>
        </section>
      );
    }
    case 'split': {
      const pts = (d.points || []).map((x) => (typeof x === 'string' ? x : x.t)).filter(Boolean);
      return (
        <section className="lp-sec lp-m">
          <div className="lp-split" data-side={d.side || 'right'}>
            <Rv className="lp-split-t">
              {d.title ? <h2>{d.title}</h2> : null}
              {d.body ? <p className="lp-body">{d.body}</p> : null}
              {pts.length ? <ul className="lp-pts">{pts.map((t, i) => <li key={i}>{t}</li>)}</ul> : null}
              {d.cta ? <button type="button" className="lp-btn" onClick={toOrder} style={{ maxWidth: 320 }}>{d.cta} <span aria-hidden="true">←</span></button> : null}
            </Rv>
            {d.image ? <Rv className="lp-split-i" delay={120}><img className="lp-img" src={d.image} alt={d.title || ''} loading="lazy" decoding="async" /></Rv> : null}
          </div>
        </section>
      );
    }
    case 'stats':
      return (
        <section className="lp-sec lp-n">
          {d.title ? <Rv><h2 className="lp-h2">{d.title}</h2></Rv> : null}
          <div className="lp-stats">
            {(d.items || []).map((it, i) => <Rv key={i} delay={i * 80}><div className="lp-stat"><CountUp to={it.num} suffix={it.suffix} /><span>{it.label}</span></div></Rv>)}
          </div>
        </section>
      );
    case 'steps':
      return (
        <section className="lp-sec lp-m">
          {d.title ? <Rv><h2 className="lp-h2">{d.title}</h2></Rv> : null}
          <div className="lp-steps">
            {(d.items || []).map((it, i) => <Rv key={i} delay={i * 90}><div className="lp-step"><i>{i + 1}</i><b>{it.title}</b>{it.text ? <p>{it.text}</p> : null}</div></Rv>)}
          </div>
        </section>
      );
    case 'compare':
      return (
        <section className="lp-sec lp-n">
          {d.title ? <Rv><h2 className="lp-h2">{d.title}</h2></Rv> : null}
          <Rv>
            <div className="lp-cmp">
              <div className="lp-cmp-r"><div /><div>{d.us || 'منتجنا'}</div><div>{d.them || 'غيرنا'}</div></div>
              {(d.rows || []).map((r, i) => (
                <div className="lp-cmp-r" key={i}><div>{r.t}</div><div>{r.us ? <span className="lp-yes">✓</span> : <span className="lp-no">✕</span>}</div><div>{r.them ? <span className="lp-yes">✓</span> : <span className="lp-no">✕</span>}</div></div>
              ))}
            </div>
          </Rv>
        </section>
      );
    case 'logos':
      return (
        <section className="lp-sec lp-n">
          {d.title ? <Rv><h2 className="lp-h2">{d.title}</h2></Rv> : null}
          <Rv>
            <div className="lp-logos">
              {(d.items || []).map((it, i) => <span className="lp-lg" key={i}>{it.image ? <img src={it.image} alt="" loading="lazy" /> : <i style={{ fontStyle: 'normal' }}>{it.icon}</i>}{it.text}</span>)}
            </div>
          </Rv>
        </section>
      );
    case 'marquee': {
      const parts = String(d.text || '').split('✦').map((x) => x.trim()).filter(Boolean);
      const row = (k) => parts.map((t, i) => <span key={`${k}${i}`}>{t} ✦</span>);
      const sp = Math.max(8, Math.min(90, Number(d.speed) || 28));
      return (
        <div className="lp-mq" dir="ltr" aria-label={parts.join(' - ')}>
          <div className="lp-mq-t" dir="rtl" style={{ '--lp-mq': `${sp}s` }}>{row('a')}{row('b')}{row('c')}{row('d')}</div>
        </div>
      );
    }
    case 'quote':
      return (
        <section className="lp-sec lp-n">
          <Rv>
            <figure className="lp-qt" style={{ margin: '0 auto' }}>
              <blockquote>{d.text}</blockquote>
              <figcaption>{d.image ? <img src={d.image} alt="" loading="lazy" /> : null}{d.name}</figcaption>
            </figure>
          </Rv>
        </section>
      );
    case 'box':
      return (
        <section className="lp-sec lp-n">
          <Rv>
            <div className="lp-box" data-v={d.variant || 'soft'} data-size={d.size || 'md'} data-weight={d.weight || 'normal'} data-align={d.align || 'right'}>
              {d.icon ? <i className="lp-box-i" aria-hidden="true">{d.icon}</i> : null}
              <div className="lp-box-t">{d.title ? <b>{d.title}</b> : null}{d.body ? <p>{d.body}</p> : null}</div>
            </div>
          </Rv>
        </section>
      );
    case 'spacer':
      return <div aria-hidden="true" style={{ height: Math.max(0, Math.min(400, Number(d.h) || 40)) }} />;
    case 'divider':
      return (
        <section className="lp-sec lp-n" style={{ paddingBlock: 14 }}>
          {d.kind === 'dots' ? <div className="lp-dv lp-dv-dots" /> : d.kind === 'star' ? <div className="lp-dv lp-dv-star" /> : d.kind === 'wave' ? <div className="lp-dv-wave" /> : <div className="lp-dv"><hr /></div>}
        </section>
      );
    default:
      return null;
  }
}

/* غلاف القسم: الخلفية والمسافات والمحاذاة والعرض والحركة والإخفاء حسب الجهاز + الخط */
export function SectionWrap({ s, builder, picked, onPick, children }) {
  const st = { ...STYLE_DEFAULT, ...(s.style || {}) };
  const style = {};
  if (st.bg === 'custom' && hex(st.bgColor)) style['--lp-sbg'] = st.bgColor;
  if (hex(st.color)) { style['--lp-text'] = st.color; style.color = st.color; }
  const font = FONTS_ALL.includes(st.font) ? st.font : '';
  if (font) style.fontFamily = `'${font}', 'Cairo', system-ui, sans-serif`;
  if (st.radius !== '' && st.radius != null && !Number.isNaN(Number(st.radius))) style['--lp-r'] = `${Math.max(0, Math.min(40, Number(st.radius)))}px`;
  const cls = ['lp-s', st.hideM && 'lp-hide-m', st.hideD && 'lp-hide-d', builder && picked && 'lp-picked'].filter(Boolean).join(' ');
  const id = st.anchor ? String(st.anchor).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) : undefined;
  return (
    <div
      id={id || undefined} className={cls} data-sid={s.id} data-label={SECTION_DEFS[s.type]?.n || ''}
      data-bg={st.bg || undefined} data-pad={st.pad || 'md'} data-align={st.align || undefined} data-w={st.width || undefined} data-anim={st.anim || 'drop'}
      style={style}
      onClickCapture={builder ? (e) => { e.preventDefault(); e.stopPropagation(); onPick(s.id); } : undefined}
    >
      {font ? <link rel="stylesheet" href={fontHref(font)} /> : null}
      {children}
    </div>
  );
}

/* جسر المحرر: يستقبل المسودة من لوحة التحكم عبر postMessage ويعرضها فوراً */
export function useBuilderBridge(fnProp) {
  const [live, setLive] = useState(null);
  const [sel, setSel] = useState('');
  const [builder, setBuilder] = useState(false);
  useEffect(() => {
    let on = false;
    try { on = new URLSearchParams(window.location.search).get('builder') === '1' && window.parent !== window; } catch { /* تجاهل */ }
    if (!on) return undefined;
    setBuilder(true);
    const h = (e) => {
      if (e.origin !== window.location.origin || !e.data || !e.data.spk) return;
      const m = e.data;
      if (m.spk === 'draft') setLive({ sections: m.sections, theme: m.theme, settings: m.settings });
      if (m.spk === 'select') {
        setSel(m.id);
        setTimeout(() => { const el = document.querySelector(`[data-sid="${m.id}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60);
      }
    };
    window.addEventListener('message', h);
    window.parent.postMessage({ spk: 'ready' }, window.location.origin);
    return () => window.removeEventListener('message', h);
  }, []);
  const fn = useMemo(() => (live ? { ...fnProp, sections: live.sections, theme: live.theme, settings: live.settings } : fnProp), [fnProp, live]);
  const pick = (id) => { setSel(id); try { window.parent.postMessage({ spk: 'pick', id }, window.location.origin); } catch { /* تجاهل */ } };
  return { fn, sel, builder, pick };
}
