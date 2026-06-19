/**
 * Script upload ảnh profile lên Supabase Storage (thư mục avatars/)
 * và cập nhật avatar_url trong bảng members.
 *
 * Cách dùng:
 *   node scripts/upload-avatars.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Cấu hình ────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = '/Users/trongnhannguyenvu/Downloads/12 SINH LN';
const BUCKET = 'gallery';
const STORAGE_FOLDER = 'avatars';

// Admin login
const ADMIN_EMAIL = 'student232433@ptnk.edu.vn';
const ADMIN_PASSWORD = '[PASSWORD]';

// ─── Đọc .env thủ công ──────────────────────────────────
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

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Chuẩn hóa tên để so sánh ──────────────────────────────
function normalize(str) {
  return str
    .normalize('NFC')
    .replace(/[_]+/g, '')          // bỏ dấu gạch dưới
    .replace(/\s+/g, ' ')         // chuẩn hóa khoảng trắng
    .replace(/\s*\.\s*$/, '')     // bỏ dấu chấm cuối
    .trim()
    .toLowerCase();
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  // 0. Đăng nhập bằng tài khoản admin
  console.log('🔐 Đang đăng nhập tài khoản admin...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (authErr || !authData?.session) {
    console.error('❌ Đăng nhập thất bại:', authErr?.message);
    process.exit(1);
  }
  console.log('   ✅ Đã đăng nhập thành công!\n');

  // 1. Lấy danh sách members từ Supabase
  console.log('📋 Đang lấy danh sách thành viên từ Supabase...');
  const { data: members, error: fetchErr } = await supabase
    .from('members')
    .select('id, mshs, full_name, avatar_url')
    .order('mshs');

  if (fetchErr || !members) {
    console.error('❌ Không thể lấy danh sách members:', fetchErr?.message);
    process.exit(1);
  }
  console.log(`   Tìm thấy ${members.length} thành viên\n`);

  // 2. Đọc danh sách file ảnh
  const photos = fs.readdirSync(PHOTOS_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  console.log(`📷 Tìm thấy ${photos.length} ảnh trong thư mục\n`);

  // 3. Tạo map chuẩn hóa tên → member
  const memberMap = new Map();
  for (const m of members) {
    memberMap.set(normalize(m.full_name || ''), m);
  }

  // Debug: In danh sách tên trong DB để đối chiếu
  console.log('📝 Danh sách tên trong DB:');
  for (const m of members) {
    console.log(`   "${m.full_name}" → normalized: "${normalize(m.full_name)}"`);
  }
  console.log('');

  let successCount = 0;
  let skipCount = 0;
  let notFoundCount = 0;
  const notFoundFiles = [];

  for (const photoFile of photos) {
    const rawName = path.parse(photoFile).name;
    const nameNorm = normalize(rawName);

    // Tìm member khớp tên (exact match trước)
    let member = memberMap.get(nameNorm);

    // Nếu không khớp chính xác, thử tìm tên chứa hoặc được chứa
    if (!member) {
      for (const [dbNameNorm, m] of memberMap) {
        if (dbNameNorm.includes(nameNorm) || nameNorm.includes(dbNameNorm)) {
          member = m;
          break;
        }
      }
    }

    // Xử lý trường hợp đặc biệt: "Thầy Nguyễn Trần Bảo Linh" → "Nguyễn Trần Bảo Linh"
    if (!member && nameNorm.startsWith('thầy ')) {
      const withoutPrefix = nameNorm.replace(/^thầy\s+/, '');
      member = memberMap.get(withoutPrefix);
      if (!member) {
        for (const [dbNameNorm, m] of memberMap) {
          if (dbNameNorm.includes(withoutPrefix) || withoutPrefix.includes(dbNameNorm)) {
            member = m;
            break;
          }
        }
      }
    }

    if (!member) {
      console.log(`⚠️  Không tìm thấy member cho: "${photoFile}" (normalized: "${nameNorm}")`);
      notFoundCount++;
      notFoundFiles.push(photoFile);
      continue;
    }

    // 4. Upload ảnh lên Supabase Storage
    const ext = path.extname(photoFile).toLowerCase();
    const storagePath = `${STORAGE_FOLDER}/${member.mshs}${ext}`;
    const filePath = path.join(PHOTOS_DIR, photoFile);
    const fileBuffer = fs.readFileSync(filePath);

    const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
    const contentType = mimeMap[ext] || 'image/jpeg';

    console.log(`⬆️  Uploading: ${member.full_name} (${member.mshs}) ← "${photoFile}"`);

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType,
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadErr) {
      console.error(`   ❌ Upload lỗi: ${uploadErr.message}`);
      continue;
    }

    // 5. Lấy public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // 6. Cập nhật avatar_url trong bảng members
    const { error: updateErr } = await supabase
      .from('members')
      .update({ avatar_url: publicUrl })
      .eq('mshs', member.mshs);

    if (updateErr) {
      console.error(`   ❌ Update DB lỗi: ${updateErr.message}`);
      continue;
    }

    console.log(`   ✅ OK → ${publicUrl}`);
    successCount++;
  }

  // 7. Tổng kết
  console.log('\n' + '═'.repeat(50));
  console.log(`📊 KẾT QUẢ:`);
  console.log(`   ✅ Thành công: ${successCount}`);
  console.log(`   ⚠️  Không khớp tên: ${notFoundCount}`);
  console.log(`   📷 Tổng ảnh: ${photos.length}`);
  if (notFoundFiles.length > 0) {
    console.log(`\n   Các file không khớp:`);
    notFoundFiles.forEach(f => console.log(`     - ${f}`));
  }
  console.log('═'.repeat(50));

  // Đăng xuất
  await supabase.auth.signOut();
}

main().catch(err => {
  console.error('❌ Lỗi không mong đợi:', err);
  process.exit(1);
});
