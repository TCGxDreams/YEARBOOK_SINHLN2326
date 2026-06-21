import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Tag, BookHeart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import './NotificationBell.css';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'vừa xong';
  const m = Math.floor(s / 60); if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24); if (d < 7) return `${d} ngày trước`;
  const w = Math.floor(d / 7); if (w < 4) return `${w} tuần trước`;
  const mo = Math.floor(d / 30); if (mo < 12) return `${mo} tháng trước`;
  return `${Math.floor(d / 365)} năm trước`;
}

const NotificationBell = () => {
  const { member } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [freshIds, setFreshIds] = useState(new Set());
  const panelRef = useRef(null);
  const btnRef = useRef(null);
  const mshs = member?.mshs;

  // Fetch ban đầu
  useEffect(() => {
    if (!mshs) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_mshs', mshs)
        .order('created_at', { ascending: false })
        .limit(30);
      if (!active) return;
      const rows = data || [];
      setItems(rows);
      setUnread(rows.filter(n => !n.is_read).length);
    })();
    return () => { active = false; };
  }, [mshs]);

  // Realtime: thông báo mới
  useEffect(() => {
    if (!mshs) return;
    const ch = supabase
      .channel(`notif-${mshs}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_mshs=eq.${mshs}` },
        (payload) => {
          setItems(prev => [payload.new, ...prev].slice(0, 30));
          setUnread(u => u + 1);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [mshs]);

  // Click ra ngoài → đóng
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (panelRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const markAllRead = useCallback(async () => {
    if (!mshs || unread === 0) return;
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
    await supabase.from('notifications').update({ is_read: true })
      .eq('recipient_mshs', mshs).eq('is_read', false);
  }, [mshs, unread]);

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setFreshIds(new Set(items.filter(n => !n.is_read).map(n => n.id))); // vẫn highlight lần mở này
      markAllRead();
    }
  };

  const handleClickItem = (n) => {
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  if (!member) return null;

  return (
    <div className="notif">
      <button ref={btnRef} className="notif-btn" onClick={handleOpen} aria-label="Thông báo" data-tooltip="Thông báo">
        <Bell size={18} />
        {unread > 0 && <span className="notif-dot">{unread > 9 ? '9+' : unread}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            className="notif-panel glass"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <div className="notif-head">Thông báo</div>
            <div className="notif-list">
              {items.length === 0 ? (
                <div className="notif-empty">Chưa có thông báo nào</div>
              ) : (
                items.map(n => (
                  <button
                    key={n.id}
                    className={`notif-item ${freshIds.has(n.id) ? 'unread' : ''}`}
                    onClick={() => handleClickItem(n)}
                  >
                    <span className={`notif-ic notif-ic-${n.type}`}>
                      {n.type === 'tag' ? <Tag size={14} /> : <BookHeart size={14} />}
                    </span>
                    <span className="notif-body">
                      <span className="notif-text"><strong>{n.actor_name}</strong> {n.content}</span>
                      <span className="notif-time">{timeAgo(n.created_at)}</span>
                    </span>
                    {freshIds.has(n.id) && <span className="notif-unread-dot" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
