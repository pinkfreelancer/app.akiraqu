import React, { useEffect, useRef, useId, RefObject } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

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
  role?: 'dialog' | 'alertdialog';
  ariaLabel?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeOnBackdrop?: boolean;
  alignTop?: boolean;
  hideCloseButton?: boolean;
  noPadding?: boolean;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconClassName = 'text-[var(--accent-color,#ec4899)]',
  iconBgClassName,
  children,
  footer,
  maxWidth = 'max-w-3xl',
  theme: _theme,
  className = '',
  role = 'dialog',
  ariaLabel,
  initialFocusRef,
  closeOnBackdrop = true,
  alignTop = false,
  hideCloseButton = false,
  noPadding = false,
}) => {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descId = `${baseId}-desc`;

  const containerRef = useFocusTrap<HTMLDivElement>(isOpen, initialFocusRef);
  const mouseDownOnBackdropRef = useRef(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isTitleString = typeof title === 'string';

  return (
    <div
      role={role}
      aria-modal="true"
      aria-labelledby={isTitleString ? titleId : undefined}
      aria-label={!isTitleString ? ariaLabel : undefined}
      aria-describedby={subtitle ? descId : undefined}
      onMouseDown={(e) => {
        mouseDownOnBackdropRef.current = e.target === e.currentTarget;
      }}
      onMouseUp={(e) => {
        if (closeOnBackdrop && mouseDownOnBackdropRef.current && e.target === e.currentTarget) {
          onClose();
        }
        mouseDownOnBackdropRef.current = false;
      }}
      className={`fixed inset-0 z-50 flex ${alignTop ? 'items-start pt-16 sm:pt-24' : 'items-center'} justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150`}
    >
      <div
        ref={containerRef}
        className={`relative w-full ${maxWidth} rounded-[var(--radius-cards,2px)] border shadow-2xl flex flex-col max-h-[88vh] overflow-hidden transition-colors duration-200 bg-[var(--card-color)] border-[var(--border-color)] text-[var(--text-main)] ${className}`}
      >
        {/* Accessible Close Button */}
        {!hideCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup / Close"
            className="absolute right-3 top-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[var(--radius-buttons,2px)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--accent-subtle)] transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}

        {/* Optional Header (Pinned, never scrolls away) */}
        {(title || Icon) && (
          <div className={`shrink-0 flex items-center gap-3 border-b border-[var(--border-color)] ${noPadding ? 'p-4 sm:p-5 pb-3.5' : 'p-5 sm:p-6 pb-3.5'}`}>
            {Icon && (
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-[var(--radius-buttons,2px)] border shrink-0 ${
                  iconBgClassName || 'bg-[var(--accent-subtle)] border-[var(--border-color)]'
                }`}
              >
                <Icon className={`w-5 h-5 ${iconClassName}`} />
              </div>
            )}
            <div className="flex-1 pr-10 min-w-0">
              {isTitleString ? (
                <h2 id={titleId} className="text-base sm:text-lg font-bold font-display text-[var(--text-main)] truncate">
                  {title}
                </h2>
              ) : (
                title
              )}
              {subtitle && (
                <p id={descId} className="text-xs mt-0.5 text-[var(--text-muted)] truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Modal Body (Scrollable interior or flex column when noPadding) */}
        <div className={`flex-1 min-h-0 ${noPadding ? 'flex flex-col overflow-hidden' : 'overflow-y-auto p-5 sm:p-6'}`}>
          {children}
        </div>

        {/* Optional Footer (Pinned, never scrolls away) */}
        {footer && (
          <div className={`shrink-0 border-t border-[var(--border-color)] text-[11px] font-mono flex items-center justify-between text-[var(--text-muted)] ${noPadding ? 'p-3 sm:px-5 sm:py-3' : 'px-5 sm:px-6 py-3.5'}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
