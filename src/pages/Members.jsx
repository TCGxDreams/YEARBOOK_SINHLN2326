import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { localMembers } from '../data/members';
import './Pages.css';

const Members = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('mshs');

      if (data && !error && data.length > 0) {
        setMembers(data);
      } else {
        // Fallback local
        setMembers(localMembers);
      }
    } catch {
      setMembers(localMembers);
    }
    setLoading(false);
  }

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.short_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.mshs.includes(searchTerm)
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }
  };

  return (
    <div className="page-container container section">
      <motion.div
        className="page-header text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="page-title">Gia đình SINHLN</h1>
        <p className="page-subtitle">41 mảnh ghép làm nên thanh xuân rực rỡ nhất</p>

        <div className="search-bar glass">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc MSHS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <p className="member-count">{filtered.length} / {members.length} thành viên</p>
      </motion.div>

      {loading ? (
        <div className="flex-center" style={{ padding: '4rem' }}>
          <Loader2 size={32} className="spin-icon" style={{ color: 'var(--ptnk-blue)' }} />
        </div>
      ) : (
        <motion.div
          className="members-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          key={searchTerm}
        >
          {filtered.map(member => (
            <motion.div
              key={member.mshs}
              className="member-card glass-card premium-member-card"
              variants={itemVariants}
              onClick={() => setSelectedMember(member)}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="member-card-header" style={{ background: `linear-gradient(135deg, ${member.color}22, transparent)` }}>
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.full_name}
                    className="member-avatar-img"
                  />
                ) : (
                  <div className="member-avatar" style={{ background: `linear-gradient(135deg, ${member.color}, ${member.color}dd)` }}>
                    <span>{member.short_name?.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="member-info">
                <h3 className="member-name-editorial">{member.full_name}</h3>
                <div className="member-mshs-badge">
                  <span className="mshs-label">MSHS</span>
                  <span className="mshs-value">{member.mshs}</span>
                </div>
                {member.nickname && <p className="member-nickname">"{member.nickname}"</p>}
                {member.quote && (
                  <div className="member-quote-container">
                    <span className="quote-mark">"</span>
                    <p className="member-quote">{member.quote}</p>
                  </div>
                )}
              </div>
              <div className="member-card-footer">
                <span className="view-profile-text">Xem hồ sơ</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state text-center">
          <p>Không tìm thấy thành viên nào phù hợp</p>
        </div>
      )}

      {/* Member detail modal */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              className="modal-content glass"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setSelectedMember(null)}>
                <X size={24} />
              </button>
              {selectedMember.avatar_url ? (
                <img
                  src={selectedMember.avatar_url}
                  alt={selectedMember.full_name}
                  className="modal-avatar-img"
                />
              ) : (
                <div className="modal-avatar" style={{ background: `linear-gradient(135deg, ${selectedMember.color}, ${selectedMember.color}99)` }}>
                  <span>{selectedMember.short_name?.charAt(0)}</span>
                </div>
              )}
              <h2>{selectedMember.full_name}</h2>
              {selectedMember.nickname && <p className="modal-nickname">"{selectedMember.nickname}"</p>}
              <div className="modal-details">
                <div className="detail-item">
                  <strong>MSHS:</strong> {selectedMember.mshs}
                </div>
                <div className="detail-item">
                  <strong>Lớp:</strong> 12 SINH-LN
                </div>
                <div className="detail-item">
                  <strong>Trường:</strong> Phổ thông Năng khiếu — ĐHQG TP.HCM
                </div>
                {selectedMember.quote && (
                  <div className="detail-item">
                    <strong>Châm ngôn:</strong> "{selectedMember.quote}"
                  </div>
                )}
                {selectedMember.bio && (
                  <div className="detail-item">
                    <strong>Giới thiệu:</strong> {selectedMember.bio}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Members;
