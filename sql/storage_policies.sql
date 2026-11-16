-- حماية bucket الرفع store-assets: القراءة عامة (الصور بتظهر في المتجر)،
-- لكن الرفع والتعديل والحذف مسموح لصاحب الحساب في مجلده بس (المجلد الأول = رقم المستخدم).
-- + حد للحجم وأنواع الملفات المسموحة. شغّله مرة واحدة في Supabase ← SQL Editor.
-- ملاحظة: ده مش بيمسح سياسات قديمة ليك. بعد التشغيل افتح Storage ← Policies وامسح أي سياسة قديمة مفتوحة للجميع على store-assets.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-assets', 'store-assets', true, 26214400,
  array['image/jpeg','image/png','image/webp','image/gif','image/avif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = true, file_size_limit = 26214400,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "spk_assets_read" on storage.objects;
create policy "spk_assets_read" on storage.objects for select
  using (bucket_id = 'store-assets');

drop policy if exists "spk_assets_insert_own" on storage.objects;
create policy "spk_assets_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'store-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "spk_assets_update_own" on storage.objects;
create policy "spk_assets_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'store-assets' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'store-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "spk_assets_delete_own" on storage.objects;
create policy "spk_assets_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'store-assets' and (storage.foldername(name))[1] = auth.uid()::text);
