"use client";

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description?: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  icon?: ReactNode;
}

const alertConfig = {
  info: {
    icon: Info,
    iconBg: 'bg-[#E3F2FD]',
    iconColor: 'text-[#42A5F5]',
    borderColor: 'border-[#42A5F5]/20',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-[#F1F8E9]',
    iconColor: 'text-[#66BB6A]',
    borderColor: 'border-[#66BB6A]/20',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-[#FFF8E1]',
    iconColor: 'text-[#FFB74D]',
    borderColor: 'border-[#FFB74D]/20',
  },
  error: {
    icon: AlertCircle,
    iconBg: 'bg-[#FFEBEE]',
    iconColor: 'text-[#EF5350]',
    borderColor: 'border-[#EF5350]/20',
  },
};

export function AlertPopup({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  type = 'info',
  confirmText = '확인',
  cancelText = '취소',
  showCancel = true,
  icon,
}: AlertPopupProps) {
  const config = alertConfig[type];
  const IconComponent = config.icon;

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                'bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.15)] border-2',
                config.borderColor
              )}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-[#E0E0E0] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-[#757575]" />
              </button>

              <div className="p-6 pt-8">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div
                    className={cn(
                      'w-16 h-16 rounded-2xl flex items-center justify-center',
                      config.iconBg
                    )}
                  >
                    {icon || <IconComponent className={cn('w-8 h-8', config.iconColor)} />}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-[#1A1A1A] font-bold text-xl text-center mb-2">
                  {title}
                </h2>

                {/* Description */}
                {description && (
                  <p className="text-[#757575] text-center text-sm leading-relaxed mb-6">
                    {description}
                  </p>
                )}

                {/* Actions */}
                <div className={cn('flex gap-3', showCancel ? 'flex-row' : 'flex-col')}>
                  {showCancel && (
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="flex-1 h-12 rounded-xl border-[#E0E0E0] text-[#757575] hover:bg-[#F5F5F5] hover:text-[#1A1A1A] font-semibold transition-all"
                    >
                      {cancelText}
                    </Button>
                  )}
                  <Button
                    onClick={handleConfirm}
                    className={cn(
                      'flex-1 h-12 rounded-xl font-semibold transition-all shadow-lg',
                      type === 'error'
                        ? 'bg-[#EF5350] hover:bg-[#E53935] text-white shadow-[#EF5350]/30'
                        : type === 'warning'
                        ? 'bg-[#FFB74D] hover:bg-[#FFA726] text-white shadow-[#FFB74D]/30'
                        : 'bg-[#66BB6A] hover:bg-[#4CAF50] text-white shadow-[#66BB6A]/30'
                    )}
                  >
                    {confirmText}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// 로그인 필요 팝업 전용 컴포넌트
interface LoginRequiredPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export function LoginRequiredPopup({ isOpen, onClose, onLogin }: LoginRequiredPopupProps) {
  return (
    <AlertPopup
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onLogin}
      type="info"
      title="로그인이 필요합니다"
      description="이 기능을 사용하려면 로그인이 필요해요. 로그인 페이지로 이동하시겠어요?"
      confirmText="로그인하기"
      cancelText="나중에"
      showCancel={true}
    />
  );
}
