'use client';
import React, { useEffect, useState } from 'react';
import { useDash, Field, Spin, Tog, CopyBtn } from '../ui';
import { supabase } from '../../../lib/supabase';

/* واتساب كلاود: إرسال رسالة تأكيد الطلب تلقائياً + العميل يضغط «تأكيد» أو «إلغاء» فيتحدّث الطلب لوحده */
const RECOVER_SAMPLE = 'أهلاً {{1}} 👋\nلسه عندك منتجات مستنياك في سلة {{2}}.\nكمّل طلبك من هنا: {{3}}';
const SAMPLE = 'أهلاً {{1}} 👋\nطلبك رقم {{2}} بإجمالي {{3}} جنيه وصلنا.\nتحب نأكد الطلب؟';

export function WaCloudCard() {
  const { uid, say } = useDash();
  const [row, setRow] = useState(undefined);
  const [f, setF] = useState({ phone_number_id: '', template_name: '', template_lang: 'ar' });
  const [token, setToken] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [auto, setAuto] = useState(true);
  const [rec, setRec] = useState({ on: false, tpl: '', lang: 'ar', mins: 60 });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('store_integrations').select('*').eq('store_id', uid).eq('provider', 'whatsapp_cloud').maybeSingle();
    setRow(data || null);
    setEnabled(!!data?.enabled);
    setAuto(data?.config?.auto_confirm !== false);
    setRec({ on: !!data?.config?.auto_recover, tpl: data?.config?.recover_template || '', lang: data?.config?.recover_lang || 'ar', mins: data?.config?.recover_after_min || 60 });
    setF({ phone_number_id: data?.config?.phone_number_id || '', template_name: data?.config?.template_name || '', template_lang: data?.config?.template_lang || 'ar' });
  };
  useEffect(() => { if (uid) load(); }, [uid]);

  const has = !!row?.config?.access_token;
  const save = async () => {
    if (enabled && (!f.phone_number_id.trim() || !f.template_name.trim() || (!token.trim() && !has))) { say('أكمل: Phone number ID واسم القالب والـ Access token'); return; }
    if (rec.on && !rec.tpl.trim()) { say('اكتب اسم قالب استرجاع السلة أو اقفل الخيار'); return; }
    setBusy(true);
    const config = { ...(row?.config || {}), phone_number_id: f.phone_number_id.trim(), template_name: f.template_name.trim(), template_lang: f.template_lang.trim() || 'ar', auto_confirm: auto, auto_recover: rec.on, recover_template: rec.tpl.trim(), recover_lang: rec.lang.trim() || 'ar', recover_after_min: Math.min(1440, Math.max(15, parseInt(rec.mins, 10) || 60)) };
    if (token.trim()) config.access_token = token.trim();
    if (appSecret.trim()) config.app_secret = appSecret.trim();
    if (!config.webhook_secret) config.webhook_secret = (globalThis.crypto?.randomUUID?.() || `${Date.now()}${Math.random()}`).replace(/-/g, '');
    const { error } = await supabase.from('store_integrations').upsert({ store_id: uid, provider: 'whatsapp_cloud', enabled, config, updated_at: new Date().toISOString() }, { onConflict: 'store_id,provider' });
    setBusy(false);
    if (error) { say(`تعذر الحفظ: ${error.message}`); return; }
    setToken(''); setAppSecret(''); say('✅ تم الحفظ'); load();
  };

  const wh = row?.config?.webhook_secret && typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/whatsapp?s=${uid}` : '';
  return (
    <div className="card">
      <div className="appc">
        <div className="top2">
          <span className="ai">💬</span>
          <div style={{ flex: 1 }}><b>واتساب — تأكيد الطلبات تلقائياً (WhatsApp Cloud API)</b><p>أول ما يوصل طلب، العميل يجيله رسالة فيها زرّين «تأكيد» و«إلغاء»، وحالة الطلب بتتحدّث لوحدها. التكلفة بتتحسب على حسابك عند Meta.</p></div>
          <Tog on={enabled} set={setEnabled} />
        </div>
        {row === undefined ? <Spin /> : (
          <div className="fgrid">
            <Field l="Phone number ID" hint="من Meta ← WhatsApp ← API Setup"><input className="in num" dir="ltr" value={f.phone_number_id} onChange={(e) => setF({ ...f, phone_number_id: e.target.value })} /></Field>
            <Field l="Access token" hint={has ? 'محفوظ ✓ اتركه فارغاً للإبقاء عليه' : 'يُفضّل token دائم (System User)'}><input className="in num" dir="ltr" type="password" autoComplete="off" placeholder={has ? '••••••••••••' : ''} value={token} onChange={(e) => setToken(e.target.value)} /></Field>
            <Field l="App Secret (موصى به للأمان)" hint={row?.config?.app_secret ? 'محفوظ ✓ التحقق من توقيع Meta شغّال' : 'من Meta ← App settings ← Basic. بيمنع أي حد يزوّر ضغطات التأكيد والإلغاء'}><input className="in num" dir="ltr" type="password" autoComplete="off" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} placeholder={row?.config?.app_secret ? '••••••••' : ''} /></Field>
            <Field l="اسم القالب المعتمد"><input className="in num" dir="ltr" value={f.template_name} onChange={(e) => setF({ ...f, template_name: e.target.value })} placeholder="order_confirm" /></Field>
            <Field l="لغة القالب"><input className="in num" dir="ltr" value={f.template_lang} onChange={(e) => setF({ ...f, template_lang: e.target.value })} placeholder="ar" /></Field>
            <Field l="الإرسال التلقائي" full><div className="tgrow"><Tog on={auto} set={setAuto} /><span>إرسال رسالة التأكيد أول ما يتسجّل الطلب</span></div></Field>
            <Field l="استرجاع السلات المتروكة تلقائياً" full hint="يتبعت للعميل اللي كتب رقمه وماكملش الطلب، مرة واحدة فقط، خلال 3 أيام."><div className="tgrow"><Tog on={rec.on} set={(v) => setRec({ ...rec, on: v })} /><span>تفعيل الإرسال التلقائي للسلات المتروكة</span></div></Field>
            {rec.on && (
              <>
                <Field l="اسم قالب استرجاع السلة"><input className="in num" dir="ltr" value={rec.tpl} onChange={(e) => setRec({ ...rec, tpl: e.target.value })} placeholder="cart_recover" /></Field>
                <Field l="لغة القالب"><input className="in num" dir="ltr" value={rec.lang} onChange={(e) => setRec({ ...rec, lang: e.target.value })} placeholder="ar" /></Field>
                <Field l="يتبعت بعد كام دقيقة من ترك السلة" hint="من 15 دقيقة لحد 1440 (يوم)"><input className="in num" dir="ltr" type="number" min="15" max="1440" value={rec.mins} onChange={(e) => setRec({ ...rec, mins: e.target.value })} /></Field>
              </>
            )}
          </div>
        )}
        <div><button type="button" className="btn p" disabled={busy || row === undefined} onClick={save}>{busy ? '...' : 'حفظ'}</button></div>
        {wh && (
          <Field l="رابط الـ Webhook (لاستقبال ضغطة الزر)" hint="في Meta ← WhatsApp ← Configuration ← Webhook: الصق الرابط في Callback URL، والصق المفتاح تحته في Verify token، واشترك في حقل messages.">
            <div className="row" style={{ gap: 8 }}><input className="in num" dir="ltr" readOnly value={wh} onFocus={(e) => e.target.select()} /><CopyBtn text={wh} /></div>
            <div className="row" style={{ gap: 8, marginTop: 6 }}><input className="in num" dir="ltr" readOnly value={row.config.webhook_secret} onFocus={(e) => e.target.select()} /><CopyBtn text={row.config.webhook_secret} label="نسخ Verify token" /></div>
          </Field>
        )}
        {rec.on && (
          <div className="pv">
            <b>قالب استرجاع السلة (Utility، عربي، من غير أزرار):</b>
            <span style={{ whiteSpace: 'pre-line' }}>{RECOVER_SAMPLE}</span>
          </div>
        )}
        <div className="pv">
          <b>القالب لازم تنشئه وتعتمده من Meta (Message templates):</b>
          <span style={{ whiteSpace: 'pre-line' }}>{`الفئة: Utility — اللغة: عربي\nنص الرسالة:\n${SAMPLE}\nأزرار (Quick reply): «تأكيد الطلب» ثم «إلغاء الطلب» — بالترتيب ده.`}</span>
        </div>
      </div>
    </div>
  );
}
