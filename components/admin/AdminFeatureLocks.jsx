'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { api } from '../dash/hooks';
import { MENU } from '../dash/menu';
import { LOCKS_KEY, NEVER_LOCK, EMPTY_LOCKS, PLAN_TYPES, parseLocks, cleanLocks, isLocked, storeState } from '../../lib/featureLocks';

/* أدمن: قفل وتفعيل شاشات لوحة التاجر لكل التجار أو لتاجر معين (الاستثناء بيغلب الإعداد العام) */
const GROUPS = MENU.map((m) => {
  if (m.id) return { key: m.id, title: 'عام', items: [{ id: m.id, t: m.t }] };
  return { key: m.g || m.h, title: m.t || m.h, items: (m.items || []).map((x) => ({ id: x.id, t: x.t })) };
});
const SECTIONS = (() => {
  const singles = GROUPS.filter((g) => g.title === 'عام').flatMap((g) => g.items);
  return [{ key: 'single', title: 'شاشات عامة', items: singles }, ...GROUPS.filter((g) => g.title !== 'عام')];
})();

export default function AdminFeatureLocks({ isDark }) {
  const [locks, setLocks] = useState(EMPTY_LOCKS);
  const [stores, setStores] = useState([]);
  const [scope, setScope] = useState('global');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const c = isDark ? { bg: '#0A2A3E', line: '#16435D', ink: '#E8F1F8', mut: '#8FA9BC', soft: '#0F3650' } : { bg: '#FFFFFF', line: '#D6E2F0', ink: '#0F2A3D', mut: '#5B6B7A', soft: '#F2F6FF' };
  const load = useCallback(async () => {
    const [k, s] = await Promise.all([
      api('/api/platform/locks', { action: 'all' }),
      supabase.from('store_profiles').select('user_id,store_name,store_slug,plan_type').order('store_name'),
    ]);
    if (k?.ok) setLocks(parseLocks(k.locks)); else flash('تعذر تحميل الأقفال: ' + (k?.error || ''));
    setStores(s.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };
  const change = (fn) => { setLocks((l) => { const n = JSON.parse(JSON.stringify(l)); fn(n); return n; }); setDirty(true); };
  const ensure = (n, uid) => { if (!n.stores[uid]) n.stores[uid] = { lock: [], allow: [] }; return n.stores[uid]; };

  const setGlobal = (ids, lockIt) => change((n) => {
    if (scope.startsWith('plan:')) {
      const k = scope.slice(5);
      const sp = new Set((n.plans || {})[k] || []);
      ids.forEach((id) => { if (lockIt) sp.add(id); else sp.delete(id); });
      n.plans = { ...(n.plans || {}), [k]: [...sp] };
      return;
    }
    const s = new Set(n.global);
    ids.forEach((id) => { if (lockIt) s.add(id); else s.delete(id); });
    n.global = [...s];
  });
  const setStore = (ids, state) => change((n) => {
    const st = ensure(n, scope);
    ids.forEach((id) => {
      st.lock = st.lock.filter((x) => x !== id); st.allow = st.allow.filter((x) => x !== id);
      if (state === 'locked') st.lock.push(id);
      if (state === 'open') st.allow.push(id);
    });
  });

  const save = async () => {
    setBusy(true);
    const r = await api('/api/platform/locks', { action: 'save', value: cleanLocks(locks) });
    setBusy(false);
    if (!r?.ok) { flash('خطأ: ' + (r?.error || 'فشل الحفظ')); return; }
    setDirty(false); flash('تم الحفظ ✓ — التجار هيشوفوا التغيير عند فتح لوحتهم');
  };

  const planKey = scope.startsWith('plan:') ? scope.slice(5) : '';
  const isGlobal = scope === 'global' || !!planKey; /* العام والباقة بيتعدلوا بنفس الزرار (مفتوحة/مقفولة) */
  const storeName = (s) => s.store_name || s.store_slug || String(s.user_id).slice(0, 8);
  const sections = useMemo(() => SECTIONS.map((g) => ({ ...g, items: g.items.filter((it) => !q.trim() || it.t.includes(q.trim()) || g.title.includes(q.trim())) })).filter((g) => g.items.length), [q]);
  const lockedGlobal = locks.global.filter((x) => !NEVER_LOCK.includes(x)).length;

  const card = { background: c.bg, border: `1px solid ${c.line}`, borderRadius: 16, padding: 16, marginBottom: 12, color: c.ink };
  const btn = (on) => ({ padding: '6px 12px', borderRadius: 10, border: `1px solid ${c.line}`, background: on ? '#014D6F' : 'transparent', color: on ? '#fff' : c.ink, fontWeight: 700, fontSize: 12, cursor: 'pointer' });

  return (
    <div dir="rtl" style={{ display: 'grid', gap: 0 }}>
      <div style={card}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <b style={{ fontSize: 16 }}>🔒 قفل وتفعيل ميزات لوحة التاجر</b>
          <span style={{ flex: 1 }} />
          {msg ? <span style={{ fontWeight: 700, fontSize: 13 }}>{msg}</span> : null}
          <button type="button" disabled={!dirty || busy} onClick={save} style={{ ...btn(true), opacity: !dirty || busy ? 0.5 : 1, padding: '9px 20px', fontSize: 14 }}>{busy ? 'جاري الحفظ...' : 'حفظ'}</button>
        </div>
        <p style={{ color: c.mut, fontSize: 13, margin: '8px 0 12px', lineHeight: 1.7 }}>الشاشة المقفولة بتظهر عند التاجر بعلامة 🔒 ورسالة «غير مفعّلة». «الرئيسية» و«الإعدادات» مش بتتقفل. استثناء تاجر معين بيغلب الإعداد العام.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select value={scope} onChange={(e) => setScope(e.target.value)} aria-label="النطاق" style={{ padding: '9px 12px', borderRadius: 10, border: `1px solid ${c.line}`, background: c.soft, color: c.ink, fontWeight: 700, minWidth: 220 }}>
            <option value="global">🌍 كل التجار (الإعداد العام)</option>
            {PLAN_TYPES.map(([k, l]) => <option key={k} value={`plan:${k}`}>💎 باقة {l}{(locks.plans || {})[k]?.length ? ` • ${locks.plans[k].length} مقفولة` : ''}</option>)}
            {stores.map((s) => <option key={s.user_id} value={String(s.user_id)}>🏬 {storeName(s)}{(locks.stores[String(s.user_id)] ? ' • له استثناءات' : '')}</option>)}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن ميزة..." aria-label="بحث" style={{ flex: 1, minWidth: 160, padding: '9px 12px', borderRadius: 10, border: `1px solid ${c.line}`, background: c.soft, color: c.ink }} />
        </div>
        <div style={{ color: c.mut, fontSize: 12.5, marginTop: 10 }}>مقفول عند الجميع حالياً: <b className="num">{lockedGlobal}</b> ميزة{!isGlobal ? ' · أنت بتعدّل تاجر واحد بس' : planKey ? ' · أنت بتعدّل باقة كاملة (تتطبق على كل تجارها)' : ''}</div>
      </div>

      {sections.map((g) => {
        const ids = g.items.map((x) => x.id).filter((id) => !NEVER_LOCK.includes(id));
        return (
          <div key={g.key} style={card}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
              <b>{g.title}</b>
              <span style={{ flex: 1 }} />
              {ids.length > 0 && (isGlobal ? (
                <>
                  <button type="button" style={btn(false)} onClick={() => setGlobal(ids, false)}>فتح الكل</button>
                  <button type="button" style={btn(false)} onClick={() => setGlobal(ids, true)}>قفل الكل</button>
                </>
              ) : (
                <>
                  <button type="button" style={btn(false)} onClick={() => setStore(ids, 'default')}>اتباع العام</button>
                  <button type="button" style={btn(false)} onClick={() => setStore(ids, 'open')}>فتح الكل له</button>
                  <button type="button" style={btn(false)} onClick={() => setStore(ids, 'locked')}>قفل الكل عنده</button>
                </>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 8 }}>
              {g.items.map((it) => {
                const never = NEVER_LOCK.includes(it.id);
                const sPlan = ((stores.find((x) => String(x.user_id) === scope) || {}).plan_type) || 'starter';
                const globalLocked = planKey ? ((locks.plans || {})[planKey] || []).includes(it.id) : (locks.global.includes(it.id) || (!isGlobal && ((locks.plans || {})[sPlan] || []).includes(it.id)));
                const st = isGlobal ? null : storeState(locks, it.id, scope);
                const effective = !never && (planKey ? globalLocked : isLocked(locks, it.id, isGlobal ? '__none__' : scope, ((stores.find((x) => String(x.user_id) === scope) || {}).plan_type) || 'starter'));
                return (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 12, background: effective ? (isDark ? '#3a1f26' : '#FDECEC') : c.soft, border: `1px solid ${c.line}` }}>
                    <span style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{effective ? '🔒 ' : ''}{it.t}</span>
                    {never ? <small style={{ color: c.mut }}>ثابتة</small> : isGlobal ? (
                      <button type="button" onClick={() => setGlobal([it.id], !globalLocked)} aria-pressed={!globalLocked} style={btn(!globalLocked)}>{globalLocked ? 'مقفولة' : 'مفتوحة'}</button>
                    ) : (
                      <select value={st} onChange={(e) => setStore([it.id], e.target.value)} aria-label={`حالة ${it.t}`} style={{ padding: '5px 8px', borderRadius: 8, border: `1px solid ${c.line}`, background: c.bg, color: c.ink, fontSize: 12 }}>
                        <option value="default">{globalLocked ? 'يتبع العام (مقفولة)' : 'يتبع العام (مفتوحة)'}</option>
                        <option value="open">مفتوحة له</option>
                        <option value="locked">مقفولة عنده</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
