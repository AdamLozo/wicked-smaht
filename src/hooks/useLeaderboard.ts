import { useCallback } from 'react';
import type { LeaderboardEntry } from '../types';

const STORAGE_KEY = 'wickedsmart_leaderboard';
const MAX_ENTRIES = 10;

export function useLeaderboard() {
  const getEntries = useCallback((): LeaderboardEntry[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }, []);

  const addEntry = useCallback((entry: LeaderboardEntry): number => {
    const entries = getEntries();
    entries.push(entry);

    // Sort by score descending
    entries.sort((a, b) => b.score - a.score);

    // Keep only top entries
    const trimmed = entries.slice(0, MAX_ENTRIES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

    // Return position (1-indexed)
    return trimmed.findIndex(e =>
      e.completedAt === entry.completedAt && e.score === entry.score
    ) + 1;
  }, [getEntries]);

  const clearLeaderboard = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    getEntries,
    addEntry,
    clearLeaderboard,
  };
}
