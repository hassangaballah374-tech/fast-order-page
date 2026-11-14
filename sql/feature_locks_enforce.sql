-- قفل الميزات من السيرفر: لحد دلوقتي القفل كان بيخفي الشاشة بس، والتاجر التقني كان يقدر يكتب إعدادات الميزة المقفولة مباشرة.
-- دلوقتي قاعدة البيانات نفسها بترفض تعديل إعدادات أي ميزة مقفولة لحساب التاجر (الأدمن والسيرفر مستثنيين).
-- نفس ترتيب الأولوية في لوحة الأدمن: استثناء التاجر ← قفل الباقة ← القفل العام. «الرئيسية» و«الإعدادات» ما بيتقفلوش.
-- شغّله مرة واحدة في Supabase → SQL Editor. آمن لإعادة التشغيل.

begin;

-- ربط كل ميزة بقسم الإعدادات اللي بتكتب فيه (تقدر تزوّد صفوف هنا بعدين)
create table if not exists public.feature_config_keys (
  feature_id text not null,
  config_key text not null,
  primary key (feature_id, config_key)
);
alter table public.feature_config_keys enable row level security;
revoke all on public.feature_config_keys from anon, authenticated;

insert into public.feature_config_keys (feature_id, config_key) values
  ('looks', 'looks'), ('fitting', 'fitting'), ('showcases', 'showcases'), ('sizing', 'sizing'),
  ('browse', 'browse'), ('popup', 'popup'), ('retarget', 'retarget'), ('cross', 'cross'),
  ('verify', 'verify'), ('feed', 'feed'), ('scarcity', 'scarcity'), ('downsell', 'downsell'),
  ('checkout', 'checkout'), ('thankyou', 'thankyou'), ('home', 'home'), ('catalog', 'catalog'),
  ('wa', 'whatsapp'), ('wa', 'wa_templates')
on conflict do nothing;

-- نفس منطق isLocked في lib/featureLocks.js
create or replace function public.feature_is_locked(p_uid text, p_feature text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  j jsonb; s jsonb; plan text;
begin
  if p_feature is null or p_feature in ('stats', 'settings') then return false; end if;
  select value::jsonb into j from public.platform_kv where key = 'feature_locks';
  if j is null then return false; end if;
  s := j -> 'stores' -> p_uid;
  if s is not null then
    if coalesce(s -> 'allow', '[]'::jsonb) ? p_feature then return false; end if;
    if coalesce(s -> 'lock', '[]'::jsonb) ? p_feature then return true; end if;
  end if;
  select plan_type into plan from public.store_profiles where user_id::text = p_uid limit 1;
  if plan is not null and coalesce(j -> 'plans' -> plan, '[]'::jsonb) ? p_feature then return true; end if;
  return coalesce(j -> 'global', '[]'::jsonb) ? p_feature;
exception when others then
  return false;  -- لو الإعدادات تالفة ما نقفلش حد بالغلط
end;
$$;
revoke all on function public.feature_is_locked(text, text) from public, anon, authenticated;

create or replace function public.guard_store_config_locks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  o jsonb; n jsonb;
begin
  if pg_trigger_depth() > 1 then return new; end if;
  if auth.uid() is null then return new; end if;
  if public.is_spike_admin() or auth.email() = 'hassanhosny2007@gmail.com' then return new; end if;
  if exists (
    select 1 from public.admin_users a
    where a.email = auth.email()
      and ((a.permissions ->> 'manage_finance') = 'true' or (a.permissions ->> 'manage_stores') = 'true')
  ) then return new; end if;

  o := case when tg_op = 'UPDATE' then coalesce(to_jsonb(old) -> 'config', '{}'::jsonb) else '{}'::jsonb end;
  n := coalesce(to_jsonb(new) -> 'config', '{}'::jsonb);
  for r in select feature_id, config_key from public.feature_config_keys loop
    if (o -> r.config_key) is distinct from (n -> r.config_key)
       and public.feature_is_locked(new.store_id::text, r.feature_id) then
      raise exception 'الميزة دي مقفولة لحسابك (%). تواصل مع الدعم لتفعيلها.', r.feature_id using errcode = '42501';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_guard_store_config_locks on public.store_config;
create trigger trg_guard_store_config_locks
  before insert or update on public.store_config
  for each row execute function public.guard_store_config_locks();

commit;
