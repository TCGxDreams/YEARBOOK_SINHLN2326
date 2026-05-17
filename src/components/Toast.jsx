import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import './Toast.css';

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  info:    Info,
  warning: AlertTriangle,
};

const Toast = ({ message, type, onDismiss }) => {
  const Icon = ICONS[type] || Info;
  return (
    <motion.div
      className={`toast toast-${type}`}
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 320 }}
      layout
    >
      <Icon size={20} className="toast-icon" strokeWidth={2.2} />
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onDismiss} aria-label="Đóng">
        <X size={16} />
      </button>
    </motion.div>
  );
};

export default Toast;