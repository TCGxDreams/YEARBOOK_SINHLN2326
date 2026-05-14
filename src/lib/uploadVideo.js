import { supabase } from './supabase';

/**
 * Upload video lên Google Drive qua Edge Function create-upload-url.
 * Luồng: xin resumable URL từ Edge Function → PUT video thẳng lên Drive.
 *
 * @param {File} file - file video
 * @param {(percent:number)=>void} onProgress - callback % upload (0-100)
 * @returns {Promise<string>} drive_file_id
 */
export async function uploadVideoToDrive(file, onProgress) {
    // ── 1. Xin resumable upload URL từ Edge Function ──
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Bạn cần đăng nhập để upload video');

    const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-upload-url`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                filename: file.name,
                mimeType: file.type,
                origin: window.location.origin,
            }),
        }
    );

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) {
        throw new Error(json.error || `Edge Function lỗi: ${res.status}`);
    }
    const { uploadUrl } = json;
    if (!uploadUrl) throw new Error('Edge Function không trả về uploadUrl');

    // ── 2. PUT video thẳng lên Google Drive (có progress qua XHR) ──
    const driveFile = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    resolve(JSON.parse(xhr.responseText));
                } catch {
                    reject(new Error('Drive trả về dữ liệu không hợp lệ'));
                }
            } else {
                // ⭐ IN CHI TIẾT body lỗi từ Google để debug
                console.error('[uploadVideo] Drive PUT lỗi', xhr.status);
                console.error('[uploadVideo] Response body:', xhr.responseText);
                let detail = xhr.responseText;
                try {
                    const parsed = JSON.parse(xhr.responseText);
                    detail = parsed?.error?.message || parsed?.error?.errors?.[0]?.message || xhr.responseText;
                } catch { /* để nguyên text */ }
                reject(new Error(`Drive ${xhr.status}: ${detail}`));
            }
        };
        xhr.onerror = () => reject(new Error('Lỗi mạng / CORS khi upload lên Drive'));
        xhr.send(file);
    });

    return driveFile.id;
}