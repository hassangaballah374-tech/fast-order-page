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

export const isAdminUser = (user) => (user?.email || '').toLowerCase() === ADMIN_EMAIL;
