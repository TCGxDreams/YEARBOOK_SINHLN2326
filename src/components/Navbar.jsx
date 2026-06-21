import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Home, Users, Image as ImageIcon, BookHeart, Moon, Sun, Menu, X, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const Navbar = ({ darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { member, isAdmin, logout } = useAuth();

  const links = [
    { path: '/', label: 'Trang Chủ', icon: <Home size={18} /> },
    { path: '/members', label: 'Thành Viên', icon: <Users size={18} /> },
    { path: '/gallery', label: 'Kỷ Niệm', icon: <ImageIcon size={18} /> },
    { path: '/messages', label: 'Lưu Bút', icon: <BookHeart size={18} /> },
  ];

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
  };

  return (
    <motion.nav
      className="navbar glass"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 80, damping: 15 }}
    >
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo" onClick={() => setMobileOpen(false)}>
          <img src={logo} alt="SINHLN2326" className="logo-img" />
          <span className="logo-text">SINHLN2326</span>
        </Link>

        <ul className="navbar-links desktop-links">
          {links.map(({ path, label, icon }) => (
            <li key={path}>
              <Link
                to={path}
                className={`nav-link ${location.pathname === path ? 'active' : ''}`}
              >
                <span className="nav-icon">{icon}</span>
                <span>{label}</span>
                {location.pathname === path && (
                  <motion.div className="nav-indicator" layoutId="nav-indicator" />
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className="navbar-actions">
          {/* Profile link */}
          {member && (
            <Link
              to="/profile"
              className="user-badge"
              data-tooltip={`MSHS: ${member.mshs}`}
              onClick={() => setMobileOpen(false)}
            >
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.short_name} className="user-badge-avatar-img" />
              ) : (
                <div className="user-badge-avatar" style={{ background: member.color }}>
                  {member.short_name?.charAt(0)}
                </div>
              )}
              <span className="user-badge-name">{member.short_name}</span>
            </Link>
          )}

          {/* Admin link */}
          {isAdmin && (
            <Link
              to="/admin"
              className={`btn-ghost admin-nav-btn ${location.pathname === '/admin' ? 'active' : ''}`}
              data-tooltip="Bảng điều khiển"
              onClick={() => setMobileOpen(false)}
            >
              <Shield size={18} />
            </Link>
          )}

          <NotificationBell />

          <button
            className="theme-toggle"
            onClick={toggleDarkMode}
            data-tooltip={darkMode ? 'Giao diện sáng' : 'Giao diện tối'}
          >
            {!darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            className="logout-btn"
            onClick={handleLogout}
            aria-label="Đăng xuất"
            data-tooltip="Đăng xuất"
          >
            <LogOut size={18} />
          </button>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div
        className="mobile-menu"
        initial={false}
        animate={mobileOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ul className="mobile-links">
          {links.map(({ path, label, icon }) => (
            <li key={path}>
              <Link
                to={path}
                className={`mobile-nav-link ${location.pathname === path ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="nav-icon">{icon}</span>
                <span>{label}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/profile"
              className={`mobile-nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-icon"><User size={18} /></span>
              <span>Trang cá nhân</span>
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link
                to="/admin"
                className={`mobile-nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span className="nav-icon"><Shield size={18} /></span>
                <span>Admin Panel</span>
              </Link>
            </li>
          )}
          <li>
            <button className="mobile-nav-link mobile-logout" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Đăng xuất</span>
            </button>
          </li>
        </ul>
      </motion.div>
    </motion.nav>

  );
};

export default Navbar;
