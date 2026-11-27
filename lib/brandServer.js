import { adminClient } from './supabaseAdmin';
import { DEFAULT_BRAND, mergeBrand } from './brand';

/* هوية المنصة (اسم/شعار/أيقونة) من platform_kv. السيرفر فقط. لو حصل أي خطأ بنرجع الافتراضي. */
export async function getBrand() {
  try {
    const sb = adminClient();
    const { data } = await sb.from('platform_kv').select('value, updated_at').eq('key', 'platform_brand').maybeSingle();
    if (!data?.value) return DEFAULT_BRAND;
    let j = {}; try { j = JSON.parse(data.value) || {}; } catch { j = {}; }
    return mergeBrand({ ...j, v: String(Date.parse(data.updated_at) || '') });
  } catch { return DEFAULT_BRAND; }
}
