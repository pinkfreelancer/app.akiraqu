import { useState, useCallback, useEffect } from 'react';
import { StageId, IndicatorKey } from '../types/crypto.types';

export type TerminalViewMode = 'landing' | 'login' | 'terminal' | 'docs' | 'system_health';

export interface UseTerminalNavigationReturn {
  viewMode: TerminalViewMode;
  currentStage: StageId;
  backtestIndicator: IndicatorKey;
  navigateToLanding: () => void;
  navigateToLogin: () => void;
  navigateToTerminal: (stage?: StageId) => void;
  navigateToDocs: () => void;
  navigateToSystemHealth: () => void;
  selectStage: (stage: StageId) => void;
  openBacktest: (indicatorKey?: IndicatorKey) => void;
}

export function useTerminalNavigation(initialStage: StageId = 'ticker'): UseTerminalNavigationReturn {
  const [viewMode, setViewMode] = useState<TerminalViewMode>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      if (pathname === '/system_health' || pathname === '/system-health' || hash === '#/system_health') {
        return 'system_health';
      }
      if (pathname === '/docs' || hash === '#/docs') {
        return 'docs';
      }
    }

    let saved: TerminalViewMode | null = null;
    try {
      saved = localStorage.getItem('imasbtc_view_mode') as TerminalViewMode | null;
    } catch {}

    if (saved === 'system_health' || saved === 'docs') {
      return saved;
    }

    let hasValidSession = false;
    try {
      const session = localStorage.getItem('imasbtc_user_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed && parsed.email && !parsed.isAnonymous && !parsed.uid?.startsWith('demo_')) {
          hasValidSession = true;
        }
      }
    } catch {}
    
    // If not authenticated, default to landing or login
    if (!hasValidSession) {
      return saved === 'login' ? 'login' : 'landing';
    }
    return saved === 'landing' || saved === 'login' ? saved : 'terminal';
  });

  const [currentStage, setCurrentStage] = useState<StageId>(initialStage);
  const [backtestIndicator, setBacktestIndicator] = useState<IndicatorKey>('confluence');

  // Synchronize browser history / URL navigation with viewMode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      if (pathname === '/system_health' || pathname === '/system-health' || hash === '#/system_health') {
        setViewMode('system_health');
      } else if (pathname === '/docs' || hash === '#/docs') {
        setViewMode('docs');
      } else if (pathname === '/' || hash === '') {
        try {
          const saved = localStorage.getItem('imasbtc_view_mode') as TerminalViewMode | null;
          if (saved && (saved === 'terminal' || saved === 'landing' || saved === 'login')) {
            setViewMode(saved);
          } else {
            setViewMode('landing');
          }
        } catch {
          setViewMode('landing');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToLanding = useCallback(() => {
    setViewMode('landing');
    try {
      localStorage.setItem('imasbtc_view_mode', 'landing');
    } catch {}
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    setViewMode('login');
    try {
      localStorage.setItem('imasbtc_view_mode', 'login');
    } catch {}
  }, []);

  const navigateToDocs = useCallback(() => {
    setViewMode('docs');
    try {
      localStorage.setItem('imasbtc_view_mode', 'docs');
    } catch {}
    if (typeof window !== 'undefined' && window.location.pathname !== '/docs') {
      window.history.pushState({}, '', '/docs');
    }
  }, []);

  const navigateToSystemHealth = useCallback(() => {
    setViewMode('system_health');
    try {
      localStorage.setItem('imasbtc_view_mode', 'system_health');
    } catch {}
    if (typeof window !== 'undefined' && window.location.pathname !== '/system_health') {
      window.history.pushState({}, '', '/system_health');
    }
  }, []);

  const navigateToTerminal = useCallback((stage?: StageId | any) => {
    // CRITICAL: Protect against synthetic MouseEvents or non-string objects passed from onClick handlers
    if (typeof stage === 'string' && stage.length > 0) {
      setCurrentStage(stage as StageId);
    }
    setViewMode('terminal');
    try {
      localStorage.setItem('imasbtc_view_mode', 'terminal');
    } catch {}
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  }, []);

  const selectStage = useCallback((stage: StageId | any) => {
    // CRITICAL: Only accept string stage keys, never events or objects
    if (typeof stage === 'string' && stage.length > 0) {
      setCurrentStage(stage as StageId);
    }
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
    navigateToSystemHealth,
    selectStage,
    openBacktest,
  };
}
