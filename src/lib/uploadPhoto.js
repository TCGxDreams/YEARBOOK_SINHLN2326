import { supabase } from './supabase';
import { uploadVideoToDrive } from './uploadVideo';
import { compressImage } from './compressImage';

/**
 * ════════════════════════════════════════════════════════════
 * Upload ảnh với fallback tự động:
 *   1. Thử Supabase Storage trước (nhanh, miễn phí cho scale nhỏ)
 *   2. Nếu Supabase hết quota / file > 10MB → fallback lên Drive
 *
 * @param {File} file - File ảnh cần upload
 * @param {string} memberMshs - MSHS của user (làm folder path)
 * @param {(progress: number) => void} onProgress - Callback % cho Drive upload
 * @returns {Promise<{source: 'supabase'|'drive', image_url?: string, drive_file_id?: string}>}
 * ════════════════════════════════════════════════════════════
 */
export async function uploadPhoto(file, memberMshs, onProgress) {
    // Nén ảnh trước khi upload (video/gif bỏ qua)
    if (file.type.startsWith('image/')) {
        file = await compressImage(file);
    }

    // ─── Shortcut: file > 10MB thì Supabase free tier không nhận (limit 50MB),
    //              dùng Drive luôn cho đỡ tốn 1 vòng try-catch ───
    if (file.size > 10 * 1024 * 1024) {
        console.warn('[uploadPhoto] File > 10MB → Drive luôn');
        const drive_file_id = await uploadVideoToDrive(file, onProgress);
        return { source: 'drive', drive_file_id };
    }

    // ─── Thử Supabase Storage ───
    try {
        const ext = file.name.split('.').pop();
        const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `${memberMshs}/${filename}`;

        const { error } = await supabase.storage
            .from('gallery')
            .upload(path, file, {
                contentType: file.type,
                cacheControl: '31536000',
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);
        return { source: 'supabase', image_url: urlData.publicUrl };
    } catch (err) {
        // ─── Catch lỗi quota / size → fallback Drive ───
        const msg = (err?.message || '').toLowerCase();
        const status = err?.statusCode || err?.status;

        const isQuotaErr =
            msg.includes('quota') ||
            msg.includes('exceeded') ||
            msg.includes('payload too large') ||
            msg.includes('entity too large') ||
            msg.includes('the resource already exists') === false && msg.includes('storage') ||
            status === 413 ||      // Payload Too Large
            status === 507 ||      // Insufficient Storage
            status === '413' ||
            status === '507';

        if (!isQuotaErr) {
            // Lỗi khác (network, RLS, etc) → throw lại để Gallery.jsx báo cho user
            throw err;
        }

        console.warn('[uploadPhoto] Supabase hết quota → fallback Drive:', err.message);
        const drive_file_id = await uploadVideoToDrive(file, onProgress);
        return { source: 'drive', drive_file_id };
    }
}

/**
 * Build URL hiển thị cho gallery item, support cả Supabase & Drive
 * @param {Object} item - Row từ bảng gallery
 * @param {number} size - Width tối đa (px), default 800
 * @returns {string} URL ảnh
 */
export function getPhotoSrc(item, size = 800) {
    if (item.drive_file_id) {
        // Google Drive thumbnail endpoint — reliable cho images
        return `https://drive.google.com/thumbnail?id=${item.drive_file_id}&sz=w${size}`;
    }
    return item.image_url;
}