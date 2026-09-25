import { useState, useCallback } from 'react';
import { StageId, IndicatorKey } from '../types/crypto.types';

export type TerminalViewMode = 'landing' | 'login' | 'terminal' | 'docs';

export interface UseTerminalNavigationReturn {
  viewMode: TerminalViewMode;
  currentStage: StageId;
  backtestIndicator: IndicatorKey;
  navigateToLanding: () => void;
  navigateToLogin: () => void;
  navigateToTerminal: (stage?: StageId) => void;
  navigateToDocs: () => void;
  selectStage: (stage: StageId) => void;
  openBacktest: (indicatorKey?: IndicatorKey) => void;
}

export function useTerminalNavigation(initialStage: StageId = 'ticker'): UseTerminalNavigationReturn {
  const [viewMode, setViewMode] = useState<TerminalViewMode>(() => {
    const saved = localStorage.getItem('imasbtc_view_mode') as TerminalViewMode | null;
    return saved === 'landing' || saved === 'login' || saved === 'docs' ? saved : 'terminal';
  });

  const [currentStage, setCurrentStage] = useState<StageId>(initialStage);
  const [backtestIndicator, setBacktestIndicator] = useState<IndicatorKey>('confluence');

  const navigateToLanding = useCallback(() => {
    setViewMode('landing');
    localStorage.setItem('imasbtc_view_mode', 'landing');
  }, []);

  const navigateToLogin = useCallback(() => {
    setViewMode('login');
    localStorage.setItem('imasbtc_view_mode', 'login');
  }, []);

  const navigateToDocs = useCallback(() => {
    setViewMode('docs');
    localStorage.setItem('imasbtc_view_mode', 'docs');
  }, []);

  const navigateToTerminal = useCallback((stage?: StageId) => {
    if (stage) {
      setCurrentStage(stage);
    }
    setViewMode('terminal');
    localStorage.setItem('imasbtc_view_mode', 'terminal');
  }, []);

  const selectStage = useCallback((stage: StageId) => {
    setCurrentStage(stage);
  }, []);

  const openBacktest = useCallback((indicatorKey?: IndicatorKey | any) => {
    if (typeof indicatorKey === 'string' && indicatorKey.length > 0) {
      setBacktestIndicator(indicatorKey as IndicatorKey);
    } else {
      setBacktestIndicator('confluence');
    }
    setCurrentStage('backtest');
  }, []);

  return {
    viewMode,
    currentStage,
    backtestIndicator,
    navigateToLanding,
    navigateToLogin,
    navigateToTerminal,
    navigateToDocs,
    selectStage,
    openBacktest,
  };
}
