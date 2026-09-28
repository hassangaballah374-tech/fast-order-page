-- إضافة خانة لرابط الفيديو في جدول الإعدادات
alter table store_settings add column if not exists video_url text;

-- إعطاء صلاحية الرفع العام في التخزين
insert into storage.buckets (id, name, public) 
values ('products', 'products', true)
on conflict (id) do update set public = true;

create policy "Allow all uploads to products"
on storage.objects for all
using ( bucket_id = 'products' )
with check ( bucket_id = 'products' );
