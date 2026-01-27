import { useEffect, useRef } from 'react';
import { useGame } from '../contexts';
import { useSaveGame } from './useSaveGame';

interface AutoSaveConfig {
  onLocationComplete?: boolean;
  onPolaroidCollect?: boolean;
  onGauntletAttempt?: boolean;
  onBeforeUnload?: boolean;
}

const defaultConfig: AutoSaveConfig = {
  onLocationComplete: true,
  onPolaroidCollect: true,
  onGauntletAttempt: true,
  onBeforeUnload: true,
};

export function useAutoSave(config: AutoSaveConfig = defaultConfig) {
  const { state } = useGame();
  const { saveGame } = useSaveGame();

  const prevCompletedRef = useRef(state.completedLocations.length);
  const prevPolaroidsRef = useRef(state.collectedPolaroids.length);
  const prevGauntletRef = useRef(state.gauntletAttempts);

  // Save on location complete
  useEffect(() => {
    if (!config.onLocationComplete) return;

    if (state.completedLocations.length > prevCompletedRef.current) {
      saveGame();
    }
    prevCompletedRef.current = state.completedLocations.length;
  }, [state.completedLocations.length, saveGame, config.onLocationComplete]);

  // Save on polaroid collect
  useEffect(() => {
    if (!config.onPolaroidCollect) return;

    if (state.collectedPolaroids.length > prevPolaroidsRef.current) {
      saveGame();
    }
    prevPolaroidsRef.current = state.collectedPolaroids.length;
  }, [state.collectedPolaroids.length, saveGame, config.onPolaroidCollect]);

  // Save on gauntlet attempt
  useEffect(() => {
    if (!config.onGauntletAttempt) return;

    if (state.gauntletAttempts > prevGauntletRef.current) {
      saveGame();
    }
    prevGauntletRef.current = state.gauntletAttempts;
  }, [state.gauntletAttempts, saveGame, config.onGauntletAttempt]);

  // Save before page unload
  useEffect(() => {
    if (!config.onBeforeUnload) return;

    const handleBeforeUnload = () => {
      saveGame();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveGame, config.onBeforeUnload]);
}
