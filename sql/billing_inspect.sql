-- فحص نظام العمولة الحالي (قراءة فقط: ما بيغيّر أي حاجة). شغّل كل استعلام لوحده في Supabase → SQL Editor وابعتلي النتايج.

-- 1) التريجرات الموجودة على جدول الطلبات
select tgname as trigger_name, pg_get_triggerdef(oid) as definition
from pg_trigger
where tgrelid = 'public.orders'::regclass and not tgisinternal;

-- 2) أي دالة بتلمس رصيد التاجر أو الطلبات المجانية (دي اللي بتخصم العمولة)
select p.proname as function_name, pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and (pg_get_functiondef(p.oid) ilike '%wallet_balance_usd%' or pg_get_functiondef(p.oid) ilike '%free_orders_left%' or pg_get_functiondef(p.oid) ilike '%commission%');

-- 3) جداول فيها كلمة commission أو ledger أو billing
select table_name from information_schema.tables
where table_schema = 'public' and (table_name ilike '%commission%' or table_name ilike '%ledger%' or table_name ilike '%billing%');

-- 4) أعمدة جدول الطلبات
select column_name, data_type from information_schema.columns where table_schema = 'public' and table_name = 'orders' order by ordinal_position;

-- 5) قيمة العمولة المحفوظة حالياً في إعدادات المنصة
select key, value from platform_kv where key in ('commission_usd');
