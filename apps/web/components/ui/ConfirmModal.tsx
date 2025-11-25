'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import { ReactNode } from 'react';

type ModalVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ModalVariant;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  variant = 'info',
  isLoading = false
}: ConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  const variantConfig = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      buttonBg: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      glowColor: 'bg-red-500/20'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
      buttonBg: 'from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700',
      glowColor: 'bg-yellow-500/20'
    },
    info: {
      icon: Info,
      iconColor: 'text-afflyt-cyan-400',
      iconBg: 'bg-afflyt-cyan-500/20',
      borderColor: 'border-afflyt-cyan-500/30',
      buttonBg: 'from-afflyt-cyan-500 to-blue-600 hover:from-afflyt-cyan-600 hover:to-blue-700',
      glowColor: 'bg-afflyt-cyan-500/20'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      buttonBg: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
      glowColor: 'bg-green-500/20'
    }
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 ${config.glowColor} blur-3xl rounded-2xl`} />

              {/* Modal content */}
              <div className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden">
                {/* Animated border */}
                <div className={`absolute inset-0 bg-gradient-to-r ${config.borderColor} opacity-50 blur-sm`} />

                <div className="relative p-6">
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-800/50 hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 rounded-xl ${config.iconBg} border ${config.borderColor} flex items-center justify-center`}>
                      <Icon className={`w-8 h-8 ${config.iconColor}`} />
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-white text-center mb-3">
                    {title}
                  </h2>

                  {/* Message */}
                  <div className="text-gray-300 text-center mb-6">
                    {typeof message === 'string' ? (
                      <p>{message}</p>
                    ) : (
                      message
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelText}
                    </button>

                    <button
                      onClick={handleConfirm}
                      disabled={isLoading}
                      className={`flex-1 px-4 py-3 bg-gradient-to-r ${config.buttonBg} text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          Attendere...
                        </>
                      ) : (
                        confirmText
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
