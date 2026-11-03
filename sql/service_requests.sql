-- طلبات الخدمات (معرض الخدمات + خدمات التسويق). آمن لو اتشغل أكتر من مرة. شغّله في Supabase → SQL Editor.
create table if not exists public.store_service_requests (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  service_key text not null,
  title text not null default '',
  details text,
  contact text,
  status text not null default 'new',      -- new | contacted | done | cancelled
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- لو الجدول كان موجود قبل كده بأعمدة أقل، نكمّل الناقص
alter table public.store_service_requests add column if not exists title text not null default '';
alter table public.store_service_requests add column if not exists details text;
alter table public.store_service_requests add column if not exists contact text;
alter table public.store_service_requests add column if not exists status text not null default 'new';
alter table public.store_service_requests add column if not exists admin_note text;
alter table public.store_service_requests add column if not exists updated_at timestamptz not null default now();
create index if not exists store_service_requests_store_idx on public.store_service_requests (store_id, created_at desc);
create index if not exists store_service_requests_status_idx on public.store_service_requests (status, created_at desc);

alter table public.store_service_requests enable row level security;
grant select, insert on public.store_service_requests to authenticated;
grant update on public.store_service_requests to authenticated;

-- التاجر: يضيف طلب جديد (بحالة new بس) ويشوف طلباته
drop policy if exists store_service_requests_owner_sel on public.store_service_requests;
create policy store_service_requests_owner_sel on public.store_service_requests for select to authenticated
  using (store_id = auth.uid()::text);
drop policy if exists store_service_requests_owner_ins on public.store_service_requests;
create policy store_service_requests_owner_ins on public.store_service_requests for insert to authenticated
  with check (store_id = auth.uid()::text and status = 'new');

-- الأدمن: يشوف ويعدّل كل الطلبات
drop policy if exists store_service_requests_admin on public.store_service_requests;
create policy store_service_requests_admin on public.store_service_requests for all to authenticated
  using (is_spike_admin()) with check (is_spike_admin());
