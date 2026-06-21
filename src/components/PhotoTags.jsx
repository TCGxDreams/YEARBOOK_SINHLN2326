import { useState, useEffect, useRef } from 'react';
import { Tag, X, Search, Loader2, UserPlus, UserCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { localMembers } from '../data/members';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchTags, addTag, removeTag } from '../lib/photoTags';
import './PhotoTags.css';

const PhotoTags = ({ media, onTagChange }) => {
  const { member, isAdmin } = useAuth();
  const toast = useToast();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const searchRef = useRef(null);

  // Fetch tag khi đổi ảnh
  useEffect(() => {
    if (!media) return;
    let active = true;
    setLoading(true);
    setPicking(false);
    setQuery('');
    fetchTags(media.id, media.type).then(rows => {
      if (active) { setTags(rows); setLoading(false); }
    });
    return () => { active = false; };
  }, [media?.id, media?.type]);

  // Fetch danh sách thành viên khi mở picker lần đầu
  useEffect(() => {
    if (!picking || members.length) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('members')
          .select('mshs, full_name, short_name, nickname, color, avatar_url')
          .order('full_name');
        setMembers(data && data.length ? data : localMembers);
      } catch {
        setMembers(localMembers);
      }
    })();
  }, [picking, members.length]);

  // Auto focus search input when picking is true
  useEffect(() => {
    if (picking) {
      const timer = setTimeout(() => {
        searchRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [picking]);

  const taggedMshs = new Set(tags.map(t => t.member_mshs));

  const candidates = members
    .filter(m => !taggedMshs.has(m.mshs))
    .filter(m => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (m.full_name?.toLowerCase().includes(q))
        || (m.short_name?.toLowerCase().includes(q))
        || (m.mshs?.includes(q))
        || (m.nickname && m.nickname.toLowerCase().includes(q));
    })
    .slice(0, 30);

  function canRemove(tag) {
    return isAdmin
      || tag.member_mshs === member?.mshs
      || tag.tagged_by === member?.mshs
      || media.uploaded_by === member?.mshs;
  }

  async function handleAdd(m) {
    if (busy) return;
    setBusy(true);
    setQuery('');
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
          <button className="phototag-add" onClick={() => handleAdd(member)} disabled={busy} title="Gắn thẻ của tôi vào ảnh này">
            {busy ? <Loader2 size={12} className="spin-icon" /> : <UserCheck size={12} />}
            Gắn thẻ tôi
          </button>
        )}

        {member && (
          <button className={`phototag-add ${picking ? 'active' : ''}`} onClick={() => setPicking(p => !p)}>
            {picking ? <X size={12} /> : <UserPlus size={12} />}
            {picking ? 'Đóng' : 'Gắn thẻ người khác'}
          </button>
        )}

        {!loading && tags.length === 0 && !picking && (
          <span className="phototags-empty">Chưa ai được gắn thẻ</span>
        )}
      </div>

      {picking && (
        <div className="phototags-picker glass">
          <div className="phototags-search">
            <Search size={14} />
            <input 
              ref={searchRef} 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              placeholder="Tìm tên bạn để gắn thẻ..." 
            />
            {query && (
              <button 
                className="search-clear-btn" 
                onClick={() => setQuery('')} 
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="phototags-list">
            {candidates.length === 0 ? (
              <div className="phototags-noresult">Không tìm thấy ai phù hợp</div>
            ) : (
              candidates.map(m => (
                <button key={m.mshs} className="phototags-option" onClick={() => handleAdd(m)} disabled={busy}>
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="phototags-ava-img" />
                  ) : (
                    <span className="phototags-ava" style={{ background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)` }}>
                      {m.short_name?.charAt(0)}
                    </span>
                  )}
                  <span className="phototags-opt-name">{m.full_name}</span>
                  <span className="phototags-opt-mshs">{m.mshs}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoTags;
