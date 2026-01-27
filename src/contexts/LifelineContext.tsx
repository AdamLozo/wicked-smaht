import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { LifelineState, LifelineConfig } from '../types';
import { LIFELINE_COSTS } from '../types';
import { useGame } from './GameContext';

// ============================================
// INITIAL STATE
// ============================================

const DEFAULT_CONFIG: LifelineConfig = {
  fiftyFiftyMax: 3,
  askTheBarPerLocation: 1,
  phoneLocalMax: 2,
  skipReplaceMax: 2,
  skipReplaceCost: LIFELINE_COSTS.skip_and_replace,
};

const initialState: LifelineState = {
  fiftyFifty: {
    remaining: DEFAULT_CONFIG.fiftyFiftyMax,
    usedThisLocation: false,
    usedInGauntlet: false,
  },
  askTheBar: {
    usedThisLocation: false,
  },
  phoneLocal: {
    remaining: DEFAULT_CONFIG.phoneLocalMax,
    usedInGauntlet: false,
  },
  skipReplace: {
    remaining: DEFAULT_CONFIG.skipReplaceMax,
  },
  totalUsed: 0,
};

// ============================================
// ACTION TYPES
// ============================================

type LifelineAction =
  | { type: 'USE_FIFTY_FIFTY'; inGauntlet?: boolean }
  | { type: 'USE_ASK_THE_BAR' }
  | { type: 'USE_PHONE_LOCAL'; inGauntlet?: boolean }
  | { type: 'USE_SKIP_REPLACE' }
  | { type: 'RESET_LOCATION_LIFELINES' }
  | { type: 'ENTER_GAUNTLET' }
  | { type: 'RESET_ALL_LIFELINES'; config?: Partial<LifelineConfig> }
  | { type: 'APPLY_CHARACTER_PERK'; perkId: string };

// ============================================
// REDUCER
// ============================================

function lifelineReducer(state: LifelineState, action: LifelineAction): LifelineState {
  switch (action.type) {
    case 'USE_FIFTY_FIFTY':
      if (state.fiftyFifty.remaining <= 0) return state;
      if (action.inGauntlet && state.fiftyFifty.usedInGauntlet) return state;
      return {
        ...state,
        fiftyFifty: {
          remaining: state.fiftyFifty.remaining - 1,
          usedThisLocation: true,
          usedInGauntlet: action.inGauntlet ? true : state.fiftyFifty.usedInGauntlet,
        },
        totalUsed: state.totalUsed + 1,
      };

    case 'USE_ASK_THE_BAR':
      if (state.askTheBar.usedThisLocation) return state;
      return {
        ...state,
        askTheBar: {
          usedThisLocation: true,
        },
        totalUsed: state.totalUsed + 1,
      };

    case 'USE_PHONE_LOCAL':
      if (state.phoneLocal.remaining <= 0) return state;
      if (action.inGauntlet && state.phoneLocal.usedInGauntlet) return state;
      return {
        ...state,
        phoneLocal: {
          remaining: state.phoneLocal.remaining - 1,
          usedInGauntlet: action.inGauntlet ? true : state.phoneLocal.usedInGauntlet,
        },
        totalUsed: state.totalUsed + 1,
      };

    case 'USE_SKIP_REPLACE':
      if (state.skipReplace.remaining <= 0) return state;
      return {
        ...state,
        skipReplace: {
          remaining: state.skipReplace.remaining - 1,
        },
        totalUsed: state.totalUsed + 1,
      };

    case 'RESET_LOCATION_LIFELINES':
      // Reset per-location flags but keep remaining counts
      return {
        ...state,
        fiftyFifty: {
          ...state.fiftyFifty,
          usedThisLocation: false,
        },
        askTheBar: {
          usedThisLocation: false,
        },
      };

    case 'ENTER_GAUNTLET':
      // No state change needed, just mark we're in gauntlet mode
      // The availability checks handle gauntlet restrictions
      return state;

    case 'RESET_ALL_LIFELINES': {
      const config = { ...DEFAULT_CONFIG, ...action.config };
      return {
        fiftyFifty: {
          remaining: config.fiftyFiftyMax,
          usedThisLocation: false,
          usedInGauntlet: false,
        },
        askTheBar: {
          usedThisLocation: false,
        },
        phoneLocal: {
          remaining: config.phoneLocalMax,
          usedInGauntlet: false,
        },
        skipReplace: {
          remaining: config.skipReplaceMax,
        },
        totalUsed: 0,
      };
    }

    case 'APPLY_CHARACTER_PERK':
      // Character perks are handled in the context value calculations
      // This action exists for future extensibility
      return state;

    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

interface LifelineContextValue {
  state: LifelineState;
  config: LifelineConfig;

  // Actions
  useFiftyFifty: () => boolean;
  useAskTheBar: () => boolean;
  usePhoneLocal: () => boolean;
  useSkipReplace: () => boolean;
  resetLocationLifelines: () => void;
  enterGauntlet: () => void;
  resetAllLifelines: () => void;

  // Availability checks
  canUseFiftyFifty: (inGauntlet?: boolean, inRedemption?: boolean) => boolean;
  canUseAskTheBar: (inGauntlet?: boolean, inRedemption?: boolean) => boolean;
  canUsePhoneLocal: (inGauntlet?: boolean, inRedemption?: boolean) => boolean;
  canUseSkipReplace: (inGauntlet?: boolean, inRedemption?: boolean) => boolean;

  // Computed values
  totalLifelinesRemaining: number;
  efficiencyBonus: number;
  hasUnassistedAchievement: boolean;

  // Character perk helpers
  getSkipReplaceCost: () => number;
  getDannyAskBarBonus: () => boolean;
  canMegUseInRedemption: () => boolean;
}

const LifelineContext = createContext<LifelineContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface LifelineProviderProps {
  children: ReactNode;
}

export function LifelineProvider({ children }: LifelineProviderProps) {
  const [state, dispatch] = useReducer(lifelineReducer, initialState);
  const { state: gameState, addScore } = useGame();

  // Get character perk info
  const characterId = gameState.selectedCharacter;
  const isDanny = characterId === 'danny';
  const isColleen = characterId === 'colleen';
  const isFitz = characterId === 'fitz';
  const isMeg = characterId === 'meg';

  // Character-specific config adjustments
  const config: LifelineConfig = {
    ...DEFAULT_CONFIG,
    // Danny gets 2 Ask the Bar per location instead of 1
    askTheBarPerLocation: isDanny ? 2 : DEFAULT_CONFIG.askTheBarPerLocation,
    // Colleen's Skip & Replace costs -35 instead of -50
    skipReplaceCost: isColleen ? -35 : DEFAULT_CONFIG.skipReplaceCost,
  };

  // Track Danny's second Ask the Bar usage
  const dannySecondAskBarUsed = isDanny && state.askTheBar.usedThisLocation;

  // ============================================
  // AVAILABILITY CHECKS
  // ============================================

  const canUseFiftyFifty = useCallback((inGauntlet = false, inRedemption = false): boolean => {
    // Not available in redemption (unless Meg perk)
    if (inRedemption && !isMeg) return false;
    if (state.fiftyFifty.remaining <= 0) return false;
    // Gauntlet allows only 1 use
    if (inGauntlet && state.fiftyFifty.usedInGauntlet) return false;
    return true;
  }, [state.fiftyFifty, isMeg]);

  const canUseAskTheBar = useCallback((inGauntlet = false, inRedemption = false): boolean => {
    // Not available in gauntlet (NPCs not present)
    if (inGauntlet) return false;
    // Not available in redemption (unless Meg perk)
    if (inRedemption && !isMeg) return false;
    // Danny gets 2 per location
    if (isDanny) {
      // Danny can use it twice per location
      // First use sets usedThisLocation, we track second use separately
      return !dannySecondAskBarUsed || !state.askTheBar.usedThisLocation;
    }
    return !state.askTheBar.usedThisLocation;
  }, [state.askTheBar.usedThisLocation, isDanny, dannySecondAskBarUsed, isMeg]);

  const canUsePhoneLocal = useCallback((inGauntlet = false, inRedemption = false): boolean => {
    // Not available in redemption (unless Meg perk)
    if (inRedemption && !isMeg) return false;
    if (state.phoneLocal.remaining <= 0) return false;
    // Gauntlet allows only 1 use
    if (inGauntlet && state.phoneLocal.usedInGauntlet) return false;
    return true;
  }, [state.phoneLocal, isMeg]);

  const canUseSkipReplace = useCallback((inGauntlet = false, inRedemption = false): boolean => {
    // Never available in gauntlet (questions are fixed)
    if (inGauntlet) return false;
    // Not available in redemption (unless Meg perk)
    if (inRedemption && !isMeg) return false;
    return state.skipReplace.remaining > 0;
  }, [state.skipReplace.remaining, isMeg]);

  // ============================================
  // ACTIONS
  // ============================================

  const useFiftyFifty = useCallback((): boolean => {
    const inGauntlet = gameState.keysCollected.length >= 10 && !gameState.gauntletPassed;
    if (!canUseFiftyFifty(inGauntlet)) return false;

    dispatch({ type: 'USE_FIFTY_FIFTY', inGauntlet });
    addScore(LIFELINE_COSTS.fifty_fifty);
    return true;
  }, [canUseFiftyFifty, addScore, gameState.keysCollected.length, gameState.gauntletPassed]);

  const useAskTheBar = useCallback((): boolean => {
    if (!canUseAskTheBar()) return false;

    dispatch({ type: 'USE_ASK_THE_BAR' });
    // Ask the Bar is FREE
    return true;
  }, [canUseAskTheBar]);

  const usePhoneLocal = useCallback((): boolean => {
    const inGauntlet = gameState.keysCollected.length >= 10 && !gameState.gauntletPassed;
    if (!canUsePhoneLocal(inGauntlet)) return false;

    dispatch({ type: 'USE_PHONE_LOCAL', inGauntlet });
    addScore(LIFELINE_COSTS.phone_a_local);

    // Fitz's perk: Phone a Local sometimes reveals bonus trivia worth +25
    if (isFitz && Math.random() < 0.3) {
      // 30% chance for Fitz to get bonus
      addScore(25);
    }

    return true;
  }, [canUsePhoneLocal, addScore, isFitz, gameState.keysCollected.length, gameState.gauntletPassed]);

  const useSkipReplace = useCallback((): boolean => {
    if (!canUseSkipReplace()) return false;

    dispatch({ type: 'USE_SKIP_REPLACE' });
    addScore(config.skipReplaceCost); // -50 or -35 for Colleen
    return true;
  }, [canUseSkipReplace, addScore, config.skipReplaceCost]);

  const resetLocationLifelines = useCallback(() => {
    dispatch({ type: 'RESET_LOCATION_LIFELINES' });
  }, []);

  const enterGauntlet = useCallback(() => {
    dispatch({ type: 'ENTER_GAUNTLET' });
  }, []);

  const resetAllLifelines = useCallback(() => {
    dispatch({ type: 'RESET_ALL_LIFELINES', config });
  }, [config]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const totalLifelinesRemaining =
    state.fiftyFifty.remaining +
    state.phoneLocal.remaining +
    state.skipReplace.remaining +
    (state.askTheBar.usedThisLocation ? 0 : 1);

  // Efficiency bonus calculation
  const unusedCount = state.fiftyFifty.remaining + state.phoneLocal.remaining + state.skipReplace.remaining;

  const efficiencyBonus = (() => {
    if (state.totalUsed === 0) return 500; // Unassisted achievement
    if (unusedCount >= 5) return 200;
    if (unusedCount >= 3) return 100;
    if (unusedCount >= 1) return 50;
    return 0;
  })();

  const hasUnassistedAchievement = state.totalUsed === 0 && gameState.gauntletPassed;

  // ============================================
  // CHARACTER PERK HELPERS
  // ============================================

  const getSkipReplaceCost = useCallback(() => config.skipReplaceCost, [config.skipReplaceCost]);

  const getDannyAskBarBonus = useCallback(() => isDanny, [isDanny]);

  const canMegUseInRedemption = useCallback(() => isMeg, [isMeg]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: LifelineContextValue = {
    state,
    config,
    useFiftyFifty,
    useAskTheBar,
    usePhoneLocal,
    useSkipReplace,
    resetLocationLifelines,
    enterGauntlet,
    resetAllLifelines,
    canUseFiftyFifty,
    canUseAskTheBar,
    canUsePhoneLocal,
    canUseSkipReplace,
    totalLifelinesRemaining,
    efficiencyBonus,
    hasUnassistedAchievement,
    getSkipReplaceCost,
    getDannyAskBarBonus,
    canMegUseInRedemption,
  };

  return (
    <LifelineContext.Provider value={value}>
      {children}
    </LifelineContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useLifeline(): LifelineContextValue {
  const context = useContext(LifelineContext);
  if (!context) {
    throw new Error('useLifeline must be used within a LifelineProvider');
  }
  return context;
}
