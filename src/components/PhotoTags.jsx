import { useState, useEffect } from 'react';
import { Tag, X, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchTags, addTag, removeTag } from '../lib/photoTags';
import './PhotoTags.css';

const PhotoTags = ({ media, onTagChange }) => {
  const { member, isAdmin } = useAuth();
  const toast = useToast();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Fetch tag khi đổi ảnh
  useEffect(() => {
    if (!media) return;
    let active = true;
    setLoading(true);
    fetchTags(media.id, media.type).then(rows => {
      if (active) { setTags(rows); setLoading(false); }
    });
    return () => { active = false; };
  }, [media?.id, media?.type]);

  const taggedMshs = new Set(tags.map(t => t.member_mshs));

  function canRemove(tag) {
    return isAdmin
      || tag.member_mshs === member?.mshs
      || tag.tagged_by === member?.mshs
      || media.uploaded_by === member?.mshs;
  }

  async function handleAdd(m) {
    if (busy) return;
    setBusy(true);
    const optimistic = {
      id: `tmp-${m.mshs}`, media_id: String(media.id), media_type: media.type,
      member_mshs: m.mshs, member_name: m.full_name, member_short_name: m.short_name,
      tagged_by: member?.mshs || null,
    };
    setTags(prev => [...prev, optimistic]);

    const { data, error } = await addTag(media, m, member?.mshs);
    if (error) {
      setTags(prev => prev.filter(t => t.id !== optimistic.id));
      toast.error('Không gắn được thẻ: ' + error.message);
    } else if (data) {
      setTags(prev => prev.map(t => (t.id === optimistic.id ? data : t)));
      if (onTagChange) onTagChange();
    }
    setBusy(false);
  }

  async function handleRemove(tag) {
    if (String(tag.id).startsWith('tmp-')) return;
    const snapshot = tags;
    setTags(t => t.filter(x => x.id !== tag.id));
    const { error } = await removeTag(tag.id);
    if (error) { 
      setTags(snapshot); 
      toast.error('Không gỡ được thẻ.'); 
    } else {
      if (onTagChange) onTagChange();
    }
  }

  if (!media) return null;

  return (
    <div className="phototags">
      <div className="phototags-head">
        <Tag size={14} />
        <span>Gắn thẻ người trong ảnh</span>
        {loading && <Loader2 size={13} className="spin-icon" />}
      </div>

      <div className="phototags-chips">
        {tags.map(tag => (
          <span key={tag.id} className="phototag-chip">
            {tag.member_short_name || tag.member_name}
            {canRemove(tag) && (
              <button className="phototag-remove" onClick={() => handleRemove(tag)} aria-label={`Gỡ thẻ ${tag.member_name}`}>
                <X size={11} />
              </button>
            )}
          </span>
        ))}

        {member && !taggedMshs.has(member.mshs) && (
          <button className="phototag-add" onClick={() => handleAdd(member)} disabled={busy}>
            {busy ? <Loader2 size={12} className="spin-icon" /> : <UserPlus size={12} />}
            Gắn thẻ tôi
          </button>
        )}

        {!loading && tags.length === 0 && (
          <span className="phototags-empty">Chưa ai được gắn thẻ</span>
        )}
      </div>
    </div>
  );
};

export default PhotoTags;
