-- إحصائيات كل منتج (مشاهدات / سلة / بدء الشراء / شراء / وحدات / إيراد) — شغّله مرة واحدة في Supabase SQL Editor
create table if not exists public.store_product_stats (
  store_id text not null,
  product_id text not null,
  day date not null default ((now() at time zone 'Africa/Cairo')::date),
  views int not null default 0,
  carts int not null default 0,
  checkouts int not null default 0,
  purchases int not null default 0,
  units int not null default 0,
  revenue numeric not null default 0,
  primary key (store_id, product_id, day)
);
alter table public.store_product_stats enable row level security;
drop policy if exists store_product_stats_owner on public.store_product_stats;
create policy store_product_stats_owner on public.store_product_stats for select to authenticated using (store_id = auth.uid()::text);

create or replace function public.bump_product_stat(p_store text, p_product text, p_views int, p_carts int, p_checkouts int, p_purchases int, p_units int, p_revenue numeric)
returns void language sql security definer set search_path = public as $$
  insert into public.store_product_stats as s (store_id, product_id, day, views, carts, checkouts, purchases, units, revenue)
  values (p_store, p_product, (now() at time zone 'Africa/Cairo')::date, p_views, p_carts, p_checkouts, p_purchases, p_units, p_revenue)
  on conflict (store_id, product_id, day) do update set
    views = s.views + excluded.views, carts = s.carts + excluded.carts, checkouts = s.checkouts + excluded.checkouts,
    purchases = s.purchases + excluded.purchases, units = s.units + excluded.units, revenue = s.revenue + excluded.revenue;
$$;
revoke all on function public.bump_product_stat(text,text,int,int,int,int,int,numeric) from public, anon, authenticated;
grant execute on function public.bump_product_stat(text,text,int,int,int,int,int,numeric) to service_role;
