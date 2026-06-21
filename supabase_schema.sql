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
drop view if exists public.media_feed;
create or replace view public.media_feed as
select 
  id::text as id,
  caption,
  category,
  image_url,
  drive_file_id,
  uploaded_by,
  uploaded_by_name,
  likes,
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
  likes,
  created_at,
  'video' as type
from public.videos;

-- ── Bảng thông báo ──────────────────────────────────────────
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_mshs text not null,
  type          text not null check (type in ('tag','message')),
  actor_name    text,
  content       text,
  link          text,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists notifications_recipient_idx
  on public.notifications (recipient_mshs, created_at desc);

-- ── Trigger: có người gắn thẻ bạn vào ảnh/video ─────────────
create or replace function public.notify_on_tag()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor text;
begin
  if new.tagged_by is null or new.tagged_by = new.member_mshs then
    return new;                              -- không tự báo cho chính mình
  end if;
  select coalesce(m.short_name, m.full_name) into actor
    from public.members m where m.mshs = new.tagged_by;
  insert into public.notifications (recipient_mshs, type, actor_name, content, link)
  values (
    new.member_mshs, 'tag', coalesce(actor, 'Ai đó'),
    'đã gắn thẻ bạn vào một ' || case when new.media_type = 'video' then 'video' else 'tấm ảnh' end,
    '/gallery'
  );
  return new;
end; $$;

drop trigger if exists trg_notify_on_tag on public.photo_tags;
create trigger trg_notify_on_tag
  after insert on public.photo_tags
  for each row execute function public.notify_on_tag();

-- ── Trigger: có người gửi lưu bút cho bạn ───────────────────
create or replace function public.notify_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (recipient_mshs, type, actor_name, content, link)
  select m.mshs, 'message', new.author, left(new.content, 120), '/messages'
  from public.members m
  where m.full_name = new.recipient                    -- khớp đúng tên 1 thành viên
    and m.mshs is distinct from new.author_mshs;        -- không tự báo cho chính mình
  return new;
end; $$;

drop trigger if exists trg_notify_on_message on public.messages;
create trigger trg_notify_on_message
  after insert on public.messages
  for each row execute function public.notify_on_message();

-- ── RLS: mỗi người chỉ thấy/sửa thông báo của mình ──────────
alter table public.notifications enable row level security;

create policy "notif read own" on public.notifications
  for select to authenticated using (
    recipient_mshs = replace(split_part(auth.jwt() ->> 'email', '@', 1), 'student', '')
  );
create policy "notif update own" on public.notifications
  for update to authenticated using (
    recipient_mshs = replace(split_part(auth.jwt() ->> 'email', '@', 1), 'student', '')
  );
create policy "notif delete own" on public.notifications
  for delete to authenticated using (
    recipient_mshs = replace(split_part(auth.jwt() ->> 'email', '@', 1), 'student', '')
  );

-- ── Bật realtime cho bảng (chạy 1 lần; nếu báo "đã tồn tại" thì bỏ qua) ──
alter publication supabase_realtime add table public.notifications;
