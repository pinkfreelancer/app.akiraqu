import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  iconBgClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  theme?: 'light' | 'dark';
  className?: string;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconClassName = 'text-cyan-400',
  iconBgClassName,
  children,
  footer,
  maxWidth = 'max-w-3xl',
  theme = 'dark',
  className = '',
}) => {
  const isDark = theme === 'dark';
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        className={`relative w-full ${maxWidth} rounded-2xl border p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh] transition-colors duration-200 ${
          isDark
            ? 'bg-[#0f172a] border-[#1e293b] text-slate-100'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        } ${className}`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className={`absolute right-4 top-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Optional Header */}
        {(title || Icon) && (
          <div className={`flex items-center gap-3 mb-4 pb-3 border-b ${
            isDark ? 'border-[#1e293b]' : 'border-slate-100'
          }`}>
            {Icon && (
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl border shrink-0 ${
                  iconBgClassName ||
                  (isDark
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-cyan-50 border-cyan-200')
                }`}
              >
                <Icon className={`w-5 h-5 ${iconClassName}`} />
              </div>
            )}
            <div className="flex-1 pr-6">
              {typeof title === 'string' ? (
                <h2 className={`text-base sm:text-lg font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {title}
                </h2>
              ) : (
                title
              )}
              {subtitle && (
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div>{children}</div>

        {/* Optional Footer */}
        {footer && (
          <div
            className={`mt-4 pt-3 border-t text-[11px] font-mono flex items-center justify-between ${
              isDark
                ? 'border-[#1e293b] text-slate-500'
                : 'border-slate-100 text-slate-600'
            }`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
