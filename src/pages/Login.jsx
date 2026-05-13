import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from '../assets/logo.png';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [mshs, setMshs] = useState('');
  const [password, setPassword] = useState('Ptnk@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!mshs.trim()) {
      setError('Vui lòng nhập MSHS!');
      return;
    }

    setLoading(true);
    const { error: loginError } = await login(mshs.trim(), password);

    if (loginError) {
      setError(loginError.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-blobs">
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div className="login-blob login-blob-3" />
      </div>

      <motion.div
        className="login-card glass"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: 'spring', damping: 15 }}
      >
        {/* Header */}
        <div className="login-header">
          <motion.div
            className="login-logo"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <img src={logo} alt="SINHLN2326" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </motion.div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="mshs">Mã số học sinh (MSHS)</label>
            <input
              id="mshs"
              type="text"
              placeholder="VD: 232401"
              value={mshs}
              onChange={(e) => setMshs(e.target.value)}
              autoFocus
              maxLength={6}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Mật khẩu</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="login-spinner" />
            ) : (
              <>
                <LogIn size={18} /> Đăng Nhập
              </>
            )}
          </button>
        </form>

        <p className="login-hint">
          Mật khẩu mặc định: <code>Ptnk@123</code>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
