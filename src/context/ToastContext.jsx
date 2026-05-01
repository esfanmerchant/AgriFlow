import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const iconMap = {
  success: CheckCircle2,
  error:   AlertTriangle,
  info:    Info,
};
const colorMap = {
  success: 'text-mint-300 border-mint-400/30',
  error:   'text-red-300  border-red-400/30',
  info:    'text-cream    border-white/20',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((opts) => {
    const id = Date.now() + Math.random();
    const t = { id, type: 'info', duration: 3200, ...opts };
    setToasts((prev) => [...prev, t]);
    if (t.duration > 0) setTimeout(() => dismiss(id), t.duration);
    return id;
  }, [dismiss]);

  const api = useMemo(() => ({
    toast,
    success: (title, body) => toast({ type: 'success', title, body }),
    error:   (title, body) => toast({ type: 'error',   title, body }),
    info:    (title, body) => toast({ type: 'info',    title, body }),
    dismiss,
  }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-[9998] flex flex-col items-center sm:items-end gap-3 pointer-events-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = iconMap[t.type] || Info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0,  scale: 1 }}
                exit={{    opacity: 0, x: 40, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`pointer-events-auto gradient-border px-4 py-3 pr-9 min-w-[280px] max-w-sm shadow-glow-soft ${colorMap[t.type]}`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={18} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-cream text-sm">{t.title}</div>
                    {t.body && <div className="text-xs text-cream/70 mt-0.5">{t.body}</div>}
                  </div>
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="absolute top-2.5 right-2.5 text-cream/50 hover:text-cream"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
