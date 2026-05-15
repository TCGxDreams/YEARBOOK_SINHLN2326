import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronDown, Users, GraduationCap, BookOpen, Sparkles, ArrowRight, ImageIcon, PenTool, Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import bentoMembers from '../assets/bento-members.jpg';
import bentoGallery from '../assets/bento-gallery.jpg';
import bentoMessages from '../assets/bento-messages.jpg';
import './Home.css';

/* ─── Animated counter hook ────────────────── */
function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return { count, ref };
}

/* ─── Floating particles ──────────────────── */
const Particles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.3 + 0.1,
  }));

  return (
    <div className="particles-container">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

/* ─── Stat card with Lucide icon ───────────── */
const StatCard = ({ Icon, value, label, suffix = '' }) => {
  const { count, ref } = useCounter(value);
  return (
    <motion.div
      ref={ref}
      className="stat-card glass-card"
      whileHover={{ scale: 1.05, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="stat-icon">
        <Icon size={22} strokeWidth={1.8} />
      </div>
      <div className="stat-value">{count}{suffix}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
};

/* ─── Timeline ─────────────────────────────── */
const timelineData = [
  { year: '2023', title: 'Năm nhất — Khởi đầu', desc: 'Ngày đầu bước chân vào PTNK, bỡ ngỡ nhưng đầy háo hức. Bắt đầu làm quen với nhau và xây dựng tập thể SINHLN.' },
  { year: '2024', title: 'Năm hai — Trưởng thành', desc: 'Cùng nhau vượt qua những kỳ thi, tham gia các cuộc thi Olympic, và những chuyến dã ngoại đáng nhớ.' },
  { year: '2025', title: 'Năm ba — Bứt phá', desc: 'Ôn thi Đại học, những đêm thức trắng, nhưng luôn có nhau. Gắn bó hơn bao giờ hết.' },
  { year: '2026', title: 'Chia tay — Hẹn gặp lại', desc: 'Ngày chia tay, mỗi người một hướng đi, nhưng mãi là gia đình SINHLN2326.' },
];

const Home = () => {
  return (
    <div className="home-page">
      {/* ─── HERO ────────────────────────────── */}
      <section className="hero">
        <Particles />

        <div className="hero-content container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-badge"
          >
            <Sparkles size={14} strokeWidth={2} />
            <span>Lưu bút Online — Khóa 23-26</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hero-title"
          >
            Ptnkers{' '}
            <span className="highlight">SINHLN2326</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="hero-subtitle"
          >
            Nơi lưu giữ những thanh xuân rực rỡ nhất của tập thể 12 SinhLN
            <br />
            trường Phổ thông Năng khiếu. Ba năm một chặng đường, mãi là một gia đình.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="hero-actions"
          >
            <Link to="/messages" className="btn btn-primary">
              <PenTool size={18} /> Viết Lưu Bút
            </Link>
            <Link to="/gallery" className="btn btn-outline">
              <ImageIcon size={18} /> Xem Kỷ Niệm
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="scroll-indicator"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown size={28} />
        </motion.div>

        {/* Background blobs */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </section>

      {/* ─── STATS ───────────────────────────── */}
      <section className="stats-section container">
        <motion.div
          className="stats-grid"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <StatCard Icon={Users} value={41} label="Thành viên" />
          <StatCard Icon={GraduationCap} value={3} label="Năm bên nhau" />
          <StatCard Icon={BookOpen} value={1000} label="Kỷ niệm" suffix="+" />
          <StatCard Icon={Heart} value={1} label="Gia đình duy nhất" />
        </motion.div>
      </section>

      {/* ─── BENTO NAVIGATION ─────────────────── */}
      <section className="bento-section container section">
        <motion.div
          className="page-header text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="section-label">Khám Phá</span>
          <h2 className="section-title">Hành Trình Của Chúng Ta</h2>
          <p className="section-subtitle">Cùng nhau lật giở từng trang kỷ yếu</p>
        </motion.div>

        <div className="bento-grid">
          {/* Card: Members */}
          <Link to="/members" className="bento-card bento-card--large">
            <div className="bento-bg bento-bg--members" style={{ backgroundImage: `url(${bentoMembers})` }} />
            <div className="bento-overlay" />
            <div className="bento-icon-wrap">
              <Users size={24} />
            </div>
            <div className="bento-card-content">
              <span className="bento-label">01 — THÀNH VIÊN</span>
              <h3 className="bento-card-title">Gia Đình SINHLN</h3>
              <p className="bento-card-desc">
                41 mảnh ghép tạo nên tập thể 12 SinhLN mỗi người một cá tính, nhưng luôn gắn kết bền chặt.
              </p>
            </div>
            <div className="bento-arrow">
              <ArrowRight size={24} />
            </div>
          </Link>

          <div className="bento-col">
            {/* Card: Gallery */}
            <Link to="/gallery" className="bento-card bento-card--medium">
              <div className="bento-bg bento-bg--gallery" style={{ backgroundImage: `url(${bentoGallery})` }} />
              <div className="bento-overlay bento-overlay--warm" />
              <div className="bento-icon-wrap bento-icon--warm">
                <ImageIcon size={24} />
              </div>
              <div className="bento-card-content">
                <span className="bento-label">02 — KỶ NIỆM</span>
                <h3 className="bento-card-title">Bộ Sưu Tập Ảnh</h3>
                <p className="bento-card-desc">
                  Những khoảnh khắc đáng nhớ từ lớp học, dã ngoại, và các sự kiện đặc biệt.
                </p>
              </div>
              <div className="bento-arrow">
                <ArrowRight size={24} />
              </div>
            </Link>

            {/* Card: Messages */}
            <Link to="/messages" className="bento-card bento-card--medium">
              <div className="bento-bg bento-bg--messages" style={{ backgroundImage: `url(${bentoMessages})` }} />
              <div className="bento-overlay bento-overlay--blue" />
              <div className="bento-icon-wrap bento-icon--blue">
                <PenTool size={24} />
              </div>
              <div className="bento-card-content">
                <span className="bento-label">03 — LƯU BÚT</span>
                <h3 className="bento-card-title">Lời Nhắn Gửi</h3>
                <p className="bento-card-desc">
                  Viết và đọc những lời tâm sự, kỷ niệm và lời chúc từ bạn bè.
                </p>
              </div>
              <div className="bento-arrow">
                <ArrowRight size={24} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TIMELINE ────────────────────────── */}
      <section className="timeline-section container section">
        <motion.div
          className="page-header text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="section-label">Dấu Mốc</span>
          <h2 className="section-title">Hành Trình 3 Năm</h2>
          <p className="section-subtitle">Những cột mốc đáng nhớ nhất</p>
        </motion.div>

        <div className="timeline">
          {timelineData.map((item, index) => (
            <motion.div
              key={item.year}
              className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'}`}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <div className="timeline-card glass-card">
                <span className="timeline-year">{item.year}</span>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </motion.div>
          ))}
          <div className="timeline-line" />
        </div>
      </section>

      {/* ─── QUOTE ────────────────────────────── */}
      <section className="quote-section">
        <div className="quote-glow" />
        <div className="container quote-inner">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Star size={40} className="quote-star" />
            <blockquote className="quote-text">
              "Thanh xuân là khi ta có nhau"
            </blockquote>
            <p className="quote-desc">
              Ba năm bên nhau sẽ mãi là quãng thời gian đẹp nhất. Dù mai này mỗi người một ngả,
              SINHLN2326 vẫn mãi là gia đình.
            </p>
            <Link to="/messages" className="quote-cta">
              Viết lưu bút ngay <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
