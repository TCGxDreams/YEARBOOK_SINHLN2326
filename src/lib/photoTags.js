import { supabase } from './supabase';

// Lấy tag của 1 media (ảnh/video)
export async function fetchTags(mediaId, mediaType) {
  const { data, error } = await supabase
    .from('photo_tags')
    .select('*')
    .eq('media_id', String(mediaId))
    .eq('media_type', mediaType)
    .order('created_at', { ascending: true });
  if (error) { console.warn('[photoTags] fetchTags:', error.message); return []; }
  return data || [];
}

// Thêm tag
export async function addTag(media, m, taggerMshs) {
  const row = {
    media_id: String(media.id),
    media_type: media.type,
    member_mshs: m.mshs,
    member_name: m.full_name,
    member_short_name: m.short_name,
    tagged_by: taggerMshs || null,
  };
  return supabase.from('photo_tags').insert(row).select().single();
}

// Gỡ tag
export async function removeTag(id) {
  return supabase.from('photo_tags').delete().eq('id', id);
}

// Danh sách "type-id" mà 1 người được tag — dùng cho filter "Ảnh có tôi"
export async function fetchTaggedKeys(mshs) {
  const { data, error } = await supabase
    .from('photo_tags')
    .select('media_id, media_type')
    .eq('member_mshs', mshs);
  if (error) { console.warn('[photoTags] fetchTaggedKeys:', error.message); return new Set(); }
  return new Set((data || []).map(t => `${t.media_type}-${t.media_id}`));
}
