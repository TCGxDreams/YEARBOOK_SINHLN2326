import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { localMembers, MEMBER_COUNT } from '../data/members';
import { MembersSkeleton } from '../components/Skeleton';
import './Pages.css';

const isHoverable = typeof window !== 'undefined' ? window.matchMedia('(hover: hover)').matches : true;

const Members = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
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
        <p className="page-subtitle">{MEMBER_COUNT} mảnh ghép làm nên thanh xuân rực rỡ nhất</p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: '600px', margin: '0 auto 1.5rem', flexWrap: 'wrap' }}>
          <div className="search-bar glass" style={{ margin: 0, flex: 1, minWidth: '280px' }}>
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
          {/* Tạm thời ẩn nút in kỷ yếu */}
          {/*
          <button
            className="btn btn-outline"
            onClick={() => navigate('/print-yearbook')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', height: '48px', padding: '0 1.25rem' }}
          >
            <Printer size={18} /> Xuất PDF Kỷ Yếu
          </button>
          */}
        </div>

        <p className="member-count">{filtered.length} / {members.length} thành viên</p>
      </motion.div>

      {loading ? (
        <MembersSkeleton count={12} />
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
              onClick={() => navigate(`/members/${member.mshs}`)}
              whileHover={isHoverable ? { y: -5, scale: 1.02 } : undefined}
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
    </div>
  );
};

export default Members;
