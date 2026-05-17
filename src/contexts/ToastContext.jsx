import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast from '../components/Toast';

const ToastContext = createContext(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast phải dùng trong ToastProvider');
    return ctx;
};

let nextId = 1;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const show = useCallback((message, options = {}) => {
        const id = nextId++;
        const toast = {
            id,
            message,
            type: options.type || 'info',
            duration: options.duration ?? 4000,
        };
        setToasts(prev => [...prev, toast]);

        if (toast.duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, toast.duration);
        }
        return id;
    }, []);

    const value = {
        show,
        dismiss,
        success: (msg, opts) => show(msg, { ...opts, type: 'success' }),
        error: (msg, opts) => show(msg, { ...opts, type: 'error' }),
        info: (msg, opts) => show(msg, { ...opts, type: 'info' }),
        warning: (msg, opts) => show(msg, { ...opts, type: 'warning' }),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-container" role="status" aria-live="polite">
                <AnimatePresence>
                    {toasts.map(t => (
                        <Toast key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};