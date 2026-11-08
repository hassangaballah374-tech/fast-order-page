-- فحص أمان قاعدة البيانات (قراءة فقط: ما بيغيّر أي حاجة). شغّله في Supabase → SQL Editor وابعتلي النتايج.

-- 1) جداول في schema public من غير RLS (أخطر نتيجة: أي حد بمفتاح anon يقدر يقرأ/يعدّل)
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
order by 1;

-- 2) كل السياسات اللي بتدّي صلاحية للـ anon (الزوار من غير تسجيل دخول)
select schemaname, tablename, policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public' and ('anon' = any(roles) or 'public' = any(roles))
order by tablename, cmd;

-- 3) جداول فيها بيانات حساسة: مين يقدر يقرأها؟ (لازم ما تظهرش anon للـ select على الجداول دي)
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in ('store_settings', 'store_integrations', 'platform_kv', 'orders', 'store_profiles', 'store_blocklist')
order by table_name, grantee, privilege_type;

-- 4) دوال security definer المتاحة للـ anon (لازم تكون بس اللي مقصودة للمتجر العام)
select p.proname as function_name, pg_get_userbyid(p.proowner) as owner,
       has_function_privilege('anon', p.oid, 'execute') as anon_can_execute
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by 1;
