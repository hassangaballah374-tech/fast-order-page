import { createClient } from '@supabase/supabase-js';

/* عميل بصلاحيات كاملة: للاستخدام في السيرفر فقط (API routes وصفحات المتجر السيرفر).
   لا تستورده أبداً من ملف فيه 'use client'. */
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured'); 
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...(init || {}), cache: 'no-store' }) },
  });
}

export const ADMIN_EMAIL = 'hassanhosny2007@gmail.com';

/* تحقق من توكن المستخدم القادم من لوحة التاجر (Authorization: Bearer ...) */
export async function userFromRequest(req, sb) {
  const h = req.headers.get('authorization') || '';
  const token = h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : '';
  if (!token) return null;
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

/* الأدمن = إيميلك + الإيميل لازم يكون مؤكَّد في Supabase (وممكن إيميلات إضافية من متغير ADMIN_EMAILS مفصولة بفاصلة) */
const ADMIN_LIST = [ADMIN_EMAIL, ...String(process.env.ADMIN_EMAILS || '').split(',')].map((e) => e.trim().toLowerCase()).filter(Boolean);
export const isAdminUser = (user) => !!user && ADMIN_LIST.includes((user.email || '').toLowerCase()) && !!(user.email_confirmed_at || user.confirmed_at);
