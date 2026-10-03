import { useState, useEffect } from 'react';
import { doc, setDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
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
  updatedAt?: string | number;
}

export const JOURNAL_TRADES_STORAGE_KEY = 'akiraqu_journal_trades';
export const JOURNAL_NOTES_STORAGE_KEY = 'akiraqu_journal_notes';

const LEGACY_TRADES_KEY = 'nexus_journal_trades';
const LEGACY_NOTES_KEY = 'nexus_trading_journal';

const TRADES_EVENT = 'akiraqu_journal_trades_updated';
const NOTES_EVENT = 'akiraqu_journal_notes_updated';

let isSyncingTrades = false;
let isSyncingNotes = false;

/**
 * Load trade records from LocalStorage cache
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
    console.warn('[AKIRAQU Journal] Error loading trade entries from cache:', err);
  }

  return INITIAL_JOURNAL_TRADES;
}

/**
 * Saves trade records locally and pushes to Firestore with conflict resolution
 */
export function saveJournalTrades(trades: JournalTradeEntry[]): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(trades);
    localStorage.setItem(JOURNAL_TRADES_STORAGE_KEY, serialized);
    localStorage.setItem(LEGACY_TRADES_KEY, serialized);
    window.dispatchEvent(new CustomEvent(TRADES_EVENT, { detail: trades }));

    // Async push to Cloud Firestore if user is authenticated
    const currentUser = auth?.currentUser;
    if (currentUser && db) {
      pushTradesToFirestore(currentUser.uid, trades).catch((err) => {
        console.warn('[AKIRAQU Journal] Background Firestore push notice:', err);
      });
    }
  } catch (err) {
    console.error('[AKIRAQU Journal] Error saving trade entries:', err);
  }
}

/**
 * Push trades to Cloud Firestore (/users/{userId}/journal/{tradeId})
 */
async function pushTradesToFirestore(userId: string, trades: JournalTradeEntry[]) {
  if (!db || !userId) return;

  for (const trade of trades) {
    try {
      const tradeId = trade.id || `trade-${trade.timestamp}`;
      const docRef = doc(db, 'users', userId, 'journal', tradeId);
      await setDoc(docRef, {
        userId,
        id: tradeId,
        pair: trade.symbol,
        type: trade.side,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice || null,
        stopLoss: trade.stopLoss || null,
        takeProfit: trade.takeProfit || null,
        sizeUsd: trade.sizeUsd || 0,
        leverage: trade.leverage || 1,
        pnl: trade.pnlUsd || 0,
        pnlPct: trade.pnlPct || 0,
        status: trade.status || 'OPEN',
        setupRationale: trade.setupRationale || '',
        confluenceScoreAtEntry: trade.confluenceScoreAtEntry || 0,
        exchange: trade.exchange || 'BINANCE',
        notes: trade.notes || '',
        timestamp: trade.timestamp || Date.now(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (_e) {
      // Individual record fallback
    }
  }
}

/**
 * Load analysis notes from LocalStorage cache
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
    console.warn('[AKIRAQU Journal] Error loading analysis notes from cache:', err);
  }

  return [];
}

/**
 * Saves analysis notes locally and pushes to Firestore with conflict resolution
 */
export function saveJournalNotes(notes: AnalysisJournalNote[]): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(notes);
    localStorage.setItem(JOURNAL_NOTES_STORAGE_KEY, serialized);
    localStorage.setItem(LEGACY_NOTES_KEY, serialized);
    window.dispatchEvent(new CustomEvent(NOTES_EVENT, { detail: notes }));

    // Async push to Cloud Firestore if user is authenticated
    const currentUser = auth?.currentUser;
    if (currentUser && db) {
      pushNotesToFirestore(currentUser.uid, notes).catch((err) => {
        console.warn('[AKIRAQU Journal] Background Firestore notes push notice:', err);
      });
    }
  } catch (err) {
    console.error('[AKIRAQU Journal] Error saving analysis notes:', err);
  }
}

/**
 * Push analysis notes to Cloud Firestore (/users/{userId}/analysis_notes/{noteId})
 */
async function pushNotesToFirestore(userId: string, notes: AnalysisJournalNote[]) {
  if (!db || !userId) return;

  for (const note of notes) {
    try {
      const noteId = note.id || `note-${Date.now()}`;
      const docRef = doc(db, 'users', userId, 'analysis_notes', noteId);
      await setDoc(docRef, {
        id: noteId,
        userId,
        symbol: note.symbol,
        timeframe: note.timeframe || '1H',
        userNotes: note.userNotes,
        aiEngine: note.aiEngine || 'Gemini 2.5 Flash',
        confluenceScore: note.confluenceScore || 0,
        marketBias: note.marketBias || 'Neutral',
        entryPrice: note.entryPrice || null,
        stopLoss: note.stopLoss || null,
        takeProfit: note.takeProfit || null,
        timestamp: note.timestamp || new Date().toISOString(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (_e) {
      // Individual record fallback
    }
  }
}

/**
 * Bidirectional Synchronizer with Split-Brain Conflict Resolution
 * 
 * Prevents race condition overwrites when opening on multiple devices (phone vs laptop).
 * Merges Cloud Firestore records with local entries based on ID and timestamps.
 */
export async function syncJournalWithFirestore(userId: string): Promise<{ tradesCount: number; notesCount: number }> {
  if (!db || !userId) {
    return { tradesCount: 0, notesCount: 0 };
  }

  let mergedTradesCount = 0;
  let mergedNotesCount = 0;

  // 1. Sync Trading Journal Trades
  if (!isSyncingTrades) {
    isSyncingTrades = true;
    try {
      const localTrades = loadJournalTrades();
      const localMap = new Map<string, JournalTradeEntry>();
      localTrades.forEach((t) => localMap.set(t.id, t));

      const journalCol = collection(db, 'users', userId, 'journal');
      const snapshot = await getDocs(journalCol);

      let hasNewRemoteTrades = false;

      snapshot.forEach((d) => {
        const remote = d.data();
        const tradeId = remote.id || d.id;
        const remoteTime = typeof remote.timestamp === 'number' ? remote.timestamp : Date.now();

        const remoteEntry: JournalTradeEntry = {
          id: tradeId,
          timestamp: remoteTime,
          symbol: remote.pair || remote.symbol || 'BTC/USDT',
          side: remote.type || remote.side || 'LONG',
          entryPrice: remote.entryPrice || 0,
          exitPrice: remote.exitPrice || undefined,
          stopLoss: remote.stopLoss || undefined,
          takeProfit: remote.takeProfit || undefined,
          sizeUsd: remote.sizeUsd || 0,
          leverage: remote.leverage || 1,
          pnlUsd: remote.pnl ?? remote.pnlUsd ?? 0,
          pnlPct: remote.pnlPct || 0,
          status: remote.status || 'OPEN',
          setupRationale: remote.setupRationale || '',
          confluenceScoreAtEntry: remote.confluenceScoreAtEntry || 0,
          exchange: remote.exchange || 'BINANCE',
          notes: remote.notes || '',
        };

        const existingLocal = localMap.get(tradeId);
        if (!existingLocal) {
          // New record from another device -> add to local
          localMap.set(tradeId, remoteEntry);
          hasNewRemoteTrades = true;
        } else {
          // Conflict Resolution: Whichever is newer or has updated PnL wins
          const localTime = existingLocal.timestamp || 0;
          if (remoteTime > localTime) {
            localMap.set(tradeId, remoteEntry);
            hasNewRemoteTrades = true;
          }
        }
      });

      const mergedTrades = Array.from(localMap.values()).sort((a, b) => b.timestamp - a.timestamp);
      mergedTradesCount = mergedTrades.length;

      if (hasNewRemoteTrades || localTrades.length !== mergedTrades.length) {
        localStorage.setItem(JOURNAL_TRADES_STORAGE_KEY, JSON.stringify(mergedTrades));
        window.dispatchEvent(new CustomEvent(TRADES_EVENT, { detail: mergedTrades }));
      }

      // If local had drafts not yet in Firestore, push them up
      const missingInRemote = mergedTrades.filter((t) => !snapshot.docs.some((sd) => sd.id === t.id));
      if (missingInRemote.length > 0) {
        await pushTradesToFirestore(userId, missingInRemote);
      }
    } catch (err) {
      console.warn('[AKIRAQU Journal Sync] Trades sync warning:', err);
    } finally {
      isSyncingTrades = false;
    }
  }

  // 2. Sync Confluence & Gemini AI Analysis Notes
  if (!isSyncingNotes) {
    isSyncingNotes = true;
    try {
      const localNotes = loadJournalNotes();
      const notesMap = new Map<string, AnalysisJournalNote>();
      localNotes.forEach((n) => notesMap.set(n.id, n));

      const notesCol = collection(db, 'users', userId, 'analysis_notes');
      const snapshot = await getDocs(notesCol);

      let hasNewRemoteNotes = false;

      snapshot.forEach((d) => {
        const remote = d.data();
        const noteId = remote.id || d.id;
        const remoteNote: AnalysisJournalNote = {
          id: noteId,
          timestamp: remote.timestamp || new Date().toISOString(),
          symbol: remote.symbol || 'BTC/USDT',
          timeframe: remote.timeframe || '1H',
          userNotes: remote.userNotes || '',
          aiEngine: remote.aiEngine || 'Gemini 2.5 Flash',
          confluenceScore: remote.confluenceScore || 0,
          marketBias: remote.marketBias || 'Neutral',
          entryPrice: remote.entryPrice || undefined,
          stopLoss: remote.stopLoss || undefined,
          takeProfit: remote.takeProfit || undefined,
        };

        if (!notesMap.has(noteId)) {
          notesMap.set(noteId, remoteNote);
          hasNewRemoteNotes = true;
        }
      });

      const mergedNotes = Array.from(notesMap.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      mergedNotesCount = mergedNotes.length;

      if (hasNewRemoteNotes || localNotes.length !== mergedNotes.length) {
        localStorage.setItem(JOURNAL_NOTES_STORAGE_KEY, JSON.stringify(mergedNotes));
        window.dispatchEvent(new CustomEvent(NOTES_EVENT, { detail: mergedNotes }));
      }

      // Push local notes not yet in remote
      const missingNotesInRemote = mergedNotes.filter((n) => !snapshot.docs.some((sd) => sd.id === n.id));
      if (missingNotesInRemote.length > 0) {
        await pushNotesToFirestore(userId, missingNotesInRemote);
      }
    } catch (err) {
      console.warn('[AKIRAQU Journal Sync] Notes sync warning:', err);
    } finally {
      isSyncingNotes = false;
    }
  }

  return { tradesCount: mergedTradesCount, notesCount: mergedNotesCount };
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

    // Initial background Firestore sync if user is already signed in
    if (auth?.currentUser) {
      syncJournalWithFirestore(auth.currentUser.uid).catch(() => {});
    }

    // Auto-sync whenever auth state resolves to signed-in user
    const unsubscribeAuth = auth?.onAuthStateChanged((user: any) => {
      if (user?.uid) {
        syncJournalWithFirestore(user.uid).catch(() => {});
      }
    });

    return () => {
      window.removeEventListener(TRADES_EVENT, handler);
      if (unsubscribeAuth) unsubscribeAuth();
    };
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

    // Initial background Firestore sync if user is already signed in
    if (auth?.currentUser) {
      syncJournalWithFirestore(auth.currentUser.uid).catch(() => {});
    }

    const unsubscribeAuth = auth?.onAuthStateChanged((user: any) => {
      if (user?.uid) {
        syncJournalWithFirestore(user.uid).catch(() => {});
      }
    });

    return () => {
      window.removeEventListener(NOTES_EVENT, handler);
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  const update = (newNotes: AnalysisJournalNote[]) => {
    saveJournalNotes(newNotes);
    setNotes(newNotes);
  };

  return [notes, update];
}
