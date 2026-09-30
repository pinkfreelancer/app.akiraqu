import React, { useRef } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
  destructive = true,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      role="alertdialog"
      maxWidth="max-w-md"
      initialFocusRef={cancelButtonRef}
      icon={destructive ? AlertTriangle : Info}
      iconClassName={destructive ? 'text-rose-400' : 'text-[var(--accent-color,#ec4899)]'}
      iconBgClassName={destructive ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[var(--accent-subtle)] border-[var(--border-color)]'}
    >
      <div className="space-y-4">
        <div className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          {description}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-4 py-2 rounded-[var(--radius-buttons,2px)] border border-[var(--border-color)] text-xs font-mono font-semibold text-[var(--text-main)] hover:bg-[var(--accent-subtle)] transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[44px] px-4 py-2 rounded-[var(--radius-buttons,2px)] text-xs font-mono font-bold transition-colors cursor-pointer ${
              destructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                : 'bg-[var(--accent-color,#ec4899)] hover:opacity-90 text-white shadow-xs'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};
