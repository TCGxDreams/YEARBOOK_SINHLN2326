import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronDown, Users, GraduationCap, BookOpen, ArrowRight, ImageIcon, PenTool, Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
// ⭐ RESTORE: import 3 ảnh nền cho bento cards
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

/* ─── Stat card ─────────────────────────────── */
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

/* ─── 4-point sparkle SVG ──────────────────── */
const Sparkle = ({ size = 32 }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M12 1 L13.5 9.5 L22 11 L13.5 12.5 L12 23 L10.5 12.5 L2 11 L10.5 9.5 Z" />
  </svg>
);

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
      {/* ═══ HERO: yearbook editorial + sparkle decorations ═══ */}
      <section className="hero">
        {/* Warm decorative blobs */}
        <div className="hero-warm-blob hero-warm-blob-1" />
        <div className="hero-warm-blob hero-warm-blob-2" />

        {/* ⭐ Sparkles scattered 4 góc */}
        <div className="hero-sparkle hero-sparkle-tl"><Sparkle size={28} /></div>
        <div className="hero-sparkle hero-sparkle-tr"><Sparkle size={20} /></div>
        <div className="hero-sparkle hero-sparkle-bl"><Sparkle size={24} /></div>
        <div className="hero-sparkle hero-sparkle-br"><Sparkle size={32} /></div>
        <div className="hero-sparkle hero-sparkle-ml"><Sparkle size={16} /></div>
        <div className="hero-sparkle hero-sparkle-mr"><Sparkle size={18} /></div>

        <div className="hero-content container">
          {/* Greeting line với dấu gạch hai bên */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="hero-greeting"
          >
            <span className="dash-line" />
            <span>Phổ thông Năng khiếu · Khoá 2023 — 2026</span>
            <span className="dash-line" />
          </motion.div>

          {/* Main title: Ptnkers + SINHLN2326 handwritten */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hero-title"
          >
            <span className="hero-title-pre">Ptnkers</span>
            <span className="hero-title-main">
              SINHLN2326
              <svg
                className="hero-underline"
                viewBox="0 0 400 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M 5,12 Q 80,2 160,12 T 320,11 T 395,13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </motion.h1>

          {/* Subtitle ngắn, cảm xúc */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="hero-subtitle"
          >
            Ba năm một chặng đường,
            <br />
            mãi là một gia đình.
          </motion.p>

          {/* Heart accent */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="hero-heart"
          >
            <Heart size={16} fill="currentColor" />
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85 }}
            className="hero-actions"
          >
            <Link to="/messages" className="btn btn-primary">
              <PenTool size={18} /> Viết Lưu Bút
            </Link>
            <Link to="/gallery" className="btn btn-outline">
              <ImageIcon size={18} /> Xem Kỷ Niệm
            </Link>
          </motion.div>

          {/* ⭐ Signature dòng cuối — tạo cảm giác "letter signed" */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.1 }}
            className="hero-signature"
          >
            — viết bởi 41 trái tim của SINHLN —
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

      {/* ═══ BENTO NAVIGATION — ⭐ restore ảnh nền ═══ */}
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
          <Link to="/members" className="bento-card bento-card--large">
            {/* ⭐ Inline backgroundImage cho ảnh thật */}
            <div
              className="bento-bg bento-bg--members"
              style={{ backgroundImage: `url(${bentoMembers})` }}
            />
            <div className="bento-overlay" />
            <div className="bento-icon-wrap">
              <Users size={24} />
            </div>
            <div className="bento-card-content">
              <span className="bento-label">01 — THÀNH VIÊN</span>
              <h3 className="bento-card-title">Gia Đình SINHLN</h3>
              <p className="bento-card-desc">
                41 mảnh ghép tạo nên tập thể 12 Chuyên Sinh — mỗi người một cá tính, nhưng luôn gắn kết bền chặt.
              </p>
            </div>
            <div className="bento-arrow">
              <ArrowRight size={24} />
            </div>
          </Link>

          <div className="bento-col">
            <Link to="/gallery" className="bento-card bento-card--medium">
              <div
                className="bento-bg bento-bg--gallery"
                style={{ backgroundImage: `url(${bentoGallery})` }}
              />
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

            <Link to="/messages" className="bento-card bento-card--medium">
              <div
                className="bento-bg bento-bg--messages"
                style={{ backgroundImage: `url(${bentoMessages})` }}
              />
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