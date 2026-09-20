import { useState, useEffect } from 'react';
import { JournalTradeEntry } from '../types/crypto.types';
import { INITIAL_JOURNAL_TRADES } from './terminalExtensionService';

export interface AnalysisJournalNote {
  id: string;
  timestamp: string;
  symbol: string;
  timeframe: string;
  userNotes: string;
  aiEngine?: string;
  confluenceScore?: number;
  marketBias?: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export const JOURNAL_TRADES_STORAGE_KEY = 'akiraqu_journal_trades';
export const JOURNAL_NOTES_STORAGE_KEY = 'akiraqu_journal_notes';

const LEGACY_TRADES_KEY = 'nexus_journal_trades';
const LEGACY_NOTES_KEY = 'nexus_trading_journal';

const TRADES_EVENT = 'akiraqu_journal_trades_updated';
const NOTES_EVENT = 'akiraqu_journal_notes_updated';

/**
 * Load trade records (Trading Journal)
 */
export function loadJournalTrades(): JournalTradeEntry[] {
  if (typeof window === 'undefined') return INITIAL_JOURNAL_TRADES;

  try {
    const primary = localStorage.getItem(JOURNAL_TRADES_STORAGE_KEY);
    if (primary) {
      const parsed = JSON.parse(primary);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    // Migration from legacy key
    const legacy = localStorage.getItem(LEGACY_TRADES_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localStorage.setItem(JOURNAL_TRADES_STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[AKIRAQU Journal] Error loading trade entries:', err);
  }

  return INITIAL_JOURNAL_TRADES;
}

export function saveJournalTrades(trades: JournalTradeEntry[]): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(trades);
    localStorage.setItem(JOURNAL_TRADES_STORAGE_KEY, serialized);
    localStorage.setItem(LEGACY_TRADES_KEY, serialized);
    window.dispatchEvent(new CustomEvent(TRADES_EVENT, { detail: trades }));
  } catch (err) {
    console.error('[AKIRAQU Journal] Error saving trade entries:', err);
  }
}

/**
 * Load analysis notes (Output / Confluence Notes)
 */
export function loadJournalNotes(): AnalysisJournalNote[] {
  if (typeof window === 'undefined') return [];

  try {
    const primary = localStorage.getItem(JOURNAL_NOTES_STORAGE_KEY);
    if (primary) {
      const parsed = JSON.parse(primary);
      if (Array.isArray(parsed)) return parsed;
    }

    // Migration from legacy key
    const legacy = localStorage.getItem(LEGACY_NOTES_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) {
        localStorage.setItem(JOURNAL_NOTES_STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[AKIRAQU Journal] Error loading analysis notes:', err);
  }

  return [];
}

export function saveJournalNotes(notes: AnalysisJournalNote[]): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(notes);
    localStorage.setItem(JOURNAL_NOTES_STORAGE_KEY, serialized);
    localStorage.setItem(LEGACY_NOTES_KEY, serialized);
    window.dispatchEvent(new CustomEvent(NOTES_EVENT, { detail: notes }));
  } catch (err) {
    console.error('[AKIRAQU Journal] Error saving analysis notes:', err);
  }
}

/**
 * React hook for real-time synchronized Journal Trades
 */
export function useJournalTrades(): [JournalTradeEntry[], (trades: JournalTradeEntry[]) => void] {
  const [trades, setTrades] = useState<JournalTradeEntry[]>(() => loadJournalTrades());

  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setTrades(e.detail);
      } else {
        setTrades(loadJournalTrades());
      }
    };

    window.addEventListener(TRADES_EVENT, handler);
    return () => window.removeEventListener(TRADES_EVENT, handler);
  }, []);

  const update = (newTrades: JournalTradeEntry[]) => {
    saveJournalTrades(newTrades);
    setTrades(newTrades);
  };

  return [trades, update];
}

/**
 * React hook for real-time synchronized Analysis Notes
 */
export function useJournalNotes(): [AnalysisJournalNote[], (notes: AnalysisJournalNote[]) => void] {
  const [notes, setNotes] = useState<AnalysisJournalNote[]>(() => loadJournalNotes());

  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setNotes(e.detail);
      } else {
        setNotes(loadJournalNotes());
      }
    };

    window.addEventListener(NOTES_EVENT, handler);
    return () => window.removeEventListener(NOTES_EVENT, handler);
  }, []);

  const update = (newNotes: AnalysisJournalNote[]) => {
    saveJournalNotes(newNotes);
    setNotes(newNotes);
  };

  return [notes, update];
}
