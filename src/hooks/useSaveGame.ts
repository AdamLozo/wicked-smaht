import { useCallback } from 'react';
import { useGame, useAudio } from '../contexts';
import type { SaveData } from '../types';

const STORAGE_KEYS = {
  CURRENT_SAVE: 'wickedsmart_save',
  SETTINGS: 'wickedsmart_settings',
  LEADERBOARD: 'wickedsmart_leaderboard',
};

const GAME_VERSION = '1.0.0';

export function useSaveGame() {
  const { state, dispatch } = useGame();
  const { audioState } = useAudio();

  const saveGame = useCallback(() => {
    try {
      const saveData: SaveData = {
        version: GAME_VERSION,
        timestamp: Date.now(),
        playthrough: {
          id: state.playthroughId,
          startedAt: state.startedAt,
          totalPlayTime: state.totalPlayTime,
        },
        gameState: state,
        audioSettings: audioState,
      };

      localStorage.setItem(
        STORAGE_KEYS.CURRENT_SAVE,
        JSON.stringify(saveData)
      );

      console.log('Game saved:', new Date().toISOString());
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }, [state, audioState]);

  const loadGame = useCallback((): SaveData | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_SAVE);
      if (!raw) return null;

      const data: SaveData = JSON.parse(raw);

      // Version migration if needed
      const migrated = migrateIfNeeded(data);

      return migrated;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }, []);

  const deleteSave = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SAVE);
  }, []);

  const hasSave = useCallback((): boolean => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SAVE) !== null;
  }, []);

  const restoreGame = useCallback((saveData: SaveData) => {
    dispatch({ type: 'LOAD_GAME', state: saveData.gameState });
  }, [dispatch]);

  return {
    saveGame,
    loadGame,
    deleteSave,
    hasSave,
    restoreGame,
  };
}

// Version migration handler
function migrateIfNeeded(data: SaveData): SaveData {
  // Add migration logic as versions change

  // Ensure difficulty field exists (added in version with difficulty toggle)
  if (!data.gameState.difficulty) {
    data.gameState.difficulty = 'local'; // Default for existing saves
  }

  return data;
}
