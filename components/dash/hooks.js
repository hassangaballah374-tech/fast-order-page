'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useDash } from './ui';

/* قراءة وكتابة جدول مرتبط بالمتجر. كل التعديلات تتحفظ في Supabase فوراً ثم تتحدث الواجهة. */
export function useTable(table, { order = 'created_at', asc = false, limit = 1000, filter } = {}) {
  const { uid, say } = useDash();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const fkey = JSON.stringify(filter || {});

  const load = useCallback(async (silent) => {
    if (!uid) return;
    if (!silent) setLoading(true);
    let q = supabase.from(table).select('*').eq('store_id', uid);
    const f = JSON.parse(fkey);
    for (const [k, v] of Object.entries(f)) q = q.eq(k, v);
    if (order) q = q.order(order, { ascending: asc });
    const { data, error } = await q.limit(limit);
    if (error) { setErr(error.message); setRows([]); } else { setErr(''); setRows(data || []); }
    setLoading(false);
  }, [uid, table, order, asc, limit, fkey]);

  useEffect(() => { load(); }, [load]);

  const insert = async (row) => {
    const { data, error } = await supabase.from(table).insert([{ ...row, store_id: uid }]).select().single();
    if (error) { say(`تعذر الحفظ: ${error.message}`); return null; }
    setRows((r) => [data, ...r]);
    return data;
  };
  const update = async (id, patch) => {
    const { data, error } = await supabase.from(table).update(patch).eq('id', id).eq('store_id', uid).select().single();
    if (error) { say(`تعذر الحفظ: ${error.message}`); return null; }
    setRows((r) => r.map((x) => (x.id === id ? data : x)));
    return data;
  };
  const remove = async (id) => {
    const { error } = await supabase.from(table).delete().eq('id', id).eq('store_id', uid);
    if (error) { say(`تعذر الحذف: ${error.message}`); return false; }
    setRows((r) => r.filter((x) => x.id !== id));
    return true;
  };
  return { rows, setRows, loading, err, reload: () => load(false), refresh: () => load(true), insert, update, remove };
}

/* استدعاء API داخلي مع توكن المستخدم */
export async function api(path, body) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token || '';
  try {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body || {}) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok && !json.error) json.error = `خطأ ${res.status}`;
    return json;
  } catch (e) {
    return { ok: false, error: 'تعذر الاتصال بالسيرفر' };
  }
}

/* رفع ملف إلى bucket اسمه store-assets داخل مجلد المتجر */
export async function uploadAsset(uid, file, folder = 'misc') {
  if (!file) throw new Error('لم يتم اختيار ملف');
  if (file.size > 8 * 1024 * 1024) throw new Error('الحد الأقصى لحجم الملف 8MB');
  const ext = ((file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5)) || 'png';
  const path = `${uid}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('store-assets').upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type || undefined });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('store-assets').getPublicUrl(path);
  return { url: data.publicUrl, path, size: file.size, name: file.name, type: file.type };
}

export async function removeAsset(path) {
  if (!path) return;
  try { await supabase.storage.from('store-assets').remove([path]); } catch { /* تجاهل */ }
}

export function useInterval(fn, ms) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => { const t = setInterval(() => ref.current(), ms); return () => clearInterval(t); }, [ms]);
}

/* قراءة منتجات المتجر (تُستخدم في شاشات كثيرة) */
export function useProducts() {
  const t = useTable('products', { order: 'created_at', asc: false, limit: 2000 });
  const byId = {};
  t.rows.forEach((p) => { byId[String(p.id)] = p; });
  return { ...t, byId };
}
