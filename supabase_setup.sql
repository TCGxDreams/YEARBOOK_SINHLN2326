-- ═══════════════════════════════════════════════════════════
-- SUPABASE SETUP — Lưu bút SINHLN2326
-- Chạy TOÀN BỘ file này trong SQL Editor trên Supabase Dashboard
-- ═══════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────
-- 1. BẢNG MEMBERS — Danh sách 41 thành viên lớp
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  mshs TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  role TEXT DEFAULT 'member',
  nickname TEXT DEFAULT '',
  quote TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_select" ON members;
CREATE POLICY "members_select" ON members FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "members_update" ON members;
CREATE POLICY "members_update" ON members FOR UPDATE TO authenticated
  USING (
    mshs = replace(split_part(auth.jwt()->>'email', '@', 1), 'student', '')
    OR EXISTS (
      SELECT 1 FROM members m
      WHERE m.mshs = replace(split_part(auth.jwt()->>'email', '@', 1), 'student', '')
      AND m.role = 'admin'
    )
  );

-- ── Chèn 41 thành viên ──────────────────────────────────────
INSERT INTO members (mshs, full_name, short_name, color, role) VALUES
  ('232401', 'Nguyễn Đoàn Minh An',       'An',      '#3b82f6', 'member'),
  ('232402', 'Mạc Thái Trâm Anh',         'Anh',     '#ec4899', 'member'),
  ('232403', 'Nguyễn Hoàng Phương Anh',    'Anh',     '#10b981', 'member'),
  ('232404', 'Nguyễn Ngọc Đông Anh',       'Anh',     '#f59e0b', 'member'),
  ('232405', 'Nguyễn Ngọc Quỳnh Anh',      'Anh',     '#8b5cf6', 'member'),
  ('232406', 'Võ Phúc Phương Anh',          'Anh',     '#ef4444', 'member'),
  ('232407', 'Trần Gia Bảo',               'Bảo',     '#06b6d4', 'member'),
  ('232408', 'Nguyễn Bá Phương Bắc',       'Bắc',     '#14b8a6', 'member'),
  ('232409', 'Nguyễn Văn Việt Bình',        'Bình',    '#f97316', 'member'),
  ('232410', 'Trần Ngọc Dân',              'Dân',     '#d946ef', 'member'),
  ('232411', 'Nguyễn Thùy Dung',           'Dung',    '#0ea5e9', 'member'),
  ('232412', 'Vũ Nguyễn Hải Đăng',         'Đăng',    '#a855f7', 'member'),
  ('232413', 'Phan Hữu Minh Đức',          'Đức',     '#84cc16', 'member'),
  ('232414', 'Đỗ Mai Hân',                 'Hân',     '#e11d48', 'member'),
  ('232415', 'Hồ Trần Ngọc Hân',           'Hân',     '#0891b2', 'member'),
  ('232416', 'Nguyễn Ngọc Bích Hân',       'Hân',     '#7c3aed', 'member'),
  ('232418', 'Ngô Gia Huy',                'Huy',     '#059669', 'member'),
  ('232420', 'Bạch Hưng Khôi',             'Khôi',    '#dc2626', 'member'),
  ('232421', 'Nguyễn Đình Khuê',           'Khuê',    '#2563eb', 'member'),
  ('232422', 'Phan Vũ Phúc Lân',           'Lân',     '#c026d3', 'member'),
  ('232423', 'Hà Trần Nhật Linh',           'Linh',    '#16a34a', 'member'),
  ('232424', 'Nguyễn Phương Linh',          'Linh',    '#ea580c', 'member'),
  ('232425', 'Nguyễn Ngọc Phương Loan',     'Loan',    '#4f46e5', 'member'),
  ('232426', 'Cao Tiến Minh',              'Minh',    '#db2777', 'member'),
  ('232430', 'Nguyễn Bảo Nguyên',          'Nguyên',  '#0d9488', 'member'),
  ('232432', 'Nguyễn Chí Nhân',            'Nhân',    '#9333ea', 'member'),
  ('232433', 'Nguyễn Vũ Trọng Nhân',       'Nhân',    '#65a30d', 'admin'),
  ('232434', 'Nguyễn Võ Khánh Nhi',         'Nhi',     '#be123c', 'member'),
  ('232435', 'Nguyễn Trần Hà Phương',       'Phương',  '#0284c7', 'member'),
  ('232436', 'Võ Việt Anh Thư',             'Thư',     '#a21caf', 'member'),
  ('232437', 'Nguyễn Phúc Toàn',           'Toàn',    '#15803d', 'member'),
  ('232438', 'Nguyễn Hứa Anh Trang',       'Trang',   '#c2410c', 'member'),
  ('232439', 'Phan Thúy Mai Trang',         'Trang',   '#4338ca', 'member'),
  ('232440', 'Nguyễn Lê Uyên Trân',         'Trân',    '#be185d', 'member'),
  ('232441', 'Trương Quang Minh Trí',       'Trí',     '#0f766e', 'member'),
  ('232442', 'Đặng Huỳnh Đông Trúc',       'Trúc',    '#7e22ce', 'member'),
  ('232443', 'Nguyễn Ngọc Bảo Trúc',       'Trúc',    '#4d7c0f', 'member'),
  ('232444', 'Hồ Ngọc Bảo Uyên',           'Uyên',    '#9f1239', 'member'),
  ('232445', 'Lê Phương Uyên',              'Uyên',    '#0369a1', 'member'),
  ('232447', 'Phan Hải Uyên',               'Uyên',    '#86198f', 'member'),
  ('232448', 'Lê Thúy Vương',              'Vương',   '#166534', 'member'),
  ('242500', 'Lý Viễn Triệu Quang',       'Quang',   '#ef4444', 'teacher'),
  ('252600', 'Nguyễn Trần Bảo Linh',      'Linh',    '#3b82f6', 'teacher'),
  ('232400', 'Đoàn Ngọc Anh Duy',         'Duy',     '#10b981', 'teacher')
ON CONFLICT (mshs) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 2. BẢNG MESSAGES — Lưu bút
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author TEXT NOT NULL,
  author_mshs TEXT,
  recipient TEXT DEFAULT 'Cả lớp',
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_update" ON messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "messages_delete" ON messages;
CREATE POLICY "messages_delete" ON messages FOR DELETE TO authenticated
  USING (
    author_mshs = replace(split_part(auth.jwt()->>'email', '@', 1), 'student', '')
    OR EXISTS (
      SELECT 1 FROM members m
      WHERE m.mshs = replace(split_part(auth.jwt()->>'email', '@', 1), 'student', '')
      AND m.role = 'admin'
    )
  );

INSERT INTO messages (author, recipient, content, likes) VALUES
  ('Ban chủ nhiệm', 'Cả lớp SINHLN2326', 'Chúc các em 12 SINH-LN luôn giữ mãi ngọn lửa đam mê với Sinh học và đạt kết quả thật cao!', 41),
  ('SINHLN2326', 'Tất cả', 'Ba năm bên nhau, mãi là một gia đình 💙', 35);

-- ────────────────────────────────────────────────────────────
-- 3. BẢNG GALLERY — Ảnh kỷ niệm
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  category TEXT DEFAULT 'other',
  uploaded_by TEXT,
  uploaded_by_name TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gallery_select" ON gallery;
CREATE POLICY "gallery_select" ON gallery FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "gallery_insert" ON gallery;
CREATE POLICY "gallery_insert" ON gallery FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "gallery_update" ON gallery;
CREATE POLICY "gallery_update" ON gallery FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "gallery_delete" ON gallery;
CREATE POLICY "gallery_delete" ON gallery FOR DELETE TO authenticated
  USING (
    uploaded_by = replace(split_part(auth.jwt()->>'email', '@', 1), 'student', '')
    OR EXISTS (
      SELECT 1 FROM members m
      WHERE m.mshs = replace(split_part(auth.jwt()->>'email', '@', 1), 'student', '')
      AND m.role = 'admin'
    )
  );

-- ────────────────────────────────────────────────────────────
-- 4. STORAGE BUCKET — Lưu trữ ảnh
-- Bạn cũng cần tạo bucket trên Supabase Dashboard:
-- Storage → New Bucket → Tên: "gallery" → Public: ON
-- ────────────────────────────────────────────────────────────
-- Nếu dùng SQL:
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Policy cho storage bucket
CREATE POLICY "gallery_storage_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'gallery');
CREATE POLICY "gallery_storage_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery');
CREATE POLICY "gallery_storage_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery');
