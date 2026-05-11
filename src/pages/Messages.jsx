import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, X, Send, Heart, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import './Pages.css';

const Messages = () => {
  const { member } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ to: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  // Lấy tin nhắn từ Supabase
  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase messages table error:', error.message);
        // Dùng dữ liệu mẫu nếu bảng chưa tồn tại
        setMessages(getDefaultMessages());
      } else {
        setMessages(data || []);
      }
    } catch (err) {
      console.warn('Could not connect to Supabase, using local data');
      setMessages(getDefaultMessages());
    }
    setLoading(false);
  }

  function getDefaultMessages() {
    return [
      { id: '1', author: 'Cô giáo chủ nhiệm', author_mshs: null, recipient: 'Cả lớp SINHLN2326', content: 'Chúc các em 12 SINH-LN luôn giữ mãi ngọn lửa đam mê với Sinh học và đạt kết quả thật cao trong kỳ thi tốt nghiệp! Cô rất tự hào về các em!', likes: 41, created_at: '2026-05-10T10:00:00Z' },
      { id: '2', author: 'Bạn ẩn danh', author_mshs: null, recipient: 'SINHLN2326', content: 'Ba năm trôi qua nhanh quá. Cảm ơn các bạn đã luôn bên cạnh trong những lúc khó khăn nhất. SINHLN2326 mãi là gia đình!', likes: 35, created_at: '2026-05-09T15:00:00Z' },
    ];
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.content.trim()) return;

    setSubmitting(true);

    const newMsg = {
      author: member?.name || 'Ẩn danh',
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
        // Fallback: thêm vào local
        setMessages(prev => [{ ...newMsg, id: Date.now().toString(), created_at: new Date().toISOString() }, ...prev]);
      } else {
        setMessages(prev => [data, ...prev]);
      }
    } catch (err) {
      setMessages(prev => [{ ...newMsg, id: Date.now().toString(), created_at: new Date().toISOString() }, ...prev]);
    }

    setFormData({ to: '', content: '' });
    setShowForm(false);
    setSubmitting(false);
  }

  async function handleLike(id) {
    // Optimistic update
    setMessages(prev => prev.map(m =>
      m.id === id ? { ...m, likes: (m.likes || 0) + 1 } : m
    ));

    try {
      const msg = messages.find(m => m.id === id);
      await supabase
        .from('messages')
        .update({ likes: (msg?.likes || 0) + 1 })
        .eq('id', id);
    } catch (err) {
      // Ignore errors for likes
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
                Đăng với tên: <strong>{member?.name}</strong>
              </p>
              <form onSubmit={handleSubmit} className="write-form">
                <div className="form-group">
                  <label>Gửi đến</label>
                  <input
                    type="text"
                    placeholder="Cả lớp, hoặc tên cụ thể..."
                    value={formData.to}
                    onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                  />
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
        <div className="flex-center" style={{ padding: '4rem' }}>
          <Loader2 size={32} className="spin-icon" style={{ color: 'var(--ptnk-blue)' }} />
        </div>
      ) : (
        <motion.div
          className="messages-board"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
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
              <div className="note-content">{msg.content}</div>
              <div className="note-footer">
                <button className="note-like-btn" onClick={() => handleLike(msg.id)}>
                  <Heart size={14} /> {msg.likes || 0}
                </button>
                <div className="note-date">{formatDate(msg.created_at)}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Messages;
