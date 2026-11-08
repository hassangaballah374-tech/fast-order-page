-- شروط إضافية للكوبونات: للطلب الأول فقط + محافظات معينة
-- شغّله مرة واحدة في Supabase → SQL Editor (آمن لو اتشغّل أكتر من مرة)
alter table public.store_coupons add column if not exists first_order_only boolean not null default false;
alter table public.store_coupons add column if not exists governorates text[];
