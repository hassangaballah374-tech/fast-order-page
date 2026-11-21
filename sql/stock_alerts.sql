-- «نبّهني لما يرجع»: العميل يسيب رقمه على منتج نفد، والتاجر يشوف القائمة ويبلّغه بواتساب.
-- شغّله مرة واحدة في Supabase ← SQL Editor.
create table if not exists public.stock_alerts (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  product_id text not null,
  product_title text not null default '',
  phone text not null,
  notified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (store_id, product_id, phone)
);
create index if not exists stock_alerts_store_idx on public.stock_alerts (store_id, notified, created_at desc);
alter table public.stock_alerts enable row level security;
-- الإضافة من العملاء بتتم من السيرفر فقط (service role). التاجر يقرأ ويعدّل ويحذف بتوعه بس.
drop policy if exists stock_alerts_owner on public.stock_alerts;
create policy stock_alerts_owner on public.stock_alerts for all to authenticated
  using (store_id = auth.uid()::text) with check (store_id = auth.uid()::text);
