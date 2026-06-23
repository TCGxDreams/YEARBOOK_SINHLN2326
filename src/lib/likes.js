import { supabase } from './supabase';

// Tập "type-id" mà user hiện tại đã thích
export async function fetchMyLikes(mshs) {
  if (!mshs) return new Set();
  const { data, error } = await supabase
    .from('likes').select('target_type, target_id').eq('member_mshs', mshs);
  if (error) { console.warn('[likes] fetchMyLikes:', error.message); return new Set(); }
  return new Set((data || []).map(r => `${r.target_type}-${r.target_id}`));
}

// Bật/tắt thích → { liked, likes }
export async function toggleLike(type, id) {
  const { data, error } = await supabase.rpc('toggle_like', { p_type: type, p_id: String(id) });
  if (error) throw error;
  return data;
}
