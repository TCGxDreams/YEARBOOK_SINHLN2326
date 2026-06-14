import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';        // ⭐ NEW
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import AIChatbox from './components/AIChatbox';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const Members = lazy(() => import('./pages/Members'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Messages = lazy(() => import('./pages/Messages'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const MemberProfile = lazy(() => import('./pages/MemberProfile'));
const PrintYearbook = lazy(() => import('./pages/PrintYearbook'));
const Styleguide = lazy(() => import('./pages/Styleguide'));

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
          <Route path="/members/:mshs" element={<ProtectedRoute><MemberProfile /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/print-yearbook" element={<ProtectedRoute><PrintYearbook /></ProtectedRoute>} />
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
        <Suspense fallback={
          <div className="loading-screen flex-center" style={{ minHeight: '50vh' }}>
            <div className="login-spinner" style={{ width: 40, height: 40, borderWidth: 3, borderColor: 'var(--border-color)', borderTopColor: 'var(--ptnk-blue)' }} />
          </div>
        }>
          <AnimatedRoutes />
        </Suspense>
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