/**
 * Fix upload 2 ảnh còn thiếu do khác biệt Unicode
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = '/Users/trongnhannguyenvu/Downloads/12 SINH LN';

// Đọc .env
const envPath = path.resolve(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  envVars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

// Map thủ công: tên file → MSHS
const MANUAL_MAP = [
  { file: 'Nguyễn Thuỳ Dung .jpg', mshs: '232411' },
  { file: 'Phan Thuý Mai Trang.jpg', mshs: '232439' },
];

async function main() {
  // Đăng nhập
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: 'student232433@ptnk.edu.vn',
    password: '',
  });
  if (authErr) { console.error('❌ Login failed:', authErr.message); process.exit(1); }
  console.log('🔐 Đã đăng nhập\n');

  for (const { file, mshs } of MANUAL_MAP) {
    const filePath = path.join(PHOTOS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File không tồn tại: ${file}`);
      continue;
    }

    const ext = path.extname(file).toLowerCase();
    const storagePath = `avatars/${mshs}${ext}`;
    const fileBuffer = fs.readFileSync(filePath);

    console.log(`⬆️  Uploading: ${file} → ${storagePath}`);

    const { error: uploadErr } = await supabase.storage
      .from('gallery')
      .upload(storagePath, fileBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadErr) { console.error(`   ❌ Upload lỗi: ${uploadErr.message}`); continue; }

    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    const { error: updateErr } = await supabase
      .from('members')
      .update({ avatar_url: publicUrl })
      .eq('mshs', mshs);

    if (updateErr) { console.error(`   ❌ DB lỗi: ${updateErr.message}`); continue; }

    console.log(`   ✅ OK → ${publicUrl}`);
  }

  await supabase.auth.signOut();
  console.log('\n✅ Hoàn tất!');
}

main().catch(err => { console.error('❌', err); process.exit(1); });
