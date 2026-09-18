import { useEffect } from 'react';
import { Timeframe } from '../types/crypto.types';

export interface UseTerminalKeyboardShortcutsOptions {
  onOpenCommandBar: () => void;
  onOpenShortcuts: () => void;
  onCloseModals: () => void;
  onTimeframeChange: (tf: Timeframe) => void;
  onToggleWorkspaceMode: () => void;
  onTriggerAnalyze: () => void;
  onPrevSymbol: () => void;
  onNextSymbol: () => void;
}

export function useTerminalKeyboardShortcuts({
  onOpenCommandBar,
  onOpenShortcuts,
  onCloseModals,
  onTimeframeChange,
  onToggleWorkspaceMode,
  onTriggerAnalyze,
  onPrevSymbol,
  onNextSymbol,
}: UseTerminalKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          (target as any).isContentEditable);

      // Omnibar Command Palette (Cmd+K / Ctrl+K or /)
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !isInput)) {
        e.preventDefault();
        onOpenCommandBar();
        return;
      }

      // Help Shortcut (?)
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        onOpenShortcuts();
        return;
      }

      if (isInput) return;

      // Timeframe Quick Switches: 1=1m, 2=5m, 3=15m, 4=1H, 5=4H, 6=1D, 7=1W
      if (e.key === '1') {
        e.preventDefault();
        onTimeframeChange('1m');
      } else if (e.key === '2') {
        e.preventDefault();
        onTimeframeChange('5m');
      } else if (e.key === '3') {
        e.preventDefault();
        onTimeframeChange('15m');
      } else if (e.key === '4') {
        e.preventDefault();
        onTimeframeChange('1H');
      } else if (e.key === '5') {
        e.preventDefault();
        onTimeframeChange('4H');
      } else if (e.key === '6') {
        e.preventDefault();
        onTimeframeChange('1D');
      } else if (e.key === '7') {
        e.preventDefault();
        onTimeframeChange('1W');
      } else if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        onToggleWorkspaceMode();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onTriggerAnalyze();
      } else if (e.key === '[' || (e.altKey && e.key === 'ArrowUp')) {
        e.preventDefault();
        onPrevSymbol();
      } else if (e.key === ']' || (e.altKey && e.key === 'ArrowDown')) {
        e.preventDefault();
        onNextSymbol();
      } else if (e.key === 'Escape') {
        onCloseModals();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    onOpenCommandBar,
    onOpenShortcuts,
    onCloseModals,
    onTimeframeChange,
    onToggleWorkspaceMode,
    onTriggerAnalyze,
    onPrevSymbol,
    onNextSymbol,
  ]);
}
