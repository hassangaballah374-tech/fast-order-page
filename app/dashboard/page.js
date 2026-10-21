'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { DashCtx, Spin, Field } from '../../components/dash/ui';
import { MENU, flatMenu, groupOf } from '../../components/dash/menu';
import { SCREENS } from '../../components/dash/registry';
import { DASH_CSS } from '../../components/dash/style';
import { DARK_CSS } from '../../components/dash/dark';
import { mergeConfig } from '../../lib/storeKit';
import { spikeLogout } from '../../components/SpikeSessionBar';
import { MerchantBell, UsageBanner } from '../../components/dash/MerchantBell';

const ADMIN_EMAIL = 'hassanhosny2007@gmail.com';
const FLAT = flatMenu();
const VALID = new Set(FLAT.map((x) => x.id));
const asciiSlug = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { e: null }; }
  static getDerivedStateFromError(e) { return { e }; }
  componentDidCatch(e) { console.error('screen error', e); }
  render() {
    if (this.state.e) {
      return (
        <div className="card errbox">
          <b>⚠️ حدث خطأ في عرض هذه الشاشة</b>
          <p className="mut" style={{ margin: '6px 0 12px' }}>{String(this.state.e?.message || this.state.e)}</p>
          <button type="button" className="btn p" onClick={() => this.setState({ e: null })}>إعادة المحاولة</button>
        </div>
      );
    }
    return this.props.children;
  }
}

async function callStoreApi(body) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token || '';
  try {
    const res = await fetch('/api/dashboard/store', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok && !json.error) json.error = `خطأ ${res.status}`;
    return json;
  } catch { return { ok: false, error: 'تعذر الاتصال بالسيرفر' }; }
}

export default function MerchantDashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [authId, setAuthId] = useState('');
  const [store, setStore] = useState(null);
  const [rawCfg, setRawCfg] = useState({});
  const [tab, setTab] = useState('stats');
  const [open, setOpen] = useState({});
  const [toast, setToast] = useState('');
  const [side, setSide] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => { try { setDark(localStorage.getItem('spike_dash_dark') === '1'); } catch { /* تجاهل */ } }, []);
  const toggleDark = () => setDark((d) => { const v = !d; try { localStorage.setItem('spike_dash_dark', v ? '1' : '0'); } catch { /* تجاهل */ } return v; });
  const [cmd, setCmd] = useState(false);
  const [cq, setCq] = useState('');
  const [origin, setOrigin] = useState('');
  const [setup, setSetup] = useState({ name: '', slug: '', busy: false });
  const rawRef = useRef({});
  const toastT = useRef(null);
  const isAdmin = email.toLowerCase() === ADMIN_EMAIL;

  const say = useCallback((m) => {
    setToast(m);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(''), 2600);
  }, []);

  /* ---------- الجلسة والمتجر ---------- */
  const loadStore = useCallback(async (id) => {
    const { data } = await supabase.from('store_profiles').select('*').eq('user_id', id).maybeSingle();
    setStore(data || null);
    return data || null;
  }, []);

  useEffect(() => {
    let off = false;
    document.title = 'لوحة التاجر | سبايك';
    setOrigin(window.location.origin);
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      if (!user) { router.replace('/register'); return; }
      if (off) return;
      const em = user.email || '';
      setEmail(em);
      setAuthId(user.id);
      let key = user.id;
      if (em.toLowerCase() === ADMIN_EMAIL) {
        try {
          const saved = localStorage.getItem('merchant_user_id');
          if (saved && saved !== 'main_flagship_owner') key = saved;
        } catch { /* تجاهل */ }
      }
      setUid(key);
      await loadStore(key);
      const { data: c } = await supabase.from('store_config').select('config').eq('store_id', key).maybeSingle();
      rawRef.current = c?.config && typeof c.config === 'object' ? c.config : {};
      if (!off) { setRawCfg(rawRef.current); setReady(true); }
    })();
    return () => { off = true; };
  }, []);

  const cfg = useMemo(() => mergeConfig(rawCfg), [rawCfg]);

  const saveCfg = useCallback(async (section, value) => {
    const next = { ...rawRef.current, [section]: value };
    const { error } = await supabase.from('store_config').upsert({ store_id: uid, config: next, updated_at: new Date().toISOString() }, { onConflict: 'store_id' });
    if (error) { say(`تعذر الحفظ: ${error.message}`); return false; }
    rawRef.current = next;
    setRawCfg(next);
    return true;
  }, [uid, say]);

  /* ---------- التنقل بين الشاشات (hash) ---------- */
  useEffect(() => {
    const read = () => {
      const h = decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
      setTab(VALID.has(h) ? h : 'stats');
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('spike_nav_open') || '{}');
      setOpen(saved && typeof saved === 'object' ? saved : {});
    } catch { /* تجاهل */ }
  }, []);

  const go = useCallback((id) => {
    if (!VALID.has(id)) return;
    window.location.hash = id;
    setTab(id);
    setSide(false);
    window.scrollTo({ top: 0 });
  }, []);

  const toggleGroup = (g) => {
    setOpen((o) => {
      const n = { ...o, [g]: !(o[g] ?? groupOf(tab) === g) };
      try { localStorage.setItem('spike_nav_open', JSON.stringify(n)); } catch { /* تجاهل */ }
      return n;
    });
  };

  useEffect(() => {
    const k = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd(true); }
      if (e.key === 'Escape') { setCmd(false); setSide(false); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  const slug = store?.store_slug || '';
  const storeUrl = slug && origin ? `${origin}/shop/${slug}` : '';

  const ctx = useMemo(() => ({
    uid, authId, email, isAdmin, store, slug, storeUrl, origin, cfg, saveCfg, say, go, tab,
    reloadStore: () => loadStore(uid),
    cur: cfg.currency || 'ج.م',
  }), [uid, authId, email, isAdmin, store, slug, storeUrl, origin, cfg, saveCfg, say, go, tab, loadStore]);

  const createStore = async () => {
    const name = setup.name.trim();
    const sl = asciiSlug(setup.slug || setup.name);
    if (name.length < 2) { say('اكتب اسم المتجر'); return; }
    if (sl.length < 3) { say('رابط المتجر لازم يكون 3 أحرف إنجليزية على الأقل'); return; }
    setSetup((s) => ({ ...s, busy: true }));
    const r = await callStoreApi({ action: 'save', store_id: uid, name, slug: sl });
    setSetup((s) => ({ ...s, busy: false }));
    if (!r.ok) { say(r.error || 'تعذر الإنشاء'); return; }
    await loadStore(uid);
    say('✅ تم إنشاء متجرك');
  };

  const cmdList = useMemo(() => {
    const q = cq.trim();
    return FLAT.filter((x) => !q || x.t.includes(q) || x.group.includes(q) || x.id.includes(q.toLowerCase())).slice(0, 12);
  }, [cq]);

  if (!ready) {
    return (
      <div className="app" dir="rtl" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <style>{DASH_CSS}</style>
        <div className="c"><Spin /><p className="mut">جاري تحميل لوحتك...</p></div>
      </div>
    );
  }

  const Screen = SCREENS[tab] || SCREENS.stats;
  const curGroup = groupOf(tab);
  const isOpen = (g) => (open[g] ?? curGroup === g);
  const initial = (store?.store_name || 'S').trim().charAt(0).toUpperCase();

  const NavItem = ({ it, sub }) => (
    <button type="button" className={'nv' + (tab === it.id ? ' act' : '')} onClick={() => go(it.id)}>
      {it.i && !sub && <span className="ic">{it.i}</span>}
      <span className="tx">{it.t}</span>
      {it.spike && <span className="spk" title="إضافة حصرية من سبايك">✦</span>}
      {it.badge && <em className={'bn' + (it.badge === 'سبايك' ? ' sp' : '')}>{it.badge}</em>}
    </button>
  );

  return (
    <DashCtx.Provider value={ctx}>
     <div className={'app' + (dark ? ' dk' : '')} dir="rtl">
      <style>{DASH_CSS + DARK_CSS}</style>
        <div className={'scrim' + (side ? ' on' : '')} onClick={() => setSide(false)} />

        <aside className={'side' + (side ? ' open' : '')} aria-label="القائمة الرئيسية">
          <div className="sidehd">
            <div className="lg">{cfg.brand.logo ? <img src={cfg.brand.logo} alt="" /> : initial}</div>
            <div style={{ minWidth: 0 }}>
              <b style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store?.store_name || 'متجري'}</b>
              <small>لوحة تحكم سبايك</small>
            </div>
          </div>
          <nav className="nvs">
            {MENU.map((m, i) => {
              if (m.id) return <NavItem key={m.id} it={m} />;
              if (m.g) {
                const o = isOpen(m.g);
                return (
                  <div key={m.g}>
                    <button type="button" className={'nv' + (o ? ' open' : '') + (curGroup === m.g && !o ? ' act' : '')} aria-expanded={o} onClick={() => toggleGroup(m.g)}>
                      <span className="ic">{m.i}</span><span className="tx">{m.t}</span><span className="chev">▾</span>
                    </button>
                    {o && <div className="nvsub">{m.items.map((it) => <NavItem key={it.id} it={it} sub />)}</div>}
                  </div>
                );
              }
              return (
                <div key={`h${i}`}>
                  <div className="nvh">{m.h}</div>
                  {m.items.map((it) => <NavItem key={it.id} it={it} />)}
                </div>
              );
            })}
          </nav>
          <div className="sidefoot">
            {storeUrl
              ? <a className="btn p" href={storeUrl} target="_blank" rel="noreferrer">🛍️ فتح متجري</a>
              : <span className="mut" style={{ fontSize: 12 }}>أنشئ متجرك لتظهر روابطه هنا</span>}
            <small className="mut" style={{ textAlign: 'center' }}>✦ = إضافة حصرية من سبايك</small>
          </div>
        </aside>

        <main className="main">
          <div className="top">
            <button type="button" className="btn menubtn" aria-label="القائمة" onClick={() => setSide(true)}>☰</button>
            <button type="button" className="srch" onClick={() => setCmd(true)}>🔎 ابحث عن أي شاشة أو إعداد… <kbd>Ctrl K</kbd></button>
            <span style={{ flex: 1 }} />
            <MerchantBell />
            {storeUrl && <a className="btn" href={storeUrl} target="_blank" rel="noreferrer">معاينة المتجر ↗</a>}
            <button type="button" className="btn p" onClick={() => go('products')}>+ منتج</button>
            {isAdmin && <button type="button" className="btn" onClick={() => router.push('/admin')}>🛡️ الإدارة</button>}
            <button type="button" className="btn dng" onClick={() => spikeLogout(router)}>🚪 خروج</button>
          </div>

          <section className="pg">
          <UsageBanner />
            {isAdmin && uid !== authId && (
              <div className="card" style={{ marginBottom: 14, background: '#fff8e8', borderColor: '#f0d9a8' }}>
                أنت تدير متجراً آخر بصلاحية الأدمن: <b>{store?.store_name || uid}</b>
              </div>
            )}
            {!store ? (
              <div className="card" style={{ maxWidth: 520, margin: '30px auto' }}>
                <h3>🏪 أنشئ متجرك أولاً</h3>
                <p className="mut">متجرك لسه غير مكتمل. اكتب اسمه ورابطه وابدأ فوراً.</p>
                <Field l="اسم المتجر"><input className="in" value={setup.name} onChange={(e) => setSetup({ ...setup, name: e.target.value, slug: setup.slug || '' })} /></Field>
                <Field l="رابط المتجر (إنجليزي)" hint={`سيكون: ${origin}/shop/${asciiSlug(setup.slug || setup.name) || 'your-store'}`}>
                  <input className="in num" dir="ltr" value={setup.slug} placeholder={asciiSlug(setup.name) || 'my-store'} onChange={(e) => setSetup({ ...setup, slug: asciiSlug(e.target.value) })} />
                </Field>
                <button type="button" className="btn p" style={{ width: '100%' }} disabled={setup.busy} onClick={createStore}>{setup.busy ? '...' : 'إنشاء المتجر'}</button>
              </div>
            ) : (
              <Boundary key={tab}><Screen /></Boundary>
            )}
          </section>
        </main>

        {cmd && (
          <div className="ov topv" onClick={() => { setCmd(false); setCq(''); }}>
            <div className="mod" onClick={(e) => e.stopPropagation()}>
              <div className="mb">
                <input
                  className="in" autoFocus placeholder="اكتب اسم الشاشة… (الطلبات، الكوبونات، البكسل)" value={cq}
                  onChange={(e) => setCq(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && cmdList[0]) { go(cmdList[0].id); setCmd(false); setCq(''); } }}
                />
                <div style={{ marginTop: 10, display: 'grid', gap: 2 }}>
                  {cmdList.map((x) => (
                    <button key={x.id} type="button" className="nv" onClick={() => { go(x.id); setCmd(false); setCq(''); }}>
                      <span className="tx">{x.t}</span><small className="mut">{x.group}</small>
                    </button>
                  ))}
                  {cmdList.length === 0 && <div className="c mut">لا توجد نتائج</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </DashCtx.Provider>
  );
}
