'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useDash, PageHead, Empty, Spin, Badge, Tabs } from '../ui';
import { BostaCard } from './Account';
import { supabase } from '../../../lib/supabase';

const CATS = { all: 'الكل', tracking: 'التتبع', marketing: 'التسويق', sales: 'المبيعات', shipping: 'الشحن', other: 'أخرى' };

/* معرض التطبيقات: كتالوج يديره الأدمن، والتاجر يثبّت منه أو يطلب تفعيل المتاح قريباً. */
export function AppsScreen() {
  const { uid, say, go } = useDash();
  const [apps, setApps] = useState(null);
  const [mine, setMine] = useState([]);
  const [cat, setCat] = useState('all');
  const [busy, setBusy] = useState('');

  const load = async () => {
    const [a, b] = await Promise.all([
      supabase.from('platform_apps').select('*').eq('enabled', true).order('sort_order'),
      supabase.from('store_apps').select('*').eq('store_id', String(uid)),
    ]);
    setApps(a.data || []);
    setMine(b.data || []);
  };
  useEffect(() => { if (uid) load(); }, [uid]);

  const statusOf = (key) => mine.find((m) => m.app_key === key)?.status || '';

  const act = async (app, kind) => {
    setBusy(app.key);
    let error;
    if (kind === 'remove') ({ error } = await supabase.from('store_apps').delete().eq('store_id', String(uid)).eq('app_key', app.key));
    else ({ error } = await supabase.from('store_apps').insert([{ store_id: String(uid), app_key: app.key, status: kind === 'request' ? 'requested' : 'installed' }]));
    setBusy('');
    if (error) { say(error.message); return; }
    say(kind === 'remove' ? 'تم إلغاء التثبيت' : kind === 'request' ? '✅ تم إرسال طلبك للإدارة' : '✅ تم تثبيت التطبيق');
    load();
  };

  const list = useMemo(() => (apps || []).filter((a) => cat === 'all' || a.category === cat), [apps, cat]);
  const installed = (apps || []).filter((a) => statusOf(a.key) === 'installed');

  return (
    <>
      <PageHead title="التطبيقات" sub="التكاملات والإضافات لمتجرك" />
      <div style={{ display: 'grid', gap: 16 }}>
        <BostaCard />

        {installed.length > 0 && (
          <div className="card">
            <h3>تطبيقاتي ({installed.length})</h3>
            <div className="chips">
              {installed.map((a) => (
                <button key={a.key} type="button" className="chip act" onClick={() => (a.screen ? go(a.screen) : null)} disabled={!a.screen}>{a.icon} {a.name}</button>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <Tabs value={cat} onChange={setCat} tabs={Object.entries(CATS)} />
          {apps === null ? <div className="c"><Spin /></div> : list.length === 0 ? <Empty icon="🧩" t="لا توجد تطبيقات في هذا القسم" /> : list.map((a) => {
            const st = statusOf(a.key);
            return (
              <div className="pls" key={a.key}>
                <span style={{ fontSize: 24 }}>{a.icon}</span>
                <p>
                  <b>{a.name}</b>{' '}
                  {st === 'installed' ? <Badge c="#16a34a">مثبّت</Badge> : st === 'requested' ? <Badge c="#d97706">طلبك قيد المراجعة</Badge> : a.coming_soon ? <Badge c="#718096">قريباً</Badge> : null}
                  <small>{a.description}</small>
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {st === 'installed' && a.screen ? <button type="button" className="btn sm p" onClick={() => go(a.screen)}>فتح الإعدادات</button> : null}
                  {st === 'installed' ? <button type="button" className="btn sm" disabled={busy === a.key} onClick={() => act(a, 'remove')}>إلغاء التثبيت</button> : null}
                  {!st && !a.coming_soon ? <button type="button" className="btn sm p" disabled={busy === a.key} onClick={() => act(a, 'install')}>تثبيت</button> : null}
                  {!st && a.coming_soon ? <button type="button" className="btn sm" disabled={busy === a.key} onClick={() => act(a, 'request')}>اطلب تفعيله</button> : null}
                  {st === 'requested' ? <button type="button" className="btn sm" disabled={busy === a.key} onClick={() => act(a, 'remove')}>إلغاء الطلب</button> : null}
                </div>
              </div>
            );
          })}
          <small className="hint">التثبيت يضيف التطبيق لقائمة «تطبيقاتي» للوصول السريع لإعداداته. أدوات التتبع والتسويق تعمل من شاشة إعداداتها.</small>
        </div>
      </div>
    </>
  );
}
