-- اختبار A/B لصفحات الهبوط. آمن لو اتشغل أكتر من مرة. شغّله في Supabase → SQL Editor.
create table if not exists public.store_ab_tests (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  name text not null default '',
  slug text not null,
  enabled boolean not null default true,
  variants jsonb not null default '[]'::jsonb,   -- [{id:'a', page:'slug-صفحة-الهبوط', weight:50}, ...]
  created_at timestamptz not null default now(),
  unique (store_id, slug)
);
alter table public.store_ab_tests enable row level security;
drop policy if exists store_ab_tests_owner on public.store_ab_tests;
create policy store_ab_tests_owner on public.store_ab_tests for all to authenticated
  using (store_id = auth.uid()::text) with check (store_id = auth.uid()::text);
drop policy if exists store_ab_tests_admin on public.store_ab_tests;
create policy store_ab_tests_admin on public.store_ab_tests for all to authenticated
  using (is_spike_admin()) with check (is_spike_admin());

create table if not exists public.store_ab_stats (
  store_id text not null,
  test_id text not null,
  variant text not null,
  day date not null default ((now() at time zone 'Africa/Cairo')::date),
  views int not null default 0,
  orders int not null default 0,
  revenue numeric not null default 0,
  primary key (store_id, test_id, variant, day)
);
alter table public.store_ab_stats enable row level security;
grant select, delete on public.store_ab_stats to authenticated;
drop policy if exists store_ab_stats_owner on public.store_ab_stats;
create policy store_ab_stats_owner on public.store_ab_stats for select to authenticated using (store_id = auth.uid()::text);
drop policy if exists store_ab_stats_owner_del on public.store_ab_stats;
create policy store_ab_stats_owner_del on public.store_ab_stats for delete to authenticated using (store_id = auth.uid()::text);
drop policy if exists store_ab_stats_admin on public.store_ab_stats;
create policy store_ab_stats_admin on public.store_ab_stats for all to authenticated using (is_spike_admin()) with check (is_spike_admin());

create or replace function public.bump_ab(
  p_store text, p_test text, p_variant text, p_view int, p_order int, p_revenue numeric
) returns void language sql security definer set search_path = public as $$
  insert into public.store_ab_stats (store_id, test_id, variant, day, views, orders, revenue)
  values (p_store, p_test, p_variant, (now() at time zone 'Africa/Cairo')::date,
          greatest(coalesce(p_view,0),0), greatest(coalesce(p_order,0),0), greatest(coalesce(p_revenue,0),0))
  on conflict (store_id, test_id, variant, day) do update set
    views = public.store_ab_stats.views + excluded.views,
    orders = public.store_ab_stats.orders + excluded.orders,
    revenue = public.store_ab_stats.revenue + excluded.revenue;
$$;
revoke all on function public.bump_ab(text,text,text,int,int,numeric) from public, anon, authenticated;
grant execute on function public.bump_ab(text,text,text,int,int,numeric) to service_role;
