import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';        // ⭐ NEW
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Members from './pages/Members';
import Gallery from './pages/Gallery';
import Messages from './pages/Messages';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Styleguide from './pages/Styleguide';
import AIChatbox from './components/AIChatbox';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen flex-center" style={{ minHeight: '100vh' }}>
        <div className="login-spinner" style={{ width: 40, height: 40, borderWidth: 3, borderColor: 'var(--border-color)', borderTopColor: 'var(--ptnk-blue)' }} />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/styleguide" element={<ProtectedRoute><Styleguide /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('sinhln-darkmode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('sinhln-darkmode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const showChrome = user && !isLoginPage;

  return (
    <div className="app-container">
      {showChrome && <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
      <main>
        <AnimatedRoutes />
      </main>
      {showChrome && <Footer />}
      {showChrome && <ScrollToTop />}
      {showChrome && <AIChatbox />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>              {/* ⭐ NEW */}
          <AppContent />
        </ToastProvider>              {/* ⭐ NEW */}
      </AuthProvider>
    </Router>
  );
}

export default App;