-- ── Bảng tag người trong ảnh/video ──────────────────────────
create table if not exists public.photo_tags (
  id                uuid primary key default gen_random_uuid(),
  media_id          text not null,   -- id ảnh (gallery) hoặc video, lưu text cho chắc kiểu
  media_type        text not null check (media_type in ('image','video')),
  member_mshs       text not null,
  member_name       text,
  member_short_name text,
  tagged_by         text,            -- mshs người gắn thẻ
  created_at        timestamptz not null default now(),
  unique (media_id, media_type, member_mshs)
);

create index if not exists photo_tags_member_idx on public.photo_tags (member_mshs);
create index if not exists photo_tags_media_idx  on public.photo_tags (media_id, media_type);

-- ── RLS ─────────────────────────────────────────────────────
alter table public.photo_tags enable row level security;

create policy "photo_tags read"   on public.photo_tags for select using (true);
create policy "photo_tags insert" on public.photo_tags for insert to authenticated with check (true);

create policy "photo_tags delete" on public.photo_tags
  for delete to authenticated using (
    tagged_by    = replace(split_part(auth.jwt() ->> 'email', '@', 1), 'student', '')
    or member_mshs = replace(split_part(auth.jwt() ->> 'email', '@', 1), 'student', '')
    or exists (
      select 1 from public.members m
      where m.mshs = replace(split_part(auth.jwt() ->> 'email', '@', 1), 'student', '')
        and m.role = 'admin'
    )
  );

-- ── View gộp gallery + videos để phân trang thống nhất ở server ──────
create or replace view public.media_feed as
select 
  id::text as id,
  caption,
  category,
  image_url,
  drive_file_id,
  uploaded_by,
  uploaded_by_name,
  created_at,
  'image' as type
from public.gallery
union all
select 
  id::text as id,
  caption,
  category,
  null as image_url,
  drive_file_id,
  uploaded_by,
  uploaded_by_name,
  created_at,
  'video' as type
from public.videos;
