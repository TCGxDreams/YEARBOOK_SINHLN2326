import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PenTool, Image as ImageIcon, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getPhotoSrc } from '../lib/uploadPhoto';
import './ActivityFeed.css';

/**
 * Time-ago helper — Vietnamese
 */
function timeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} tuần trước`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} tháng trước`;
    const years = Math.floor(days / 365);
    return `${years} năm trước`;
}

/**
 * Card cho 1 hoạt động (lưu bút hoặc ảnh)
 */
const ActivityCard = ({ item, index }) => {
    const isMessage = item._kind === 'message';
    const Icon = isMessage ? PenTool : ImageIcon;
    const link = isMessage ? '/messages' : '/gallery';

    const author = isMessage
        ? (item.author === 'Ẩn danh' ? 'Ẩn danh' : item.author)
        : (item.uploaded_by_name || 'Ai đó');

    const preview = isMessage
        ? (item.content?.length > 90 ? item.content.slice(0, 90) + '…' : item.content)
        : (item.caption || 'Ảnh kỷ niệm');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
        >
            <Link to={link} className="activity-card glass-card">
                {!isMessage && item.image_url || item.drive_file_id ? (
                    <div
                        className="activity-thumb"
                        style={{ backgroundImage: `url(${getPhotoSrc(item, 200)})` }}
                    />
                ) : (
                    <div className={`activity-icon ${isMessage ? 'activity-icon-msg' : 'activity-icon-photo'}`}>
                        <Icon size={18} strokeWidth={2.2} />
                    </div>
                )}

                <div className="activity-content">
                    <div className="activity-header">
                        <span className="activity-author">{author}</span>
                        <span className={`activity-badge activity-badge-${isMessage ? 'msg' : 'photo'}`}>
                            {isMessage ? 'Lưu bút' : 'Ảnh'}
                        </span>
                    </div>
                    <p className="activity-text">{preview}</p>
                    <div className="activity-meta">
                        <Clock size={11} />
                        <span>{timeAgo(item.created_at)}</span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

/**
 * Main ActivityFeed component — fetch 3 message + 3 photo gần nhất, merge sort theo created_at
 */
const ActivityFeed = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, []);

    async function fetchActivities() {
        setLoading(true);
        try {
            const [msgsRes, galleryRes] = await Promise.all([
                supabase
                    .from('messages')
                    .select('id, author, recipient, content, created_at')
                    .order('created_at', { ascending: false })
                    .limit(3),
                supabase
                    .from('gallery')
                    .select('id, caption, uploaded_by_name, image_url, drive_file_id, created_at')
                    .order('created_at', { ascending: false })
                    .limit(3),
            ]);

            const messages = (msgsRes.data || []).map(m => ({ ...m, _kind: 'message' }));
            const photos = (galleryRes.data || []).map(p => ({ ...p, _kind: 'photo' }));

            const merged = [...messages, ...photos]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 6);

            setActivities(merged);
        } catch (e) {
            console.warn('[ActivityFeed] fetch error:', e);
        }
        setLoading(false);
    }

    if (!loading && activities.length === 0) return null;  // ẩn section nếu chưa có data

    return (
        <section className="activity-section container section">
            <motion.div
                className="page-header text-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
            >
                <span className="section-label">Hoạt động</span>
                <h2 className="section-title">Mới Nhất</h2>
                <p className="section-subtitle">Những lưu bút và kỷ niệm gần nhất từ cả lớp</p>
            </motion.div>

            {loading ? (
                <div className="activity-grid">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="activity-card glass-card skeleton-activity-card">
                            <div className="skeleton skeleton-activity-icon" />
                            <div style={{ flex: 1 }}>
                                <div className="skeleton skeleton-text" style={{ width: '40%', height: 14, marginBottom: 8 }} />
                                <div className="skeleton skeleton-text" style={{ width: '100%', height: 12, marginBottom: 6 }} />
                                <div className="skeleton skeleton-text" style={{ width: '60%', height: 12 }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="activity-grid">
                    {activities.map((item, i) => (
                        <ActivityCard
                            key={`${item._kind}-${item.id}`}
                            item={item}
                            index={i}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default ActivityFeed;