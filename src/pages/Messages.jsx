import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, X, Send, Heart, Loader2, ChevronDown, ChevronUp, Search, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessagesSkeleton } from '../components/Skeleton';
import './Pages.css';

const MAX_LENGTH = 150;

/* ─── Message Note with collapse/expand ────── */
const MessageNote = ({ msg, index, noteColors, pinColors, handleLike, isLiked, formatDate, itemVariants }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = msg.content.length > MAX_LENGTH;
  const displayContent = isLong && !expanded
    ? msg.content.slice(0, MAX_LENGTH) + '...'
    : msg.content;

  return (
    <motion.div
      className="message-note"
      variants={itemVariants}
      style={{
        '--note-color': noteColors[index % noteColors.length],
        '--pin-color': pinColors[index % pinColors.length],
      }}
      whileHover={{ scale: 1.03, rotate: 0, zIndex: 10 }}
    >
      <div className="note-header">
        <div className="note-author">{msg.author}</div>
        <div className="note-to">gửi {msg.recipient}</div>
      </div>
      <div className={`note-content ${expanded ? 'expanded' : ''}`}>
        {displayContent}
      </div>
      {isLong && (
        <button
          className="note-toggle-btn"
          onClick={() => setExpanded(prev => !prev)}
        >
          {expanded ? (
            <><ChevronUp size={14} /> Thu gọn</>
          ) : (
            <><ChevronDown size={14} /> Xem thêm</>
          )}
        </button>
      )}
      <div className="note-footer">
        <button
          className={`note-like-btn ${isLiked ? 'liked' : ''}`}
          onClick={() => { if (!isLiked) handleLike(msg.id); }}
          style={{ cursor: isLiked ? 'default' : 'pointer' }}
        >
          <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : 'currentColor'} /> {msg.likes || 0}
        </button>
        <div className="note-date">{formatDate(msg.created_at)}</div>
      </div>
    </motion.div>
  );
};

/* ─── Messages Page ────────────────────────── */
const Messages = () => {
  const { member } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [formData, setFormData] = useState({ to: '', content: '' });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Suggestions / Tagging states
  const [membersList, setMembersList] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsTriggerIdx, setSuggestionsTriggerIdx] = useState(-1);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(0);
  
  // Search & Filter & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Likes state
  const [likedMessages, setLikedMessages] = useState([]);

  // Load liked messages from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('liked_message_items');
    if (saved) {
      try {
        setLikedMessages(JSON.parse(saved));
      } catch (e) {
        setLikedMessages([]);
      }
    }
  }, []);

  // Fetch members list for tagging suggestions
  useEffect(() => {
    async function fetchMembers() {
      try {
        const { data } = await supabase
          .from('members')
          .select('full_name, short_name, nickname, mshs, color')
          .order('full_name');
        if (data) {
          setMembersList(data);
        }
      } catch (err) {
        console.warn('Error fetching members for tagging:', err);
      }
    }
    fetchMembers();
  }, []);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch initial messages when filter/search changes
  useEffect(() => {
    setPage(0);
    fetchMessages(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, debouncedSearch]);

  async function fetchMessages(pageNum = 0, isInitial = false) {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filter
      if (filter === 'received') {
        if (member) {
          query = query.or(`recipient.ilike.%${member.full_name}%,recipient.ilike.%${member.short_name}%`);
        } else {
          query = query.eq('recipient', 'nobody');
        }
      } else if (filter === 'sent') {
        if (member) {
          query = query.eq('author_mshs', member.mshs);
        } else {
          query = query.eq('author_mshs', 'none');
        }
      } else if (filter === 'anonymous') {
        query = query.or('author.eq.Ẩn danh,author_mshs.is.null');
      }

      // Apply search
      if (debouncedSearch.trim()) {
        const s = debouncedSearch.trim();
        query = query.or(`content.ilike.%${s}%,author.ilike.%${s}%,recipient.ilike.%${s}%`);
      }

      // Range for pagination (12 items per page)
      const from = pageNum * 12;
      const to = from + 11;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) {
        console.warn('Supabase fetch error:', error.message);
      } else {
        if (pageNum === 0) {
          setMessages(data || []);
        } else {
          setMessages(prev => [...prev, ...(data || [])]);
        }
        setHasMore(data && data.length === 12);
      }
    } catch (err) {
      console.warn('Could not fetch messages:', err);
    }

    setLoading(false);
    setLoadingMore(false);
  }

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMessages(nextPage, false);
  };

  const handleToChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, to: val }));

    const lastAtIdx = val.lastIndexOf('@');
    if (lastAtIdx !== -1) {
      const isStart = lastAtIdx === 0 || val[lastAtIdx - 1] === ' ' || val[lastAtIdx - 1] === ',';
      if (isStart) {
        const query = val.slice(lastAtIdx + 1).toLowerCase();
        setSuggestionsTriggerIdx(lastAtIdx);
        
        const filtered = membersList.filter(m => 
          m.full_name.toLowerCase().includes(query) ||
          m.short_name.toLowerCase().includes(query) ||
          (m.nickname && m.nickname.toLowerCase().includes(query))
        );
        
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setActiveSuggestionIdx(0);
        return;
      }
    }
    
    setShowSuggestions(false);
    setSuggestionsTriggerIdx(-1);
  };

  const handleToKeyDown = (e) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIdx(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIdx(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectMember(suggestions[activeSuggestionIdx]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
    }
  };

  const selectMember = (m) => {
    if (suggestionsTriggerIdx === -1) return;
    
    const beforeAt = formData.to.slice(0, suggestionsTriggerIdx);
    const newTo = beforeAt + m.full_name;
    setFormData(prev => ({ ...prev, to: newTo }));
    setShowSuggestions(false);
    setSuggestionsTriggerIdx(-1);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.content.trim()) return;

    setSubmitting(true);

    const newMsg = {
      author: isAnonymous ? 'Ẩn danh' : (member?.full_name || 'Ẩn danh'),
      author_mshs: member?.mshs || null,
      recipient: formData.to || 'Cả lớp',
      content: formData.content.trim(),
      likes: 0,
    };

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([newMsg])
        .select()
        .single();

      if (error) {
        console.warn('Insert error:', error.message);
        // Fallback local
        setMessages(prev => [{ ...newMsg, id: Date.now().toString(), created_at: new Date().toISOString() }, ...prev]);
      } else {
        // Only prepend if it matches the current filter/search
        let matches = true;
        if (filter === 'received') {
          const toName = data.recipient.toLowerCase();
          const fullName = member?.full_name?.toLowerCase() || '';
          const shortName = member?.short_name?.toLowerCase() || '';
          if (!toName.includes(fullName) && !toName.includes(shortName)) {
            matches = false;
          }
        } else if (filter === 'sent' && data.author_mshs !== member?.mshs) {
          matches = false;
        } else if (filter === 'anonymous' && data.author !== 'Ẩn danh' && data.author_mshs !== null) {
          matches = false;
        }

        if (debouncedSearch) {
          const s = debouncedSearch.toLowerCase();
          if (!data.content.toLowerCase().includes(s) &&
              !data.author.toLowerCase().includes(s) &&
              !data.recipient.toLowerCase().includes(s)) {
            matches = false;
          }
        }

        if (matches) {
          setMessages(prev => [data, ...prev]);
        }
      }
    } catch (err) {
      setMessages(prev => [{ ...newMsg, id: Date.now().toString(), created_at: new Date().toISOString() }, ...prev]);
    }

    setFormData({ to: '', content: '' });
    setIsAnonymous(false);
    setShowForm(false);
    setSubmitting(false);
  }

  async function handleLike(id) {
    if (likedMessages.includes(id)) return;

    const newLiked = [...likedMessages, id];
    setLikedMessages(newLiked);
    localStorage.setItem('liked_message_items', JSON.stringify(newLiked));

    // Optimistic update
    setMessages(prev => prev.map(m =>
      m.id === id ? { ...m, likes: (m.likes || 0) + 1 } : m
    ));

    try {
      const msg = messages.find(m => m.id === id);
      const { error } = await supabase
        .from('messages')
        .update({ likes: (msg?.likes || 0) + 1 })
        .eq('id', id);
      if (error) console.error('Error updating likes on messages:', error);
    } catch (err) {
      console.error('Error in handleLike:', err);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.85, rotate: -3 },
    show: { opacity: 1, scale: 1, rotate: 0, transition: { duration: 0.5, type: 'spring', damping: 12 } }
  };

  const noteColors = ['#fff9c4', '#e1f5fe', '#fce4ec', '#e8f5e9', '#f3e5f5', '#fff3e0'];
  const pinColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="page-container container section">
      <motion.div
        className="page-header text-center"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="page-title">Góc Lưu Bút</h1>
        <p className="page-subtitle">Viết lại những tâm tư, tình cảm gửi gắm cho nhau</p>

        <motion.button
          className="btn btn-primary"
          style={{ marginTop: '1.5rem' }}
          onClick={() => setShowForm(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PenTool size={18} /> Viết Lưu Bút
        </motion.button>
      </motion.div>

      {/* Messages Search and filter toolbar */}
      <div className="gallery-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center', width: '100%', maxWidth: '600px', margin: '1.5rem auto 2.5rem' }}>
        {/* Search Input */}
        <div className="search-bar glass" style={{ width: '100%', margin: 0 }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo nội dung, người gửi, người nhận..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'received', label: 'Gửi cho tôi' },
            { key: 'sent', label: 'Tôi đã viết' },
            { key: 'anonymous', label: 'Ẩn danh' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Write form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              className="modal-content glass write-form-modal"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowForm(false)}>
                <X size={24} />
              </button>
              <h2 className="form-title">Viết Lưu Bút</h2>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Đăng với tên: <strong>{isAnonymous ? 'Ẩn danh' : (member?.full_name || 'Ẩn danh')}</strong>
              </p>
              <form onSubmit={handleSubmit} className="write-form">
                <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  <label htmlFor="anonymous" style={{ margin: 0, cursor: 'pointer', fontSize: '0.9rem' }}>Đăng ẩn danh (Không hiện tên)</label>
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Gửi đến</label>
                  <input
                    type="text"
                    placeholder="Cả lớp, hoặc tên cụ thể... (Gõ @ để tag)"
                    value={formData.to}
                    onChange={handleToChange}
                    onKeyDown={handleToKeyDown}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    autoComplete="off"
                  />
                  {showSuggestions && (
                    <div className="tag-suggestions-dropdown glass">
                      {suggestions.map((m, index) => (
                        <div
                          key={m.mshs}
                          className={`tag-suggestion-item ${index === activeSuggestionIdx ? 'active' : ''}`}
                          onClick={() => selectMember(m)}
                          onMouseEnter={() => setActiveSuggestionIdx(index)}
                        >
                          <div className="suggestion-avatar" style={{ background: m.color || 'var(--ptnk-blue)' }}>
                            {m.short_name?.charAt(0) || m.full_name?.charAt(0)}
                          </div>
                          <div className="suggestion-info">
                            <span className="suggestion-name">{m.full_name}</span>
                            {m.nickname && <span className="suggestion-nickname">({m.nickname})</span>}
                          </div>
                          <span className="suggestion-mshs">{m.mshs}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Lời nhắn</label>
                  <textarea
                    placeholder="Viết những lời tâm sự, kỷ niệm đẹp nhất..."
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={5}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 size={18} className="spin-icon" /> : <Send size={18} />}
                  {submitting ? 'Đang gửi...' : 'Gửi Lưu Bút'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {loading ? (
        <MessagesSkeleton count={6} />
      ) : messages.length === 0 ? (
        <div className="empty-state text-center" style={{ padding: '4rem 1.5rem' }}>
          <MessageSquare size={48} style={{ display: 'block', margin: '0 auto 1rem', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)' }}>Chưa có lưu bút nào phù hợp với bộ lọc hiện tại.</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Hãy là người đầu tiên để lại lời nhắn yêu thương!</p>
        </div>
      ) : (
        <>
          <motion.div
            className="messages-board"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {messages.map((msg, index) => (
              <MessageNote
                key={msg.id}
                msg={msg}
                index={index}
                noteColors={noteColors}
                pinColors={pinColors}
                handleLike={handleLike}
                isLiked={likedMessages.includes(msg.id)}
                formatDate={formatDate}
                itemVariants={itemVariants}
              />
            ))}
          </motion.div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex-center" style={{ marginTop: '3rem' }}>
              <button
                className="btn btn-outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{ minWidth: '150px' }}
              >
                {loadingMore ? (
                  <><Loader2 size={16} className="spin-icon" /> Đang tải...</>
                ) : (
                  'Tải thêm lưu bút'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Messages;
