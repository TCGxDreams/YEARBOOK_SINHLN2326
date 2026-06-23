import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MessageSquare, Image as ImageIcon, Heart, Play, Key, User, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { localMembers } from '../data/members';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchMyLikes, toggleLike } from '../lib/likes';
import './Panel.css'; // Reuses panel styles

const driveThumbnail = (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w400`;

const MemberProfile = () => {
  const { mshs } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { member: currentUser } = useAuth();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Received messages
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  
  // Uploaded media
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(true);

  // Liked items tracking
  const [likedKeys, setLikedKeys] = useState(new Set());

  useEffect(() => {
    fetchMyLikes(currentUser?.mshs).then(setLikedKeys);
  }, [currentUser?.mshs]);

  useEffect(() => {
    if (!mshs) return;
    fetchMemberData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mshs]);

  async function fetchMemberData() {
    setLoading(true);
    let currentMember = null;
    
    // 1. Fetch member profile
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('mshs', mshs)
        .single();
        
      if (data && !error) {
        currentMember = data;
      }
    } catch (e) {
      console.warn('Could not fetch member from Supabase, trying fallback');
    }

    if (!currentMember) {
      currentMember = localMembers.find(m => m.mshs === mshs);
    }

    if (!currentMember) {
      toast.error('Không tìm thấy thành viên!');
      navigate('/members');
      return;
    }

    setMember(currentMember);
    setLoading(false);

    // 2. Fetch received messages
    fetchMessages(currentMember);

    // 3. Fetch uploaded media
    fetchMedia(currentMember);
  }

  async function fetchMessages(mem) {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`recipient.ilike.%${mem.full_name}%,recipient.ilike.%${mem.short_name}%`)
        .order('created_at', { ascending: false });

      if (!error) {
        setReceivedMessages(data || []);
      }
    } catch (err) {
      console.warn('Could not fetch member messages:', err);
    }
    setLoadingMessages(false);
  }

  async function fetchMedia(mem) {
    setLoadingMedia(true);
    try {
      const [galleryRes, videosRes] = await Promise.all([
        supabase.from('gallery').select('*').eq('uploaded_by', mem.mshs),
        supabase.from('videos').select('*').eq('uploaded_by', mem.mshs),
      ]);

      const images = (galleryRes.data || []).map(img => ({ ...img, type: 'image' }));
      const videos = (videosRes.data || []).map(vid => ({ ...vid, type: 'video' }));

      const sorted = [...images, ...videos].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setUploadedMedia(sorted);
    } catch (err) {
      console.warn('Could not fetch member media:', err);
    }
    setLoadingMedia(false);
  }

  const handleLikeMessage = async (id) => {
    const key = `message-${id}`; const was = likedKeys.has(key);
    setLikedKeys(p => { const n = new Set(p); was ? n.delete(key) : n.add(key); return n; });
    setReceivedMessages(p => p.map(m => m.id === id ? { ...m, likes: Math.max(0,(m.likes||0)+(was?-1:1)) } : m));
    try {
      const { liked, likes } = await toggleLike('message', id);
      setLikedKeys(p => { const n = new Set(p); liked ? n.add(key) : n.delete(key); return n; });
      setReceivedMessages(p => p.map(m => m.id === id ? { ...m, likes } : m));
    } catch { setLikedKeys(p => { const n = new Set(p); was ? n.add(key) : n.delete(key); return n; }); }
  };

  const handleLikeMedia = async (item) => {
    const key = `${item.type}-${item.id}`; const was = likedKeys.has(key);
    setLikedKeys(p => { const n = new Set(p); was ? n.delete(key) : n.add(key); return n; });
    setUploadedMedia(p => p.map(it => it.id===item.id && it.type===item.type ? { ...it, likes: Math.max(0,(it.likes||0)+(was?-1:1)) } : it));
    try {
      const { liked, likes } = await toggleLike(item.type, item.id);
      setLikedKeys(p => { const n = new Set(p); liked ? n.add(key) : n.delete(key); return n; });
      setUploadedMedia(p => p.map(it => it.id===item.id && it.type===item.type ? { ...it, likes } : it));
    } catch { setLikedKeys(p => { const n = new Set(p); was ? n.add(key) : n.delete(key); return n; }); }
  };

  if (loading) {
    return (
      <div className="loading-screen flex-center" style={{ minHeight: '80vh' }}>
        <Loader2 size={32} className="spin-icon" style={{ color: 'var(--ptnk-blue)' }} />
      </div>
    );
  }

  const noteColors = ['#fff9c4', '#e1f5fe', '#fce4ec', '#e8f5e9', '#f3e5f5', '#fff3e0'];
  const pinColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="page-container container section">
      {/* Back to list */}
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/members')} style={{ marginBottom: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        <ChevronLeft size={16} /> Quay lại danh sách
      </button>

      {/* Hero card details */}
      <div className="panel-grid">
        <motion.div
          className="panel-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ gridColumn: 'span 1' }}
        >
          <div className="profile-hero">
            <div className="profile-avatar-wrapper">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.full_name} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar" style={{ background: `linear-gradient(135deg, ${member.color}, ${member.color}bb)` }}>
                  {member.short_name?.charAt(0)}
                </div>
              )}
            </div>
            <h1 className="profile-name">{member.full_name}</h1>
            {member.nickname && <p className="profile-nickname">"{member.nickname}"</p>}
            <span className="profile-mshs">MSHS: {member.mshs}</span>
          </div>

          <div className="profile-details">
            <div className="profile-detail-row">
              <span className="detail-label">Lớp</span>
              <span className="detail-value">12 SINH-LN</span>
            </div>
            <div className="profile-detail-row">
              <span className="detail-label">Trường</span>
              <span className="detail-value">PTNK — ĐHQG TP.HCM</span>
            </div>
            {member.quote && (
              <div className="profile-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span className="detail-label">Châm ngôn yêu thích</span>
                <span className="detail-value" style={{ textAlign: 'left', fontStyle: 'italic', fontWeight: 500 }}>
                  "{member.quote}"
                </span>
              </div>
            )}
            {member.bio && (
              <div className="profile-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', borderBottom: 'none' }}>
                <span className="detail-label">Giới thiệu bản thân</span>
                <span className="detail-value" style={{ textAlign: 'left', fontWeight: 400, fontSize: '0.9rem', lineHeight: 1.5 }}>
                  {member.bio}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Messages and memories grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', gridColumn: 'span 1' }}>
          {/* Messages received */}
          <motion.div
            className="panel-card glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="panel-card-header">
              <MessageSquare size={20} />
              <h2>Lưu Bút Gửi {member.short_name} ({receivedMessages.length})</h2>
            </div>

            {loadingMessages ? (
              <div className="flex-center" style={{ padding: '2rem' }}>
                <Loader2 size={24} className="spin-icon" />
              </div>
            ) : receivedMessages.length === 0 ? (
              <p className="muted" style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: '0.9rem' }}>
                Chưa có lưu bút nào gửi đến {member.short_name}.
              </p>
            ) : (
              <div className="member-received-messages-list" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {receivedMessages.map((msg, index) => {
                  const isLiked = likedKeys.has(`message-${msg.id}`);
                  return (
                    <div
                      key={msg.id}
                      className="message-note"
                      style={{
                        '--note-color': noteColors[index % noteColors.length],
                        '--pin-color': pinColors[index % pinColors.length],
                        padding: '1.25rem',
                        boxShadow: 'none',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div className="note-header">
                        <div className="note-author">{msg.author}</div>
                        <div className="note-date" style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                          {new Date(msg.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <div className="note-content" style={{ margin: '0.75rem 0', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {msg.content}
                      </div>
                      <div className="note-footer" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          className={`note-like-btn ${isLiked ? 'liked' : ''}`}
                          onClick={() => handleLikeMessage(msg.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <Heart size={12} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : 'currentColor'} /> {msg.likes || 0}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Media uploaded */}
          <motion.div
            className="panel-card glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="panel-card-header">
              <ImageIcon size={20} />
              <h2>Kỷ Niệm Đã Đăng ({uploadedMedia.length})</h2>
            </div>

            {loadingMedia ? (
              <div className="flex-center" style={{ padding: '2rem' }}>
                <Loader2 size={24} className="spin-icon" />
              </div>
            ) : uploadedMedia.length === 0 ? (
              <p className="muted" style={{ textAlign: 'center', padding: '1.5rem 0', fontSize: '0.9rem' }}>
                Chưa có ảnh/video nào do {member.short_name} tải lên.
              </p>
            ) : (
              <div className="member-uploaded-media-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {uploadedMedia.map(item => {
                  const itemKey = `${item.type}-${item.id}`;
                  const isLiked = likedKeys.has(itemKey);
                  return (
                    <div key={itemKey} className="member-media-card" style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: '90px', border: '1px solid var(--border-color)' }}>
                      {item.type === 'video' ? (
                        <>
                          <img src={driveThumbnail(item.drive_file_id)} alt={item.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)' }}>
                            <Play size={20} fill="white" color="white" />
                          </div>
                        </>
                      ) : (
                        <img src={item.image_url || driveThumbnail(item.drive_file_id)} alt={item.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      
                      {/* overlay details */}
                      <div className="media-overlay-mini" style={{ position: 'absolute', bottom: 0, insetX: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '0.25rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70px' }}>
                          {item.caption || 'Kỷ niệm'}
                        </span>
                        <button
                          onClick={() => handleLikeMedia(item)}
                          style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.15rem', padding: 0, fontSize: '0.7rem', cursor: 'pointer' }}
                        >
                          <Heart size={10} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : 'white'} /> {item.likes || 0}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;
