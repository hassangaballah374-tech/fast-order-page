-- فهارس تسرّع لوحة التاجر والمتجر. آمنة لو اتشغلت أكتر من مرة. شغّلها في Supabase → SQL Editor.
create index if not exists orders_store_created_idx on public.orders (store_id, created_at desc);
create index if not exists orders_store_status_idx on public.orders (store_id, status);
create index if not exists products_store_status_idx on public.products (store_id, status);
create index if not exists store_blocklist_lookup_idx on public.store_blocklist (store_id, phone, kind);
create index if not exists store_integrations_store_idx on public.store_integrations (store_id, provider);
create index if not exists abandoned_carts_store_created_idx on public.abandoned_carts (store_id, created_at desc);
