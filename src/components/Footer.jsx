import { Heart, Mail, ExternalLink } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-wave">
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path d="M0,40 C360,100 720,0 1080,60 C1260,90 1380,50 1440,40 L1440,100 L0,100 Z" />
        </svg>
      </div>
      <div className="footer-content container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>SINHLN2326</h3>
            <p>Lớp 12 SinhLN — Phổ thông Năng khiếu</p>
            <p className="footer-quote">"Mãi là thanh xuân tươi đẹp nhất"</p>
          </div>

          <div className="footer-links">
            <h4>Liên Kết</h4>
            <a href="/">Trang Chủ</a>
            <a href="/members">Thành Viên</a>
            <a href="/gallery">Kỷ Niệm</a>
            <a href="/messages">Lưu Bút</a>
          </div>

          <div className="footer-contact">
            <h4>Liên Hệ</h4>
            <a href="mailto:cgxbill@gmail.com" className="footer-contact-link">
              <Mail size={16} /> cgxbill@gmail.com
            </a>
            <a href="https://ptnk.edu.vn" target="_blank" rel="noopener noreferrer" className="footer-contact-link">
              <ExternalLink size={16} /> ptnk.edu.vn
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            Made with <Heart size={14} className="heart-icon" /> by Ptnkers SINHLN2326 aka DrXeno — Khóa 2023–2026
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
