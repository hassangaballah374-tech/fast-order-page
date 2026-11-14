-- إصلاح أمان store_profiles و platform_kv (نتيجة security_audit).
-- شغّله مرة واحدة في Supabase → SQL Editor. آمن لإعادة التشغيل. السيرفر (service role) مش متأثر.

begin;

-- 1) سياسات خطيرة على store_profiles:
--    "Enable all operations" كانت بتدّي أي حد (حتى الزوار) قراءة وتعديل وحذف كل المتاجر.
--    "Public can view active stores" كانت بتكشف الموبايل والرصيد لأي زائر (المتجر العام بيقرأ بمفتاح السيرفر فمش محتاجها).
--    "Users can update own profile" مكررة مع "owner update store".
drop policy if exists "Enable all operations for store_profiles" on public.store_profiles;
drop policy if exists "Public can view active stores" on public.store_profiles;
drop policy if exists "Users can update own profile" on public.store_profiles;

-- 2) التاجر ما يقدرش يعدّل رصيده أو باقته أو عمولته أو تفعيل متجره بنفسه (حتى لو RLS سمحت له يعدّل صفّه)
create or replace function public.guard_store_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  k text;
  o jsonb; n jsonb;
  dflt text;
begin
  -- استدعاءات من داخل دوال/تريجرز تانية (الفوترة بالعمولة) والسيرفر والـ SQL Editor
  if pg_trigger_depth() > 1 then return new; end if;
  if auth.uid() is null then return new; end if;
  if public.is_spike_admin() or auth.email() = 'hassanhosny2007@gmail.com' then return new; end if;
  if exists (
    select 1 from public.admin_users a
    where a.email = auth.email()
      and ((a.permissions ->> 'manage_finance') = 'true' or (a.permissions ->> 'manage_stores') = 'true')
  ) then return new; end if;

  if tg_op = 'INSERT' then
    -- متجر جديد: يتسجل متوقف وباقة starter ورصيد صفر، والتفعيل والرصيد من الأدمن بس
    new := jsonb_populate_record(new, jsonb_build_object(
      'is_active', false, 'plan_type', 'starter', 'wallet_balance_usd', 0,
      'commission_usd', null, 'orders_used', 0, 'subscription_ends_at', null));
    select value into dflt from public.platform_kv where key = 'default_free_orders';
    if dflt ~ '^\d+$' then
      new := jsonb_populate_record(new, jsonb_build_object('free_orders_left', dflt::int));
    end if;
    return new;
  end if;

  o := to_jsonb(old); n := to_jsonb(new);
  for k in select jsonb_object_keys(n) loop
    if (k in ('id', 'user_id', 'is_active', 'plan_type', 'created_at', 'orders_used')
        or k ~* '(wallet|balance|commission|free_orders|subscription|plan_|role|is_admin|verified|blocked|banned)')
       and (o -> k) is distinct from (n -> k) then
      raise exception 'غير مسموح بتعديل الحقل % من حساب التاجر', k using errcode = '42501';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_guard_store_profiles on public.store_profiles;
create trigger trg_guard_store_profiles
  before insert or update on public.store_profiles
  for each row execute function public.guard_store_profiles();

-- 3) platform_kv: التاجر المسجل كان بيقرأ كل المفاتيح. دلوقتي بس اللي محتاجها فعلاً.
drop policy if exists "kv read" on public.platform_kv;
drop policy if exists "kv read allowed keys" on public.platform_kv;
create policy "kv read allowed keys" on public.platform_kv
  for select to authenticated
  using (key in ('theme_colors', 'commission_usd', 'payment_instructions', 'terms_text'));

commit;

-- تحقق بعد التشغيل (لازم صفين فقط للـ store_profiles بالأسماء دي بدون "Enable all..." و"Public can view..."):
-- select policyname, cmd, roles from pg_policies where tablename = 'store_profiles' order by 1;
