"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'info' | 'success' | 'warning' | 'error';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const toastConfig = {
  info: {
    icon: Info,
    bg: 'bg-[#E3F2FD]',
    border: 'border-[#42A5F5]/30',
    iconColor: 'text-[#42A5F5]',
    titleColor: 'text-[#1565C0]',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-[#F1F8E9]',
    border: 'border-[#66BB6A]/30',
    iconColor: 'text-[#66BB6A]',
    titleColor: 'text-[#2E7D32]',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-[#FFF8E1]',
    border: 'border-[#FFB74D]/30',
    iconColor: 'text-[#FFB74D]',
    titleColor: 'text-[#F57C00]',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-[#FFEBEE]',
    border: 'border-[#EF5350]/30',
    iconColor: 'text-[#EF5350]',
    titleColor: 'text-[#C62828]',
  },
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const config = toastConfig[toast.type];
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-2xl shadow-lg backdrop-blur-xl border',
        config.bg,
        config.border
      )}
    >
      <div className={cn('flex-shrink-0 mt-0.5', config.iconColor)}>
        <IconComponent className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('font-semibold text-sm', config.titleColor)}>
          {toast.title}
        </p>
        {toast.description && (
          <p className="text-[#757575] text-xs mt-1 leading-relaxed">
            {toast.description}
          </p>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 w-6 h-6 rounded-full bg-white/60 hover:bg-white flex items-center justify-center transition-colors"
      >
        <X className="w-3 h-3 text-[#757575]" />
      </button>
    </motion.div>
  );
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? 4000;

    setToasts((prev) => [...prev, { ...toast, id }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// 편의용 훅 함수들
export function useToastActions() {
  const { addToast } = useToast();

  return {
    info: (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
    success: (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    warning: (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),
    error: (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
  };
}
