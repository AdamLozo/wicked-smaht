import { createContext, useContext, useReducer, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type {
  RivalCharacter,
  RivalSystemState,
  RaceState,
  StealState,
  InterruptionState,
  FailedLocation,
  CousinResponse,
  StealQuestion,
} from '../types';
import { useGame } from './GameContext';
import { getAllLocations } from '../data';

// ============================================
// INITIAL STATE
// ============================================

const createInitialRival = (id: 'brendan' | 'maeve'): RivalCharacter => ({
  id,
  name: id === 'brendan' ? 'Brendan' : 'Maeve',
  portrait: `/assets/images/portraits/${id}.png`,
  voiceProfile: id === 'brendan'
    ? { rate: 1.1, pitch: 0.9, voice: 'en-US-Standard-J' }
    : { rate: 0.95, pitch: 1.1, voice: 'en-US-Standard-H' },
  personality: id === 'brendan'
    ? 'Cocky but helpful cousin who texts too much'
    : 'Smarter older cousin who sends voice memos',
  currentLocation: null,
  locationProgress: [],
  keysCollected: 0,
  failedLocations: [],
  score: 0,
  status: 'active',
  lastMoveTime: Date.now(),
  nextMoveTime: Date.now() + 180000, // First move in 3 minutes (after player has some progress)
});

const initialRaceState: RaceState = {
  active: false,
  opponent: null,
  locationId: null,
  questionIndex: 0,
  playerAnswerTime: null,
  opponentAnswerTime: null,
  opponentAnswer: null,
  opponentCorrect: null,
  result: null,
};

const initialStealState: StealState = {
  active: false,
  target: null,
  locationId: null,
  questionIndex: 0,
  timeRemaining: 0,
  result: null,
};

const initialInterruptionState: InterruptionState = {
  active: false,
  type: null,
  source: null,
  content: '',
  audioFile: undefined,
  displayDuration: 5000,
  helpContent: undefined,
};

const initialState: RivalSystemState = {
  rivals: {
    brendan: createInitialRival('brendan'),
    maeve: createInitialRival('maeve'),
  },
  race: initialRaceState,
  steal: initialStealState,
  interruption: initialInterruptionState,
  cousinCallsRemaining: 2,
  lastCousinCall: null,
  movementIntervalMin: 45000, // 45 seconds
  movementIntervalMax: 90000, // 90 seconds
};

// ============================================
// ACTION TYPES
// ============================================

type RivalAction =
  | { type: 'MOVE_RIVAL'; rivalId: 'brendan' | 'maeve'; locationId: string }
  | { type: 'RIVAL_COMPLETE_LOCATION'; rivalId: 'brendan' | 'maeve'; locationId: string }
  | { type: 'RIVAL_FAIL_LOCATION'; rivalId: 'brendan' | 'maeve'; locationId: string }
  | { type: 'START_RACE'; opponent: 'brendan' | 'maeve'; locationId: string }
  | { type: 'UPDATE_RACE'; updates: Partial<RaceState> }
  | { type: 'END_RACE'; result: 'win' | 'loss' | 'tie' }
  | { type: 'START_STEAL'; target: 'brendan' | 'maeve'; locationId: string }
  | { type: 'UPDATE_STEAL'; updates: Partial<StealState> }
  | { type: 'END_STEAL'; result: 'success' | 'failure' }
  | { type: 'EXPIRE_STEAL_OPPORTUNITY'; rivalId: 'brendan' | 'maeve'; locationId: string }
  | { type: 'SHOW_INTERRUPTION'; interruption: Partial<InterruptionState> }
  | { type: 'DISMISS_INTERRUPTION' }
  | { type: 'USE_COUSIN_CALL' }
  | { type: 'UPDATE_RIVAL_MOVE_TIME'; rivalId: 'brendan' | 'maeve'; nextMoveTime: number }
  | { type: 'RESET_RIVALS' };

// ============================================
// REDUCER
// ============================================

function rivalReducer(state: RivalSystemState, action: RivalAction): RivalSystemState {
  switch (action.type) {
    case 'MOVE_RIVAL': {
      const rival = state.rivals[action.rivalId];
      return {
        ...state,
        rivals: {
          ...state.rivals,
          [action.rivalId]: {
            ...rival,
            currentLocation: action.locationId,
            lastMoveTime: Date.now(),
          },
        },
      };
    }

    case 'RIVAL_COMPLETE_LOCATION': {
      const rival = state.rivals[action.rivalId];
      return {
        ...state,
        rivals: {
          ...state.rivals,
          [action.rivalId]: {
            ...rival,
            locationProgress: [...rival.locationProgress, action.locationId],
            keysCollected: rival.keysCollected + 1,
            score: rival.score + 100, // Base score for completing
            currentLocation: null,
          },
        },
      };
    }

    case 'RIVAL_FAIL_LOCATION': {
      const rival = state.rivals[action.rivalId];
      const failedLocation: FailedLocation = {
        locationId: action.locationId,
        failedAt: Date.now(),
        stealAvailable: true,
        stealExpires: Date.now() + 20 * 60 * 1000, // 20 minutes
      };
      return {
        ...state,
        rivals: {
          ...state.rivals,
          [action.rivalId]: {
            ...rival,
            failedLocations: [...rival.failedLocations, failedLocation],
            currentLocation: null,
          },
        },
      };
    }

    case 'START_RACE':
      return {
        ...state,
        race: {
          ...initialRaceState,
          active: true,
          opponent: action.opponent,
          locationId: action.locationId,
        },
        rivals: {
          ...state.rivals,
          [action.opponent]: {
            ...state.rivals[action.opponent],
            status: 'racing',
          },
        },
      };

    case 'UPDATE_RACE':
      return {
        ...state,
        race: {
          ...state.race,
          ...action.updates,
        },
      };

    case 'END_RACE': {
      const opponent = state.race.opponent;
      if (!opponent) return state;
      return {
        ...state,
        race: {
          ...state.race,
          active: false,
          result: action.result,
        },
        rivals: {
          ...state.rivals,
          [opponent]: {
            ...state.rivals[opponent],
            status: 'active',
          },
        },
      };
    }

    case 'START_STEAL':
      return {
        ...state,
        steal: {
          ...initialStealState,
          active: true,
          target: action.target,
          locationId: action.locationId,
          timeRemaining: 60, // 60 seconds for steal challenge
        },
        rivals: {
          ...state.rivals,
          [action.target]: {
            ...state.rivals[action.target],
            status: 'stealing',
          },
        },
      };

    case 'UPDATE_STEAL':
      return {
        ...state,
        steal: {
          ...state.steal,
          ...action.updates,
        },
      };

    case 'END_STEAL': {
      const target = state.steal.target;
      if (!target) return state;

      // Remove the steal opportunity from the target's failed locations
      const updatedFailedLocations = state.rivals[target].failedLocations.map(fl =>
        fl.locationId === state.steal.locationId
          ? { ...fl, stealAvailable: false }
          : fl
      );

      return {
        ...state,
        steal: {
          ...state.steal,
          active: false,
          result: action.result,
        },
        rivals: {
          ...state.rivals,
          [target]: {
            ...state.rivals[target],
            status: 'active',
            failedLocations: updatedFailedLocations,
            // If steal was successful, remove a key from rival
            keysCollected: action.result === 'success'
              ? Math.max(0, state.rivals[target].keysCollected - 1)
              : state.rivals[target].keysCollected,
          },
        },
      };
    }

    case 'EXPIRE_STEAL_OPPORTUNITY': {
      const rival = state.rivals[action.rivalId];
      const updatedFailedLocations = rival.failedLocations.map(fl =>
        fl.locationId === action.locationId
          ? { ...fl, stealAvailable: false }
          : fl
      );
      return {
        ...state,
        rivals: {
          ...state.rivals,
          [action.rivalId]: {
            ...rival,
            failedLocations: updatedFailedLocations,
          },
        },
      };
    }

    case 'SHOW_INTERRUPTION':
      return {
        ...state,
        interruption: {
          ...initialInterruptionState,
          active: true,
          ...action.interruption,
        },
      };

    case 'DISMISS_INTERRUPTION':
      return {
        ...state,
        interruption: initialInterruptionState,
      };

    case 'USE_COUSIN_CALL':
      return {
        ...state,
        cousinCallsRemaining: state.cousinCallsRemaining - 1,
        lastCousinCall: Date.now(),
      };

    case 'UPDATE_RIVAL_MOVE_TIME':
      return {
        ...state,
        rivals: {
          ...state.rivals,
          [action.rivalId]: {
            ...state.rivals[action.rivalId],
            nextMoveTime: action.nextMoveTime,
          },
        },
      };

    case 'RESET_RIVALS':
      return initialState;

    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

interface RivalContextValue {
  state: RivalSystemState;

  // Rival movement
  moveRival: (rivalId: 'brendan' | 'maeve', locationId: string) => void;
  rivalCompleteLocation: (rivalId: 'brendan' | 'maeve', locationId: string) => void;
  rivalFailLocation: (rivalId: 'brendan' | 'maeve', locationId: string) => void;

  // Race system
  startRace: (opponent: 'brendan' | 'maeve', locationId: string) => void;
  updateRace: (updates: Partial<RaceState>) => void;
  endRace: (result: 'win' | 'loss' | 'tie') => void;
  checkForRace: (locationId: string) => 'brendan' | 'maeve' | null;

  // Steal system
  startSteal: (target: 'brendan' | 'maeve', locationId: string) => void;
  updateSteal: (updates: Partial<StealState>) => void;
  endSteal: (result: 'success' | 'failure') => void;
  getAvailableSteals: () => { rivalId: 'brendan' | 'maeve'; locationId: string; timeRemaining: number }[];

  // Interruptions
  showInterruption: (interruption: Partial<InterruptionState>) => void;
  dismissInterruption: () => void;
  triggerRandomInterruption: () => void;

  // Cousin lifeline
  useCousinCall: () => boolean;
  getCousinResponse: (questionId: string, choices: string[], correctIndex: number) => CousinResponse;
  canUseCousinCall: () => boolean;

  // Computed values
  getRivalLocation: (rivalId: 'brendan' | 'maeve') => string | null;
  getRivalProgress: (rivalId: 'brendan' | 'maeve') => number;
  isRivalAhead: (rivalId: 'brendan' | 'maeve') => boolean;
  getLeadingRival: () => 'brendan' | 'maeve' | 'tie';

  // Reset
  resetRivals: () => void;
}

const RivalContext = createContext<RivalContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface RivalProviderProps {
  children: ReactNode;
  stealQuestions?: StealQuestion[];
}

export function RivalProvider({ children }: RivalProviderProps) {
  const [state, dispatch] = useReducer(rivalReducer, initialState);
  const { state: gameState, addScore } = useGame();
  const movementTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stealExpiryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get all locations for rival movement logic
  const allLocations = getAllLocations();

  // ============================================
  // RIVAL MOVEMENT TIMER
  // ============================================

  const getNextMoveTime = useCallback(() => {
    const min = state.movementIntervalMin;
    const max = state.movementIntervalMax;
    return Date.now() + min + Math.random() * (max - min);
  }, [state.movementIntervalMin, state.movementIntervalMax]);

  const getAvailableLocationsForRival = useCallback((rivalId: 'brendan' | 'maeve') => {
    const rival = state.rivals[rivalId];
    const playerCompleted = gameState.completedLocations;

    // Rivals can only move to locations that:
    // 1. They haven't completed
    // 2. They aren't currently at
    // 3. The player has unlocked (based on unlock requirements)
    // 4. They haven't failed (unless enough time has passed)

    const failedLocationIds = rival.failedLocations
      .filter(fl => fl.stealAvailable) // Still in cooldown
      .map(fl => fl.locationId);

    return allLocations.filter(loc => {
      // Skip if rival already completed
      if (rival.locationProgress.includes(loc.id)) return false;
      // Skip if currently there
      if (rival.currentLocation === loc.id) return false;
      // Skip if recently failed
      if (failedLocationIds.includes(loc.id)) return false;
      // Check unlock requirements (rival follows same unlock rules)
      if (loc.unlockRequirement) {
        const hasAllRequirements = loc.unlockRequirement.every(
          req => playerCompleted.includes(req) || rival.locationProgress.includes(req)
        );
        if (!hasAllRequirements) return false;
      }
      return true;
    });
  }, [state.rivals, gameState.completedLocations, allLocations]);

  const moveRivalAutomatically = useCallback((rivalId: 'brendan' | 'maeve') => {
    const rival = state.rivals[rivalId];

    // Don't move if rival is in a race or steal
    if (rival.status !== 'active') return;

    // Don't start rival movement until player has completed at least 2 locations
    if (gameState.completedLocations.length < 2) return;

    // Check if it's time to move
    if (Date.now() < rival.nextMoveTime) return;

    const availableLocations = getAvailableLocationsForRival(rivalId);
    if (availableLocations.length === 0) return;

    // Pick a random available location
    const randomIndex = Math.floor(Math.random() * availableLocations.length);
    const targetLocation = availableLocations[randomIndex];

    dispatch({ type: 'MOVE_RIVAL', rivalId, locationId: targetLocation.id });
    dispatch({
      type: 'UPDATE_RIVAL_MOVE_TIME',
      rivalId,
      nextMoveTime: getNextMoveTime()
    });

    // Simulate rival completing the location after some time (30-60 seconds)
    const completionTime = 30000 + Math.random() * 30000;
    setTimeout(() => {
      // 80% chance to complete, 20% chance to fail
      if (Math.random() < 0.8) {
        dispatch({ type: 'RIVAL_COMPLETE_LOCATION', rivalId, locationId: targetLocation.id });
      } else {
        dispatch({ type: 'RIVAL_FAIL_LOCATION', rivalId, locationId: targetLocation.id });
      }
    }, completionTime);
  }, [state.rivals, getAvailableLocationsForRival, getNextMoveTime]);

  // Movement timer effect
  useEffect(() => {
    movementTimerRef.current = setInterval(() => {
      moveRivalAutomatically('brendan');
      moveRivalAutomatically('maeve');
    }, 5000); // Check every 5 seconds

    return () => {
      if (movementTimerRef.current) {
        clearInterval(movementTimerRef.current);
      }
    };
  }, [moveRivalAutomatically]);

  // Steal expiry timer effect
  useEffect(() => {
    stealExpiryTimerRef.current = setInterval(() => {
      const now = Date.now();

      // Check Brendan's failed locations
      state.rivals.brendan.failedLocations.forEach(fl => {
        if (fl.stealAvailable && now >= fl.stealExpires) {
          dispatch({
            type: 'EXPIRE_STEAL_OPPORTUNITY',
            rivalId: 'brendan',
            locationId: fl.locationId
          });
        }
      });

      // Check Maeve's failed locations
      state.rivals.maeve.failedLocations.forEach(fl => {
        if (fl.stealAvailable && now >= fl.stealExpires) {
          dispatch({
            type: 'EXPIRE_STEAL_OPPORTUNITY',
            rivalId: 'maeve',
            locationId: fl.locationId
          });
        }
      });
    }, 10000); // Check every 10 seconds

    return () => {
      if (stealExpiryTimerRef.current) {
        clearInterval(stealExpiryTimerRef.current);
      }
    };
  }, [state.rivals.brendan.failedLocations, state.rivals.maeve.failedLocations]);

  // ============================================
  // RIVAL ACTIONS
  // ============================================

  const moveRival = useCallback((rivalId: 'brendan' | 'maeve', locationId: string) => {
    dispatch({ type: 'MOVE_RIVAL', rivalId, locationId });
  }, []);

  const rivalCompleteLocation = useCallback((rivalId: 'brendan' | 'maeve', locationId: string) => {
    dispatch({ type: 'RIVAL_COMPLETE_LOCATION', rivalId, locationId });
  }, []);

  const rivalFailLocation = useCallback((rivalId: 'brendan' | 'maeve', locationId: string) => {
    dispatch({ type: 'RIVAL_FAIL_LOCATION', rivalId, locationId });
  }, []);

  // ============================================
  // RACE SYSTEM
  // ============================================

  const checkForRace = useCallback((locationId: string): 'brendan' | 'maeve' | null => {
    // Check if either rival is at this location
    if (state.rivals.brendan.currentLocation === locationId &&
        state.rivals.brendan.status === 'active') {
      return 'brendan';
    }
    if (state.rivals.maeve.currentLocation === locationId &&
        state.rivals.maeve.status === 'active') {
      return 'maeve';
    }
    return null;
  }, [state.rivals]);

  const startRace = useCallback((opponent: 'brendan' | 'maeve', locationId: string) => {
    dispatch({ type: 'START_RACE', opponent, locationId });
  }, []);

  const updateRace = useCallback((updates: Partial<RaceState>) => {
    dispatch({ type: 'UPDATE_RACE', updates });
  }, []);

  const endRace = useCallback((result: 'win' | 'loss' | 'tie') => {
    dispatch({ type: 'END_RACE', result });

    // Apply score changes
    if (result === 'win') {
      addScore(100); // Race win bonus
    } else if (result === 'loss') {
      addScore(-25); // Race loss penalty
    }
    // Tie: no score change
  }, [addScore]);

  // ============================================
  // STEAL SYSTEM
  // ============================================

  const getAvailableSteals = useCallback(() => {
    const now = Date.now();
    const steals: { rivalId: 'brendan' | 'maeve'; locationId: string; timeRemaining: number }[] = [];

    (['brendan', 'maeve'] as const).forEach(rivalId => {
      state.rivals[rivalId].failedLocations.forEach(fl => {
        if (fl.stealAvailable && fl.stealExpires > now) {
          steals.push({
            rivalId,
            locationId: fl.locationId,
            timeRemaining: Math.floor((fl.stealExpires - now) / 1000),
          });
        }
      });
    });

    return steals;
  }, [state.rivals]);

  const startSteal = useCallback((target: 'brendan' | 'maeve', locationId: string) => {
    dispatch({ type: 'START_STEAL', target, locationId });
  }, []);

  const updateSteal = useCallback((updates: Partial<StealState>) => {
    dispatch({ type: 'UPDATE_STEAL', updates });
  }, []);

  const endSteal = useCallback((result: 'success' | 'failure') => {
    dispatch({ type: 'END_STEAL', result });

    // Apply score changes
    if (result === 'success') {
      addScore(150); // Steal success: +150 to player, key transferred
    } else {
      addScore(-150); // Steal failure: -150 penalty
    }
  }, [addScore]);

  // ============================================
  // INTERRUPTIONS
  // ============================================

  const showInterruption = useCallback((interruption: Partial<InterruptionState>) => {
    dispatch({ type: 'SHOW_INTERRUPTION', interruption });
  }, []);

  const dismissInterruption = useCallback(() => {
    dispatch({ type: 'DISMISS_INTERRUPTION' });
  }, []);

  const triggerRandomInterruption = useCallback(() => {
    // 30% chance of Brendan text, 20% chance of Maeve memo
    const roll = Math.random();

    if (roll < 0.3) {
      // Brendan text overlay
      const brendanTexts = [
        "Yo cuz! Just crushed Fenway. You slowin' down or what?",
        "Bro I heard Maeve's like 2 keys ahead. Pick it up!",
        "This trivia is wicked easy, you got this 💪",
        "Dude I almost choked at North End but pulled through",
        "Mom's asking when you're gonna finish. No pressure lol",
      ];
      showInterruption({
        type: 'brendan_text',
        source: 'brendan',
        content: brendanTexts[Math.floor(Math.random() * brendanTexts.length)],
        displayDuration: 4000,
      });
    } else if (roll < 0.5) {
      // Maeve voice memo
      const maeveTexts = [
        "Hey, just wanted to check in. I'm making good progress but don't let that psych you out.",
        "Quick tip: the North End questions are mostly about food history. Trust your gut.",
        "I know we're competing but... good luck out there. Seriously.",
        "Brendan keeps texting me updates about you. He's actually rooting for you, you know.",
      ];
      showInterruption({
        type: 'maeve_memo',
        source: 'maeve',
        content: maeveTexts[Math.floor(Math.random() * maeveTexts.length)],
        audioFile: `/assets/audio/maeve/memo_${Math.floor(Math.random() * 4) + 1}.mp3`,
        displayDuration: 6000,
      });
    }
    // 50% chance: no interruption
  }, [showInterruption]);

  // ============================================
  // COUSIN LIFELINE
  // ============================================

  const canUseCousinCall = useCallback(() => {
    return state.cousinCallsRemaining > 0;
  }, [state.cousinCallsRemaining]);

  const useCousinCall = useCallback(() => {
    if (!canUseCousinCall()) return false;
    dispatch({ type: 'USE_COUSIN_CALL' });
    return true;
  }, [canUseCousinCall]);

  const getCousinResponse = useCallback((
    _questionId: string,
    choices: string[],
    correctIndex: number
  ): CousinResponse => {
    // Alternate between Brendan and Maeve
    const useBrendan = (state.cousinCallsRemaining % 2) === 0;
    const rivalId = useBrendan ? 'brendan' : 'maeve';

    // Brendan: 60% accurate, quick response
    // Maeve: 80% accurate, may callback with correction
    const accuracy = useBrendan ? 0.6 : 0.8;
    const isCorrect = Math.random() < accuracy;

    let suggestedAnswer: number;
    if (isCorrect) {
      suggestedAnswer = correctIndex;
    } else {
      // Pick a wrong answer
      const wrongIndices = choices.map((_, i) => i).filter(i => i !== correctIndex);
      suggestedAnswer = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
    }

    const response: CousinResponse = {
      rivalId,
      text: useBrendan
        ? `Yo, I think it's ${String.fromCharCode(65 + suggestedAnswer)}. Pretty sure about this one.`
        : `Hmm, I'd go with ${String.fromCharCode(65 + suggestedAnswer)}. Let me think about it more though...`,
      suggestedAnswer,
      confidence: isCorrect ? (useBrendan ? 0.7 : 0.9) : (useBrendan ? 0.5 : 0.6),
    };

    // Maeve has 50% chance to callback with correction if she was wrong
    if (!useBrendan && !isCorrect && Math.random() < 0.5) {
      response.callback = {
        delay: 15, // 15 seconds later
        text: `Wait, I thought about it more. I think it's actually ${String.fromCharCode(65 + correctIndex)}. Sorry about that!`,
        correction: correctIndex,
      };
    }

    return response;
  }, [state.cousinCallsRemaining]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const getRivalLocation = useCallback((rivalId: 'brendan' | 'maeve') => {
    return state.rivals[rivalId].currentLocation;
  }, [state.rivals]);

  const getRivalProgress = useCallback((rivalId: 'brendan' | 'maeve') => {
    return state.rivals[rivalId].keysCollected;
  }, [state.rivals]);

  const isRivalAhead = useCallback((rivalId: 'brendan' | 'maeve') => {
    return state.rivals[rivalId].keysCollected > gameState.keysCollected.length;
  }, [state.rivals, gameState.keysCollected.length]);

  const getLeadingRival = useCallback((): 'brendan' | 'maeve' | 'tie' => {
    const brendanKeys = state.rivals.brendan.keysCollected;
    const maeveKeys = state.rivals.maeve.keysCollected;

    if (brendanKeys > maeveKeys) return 'brendan';
    if (maeveKeys > brendanKeys) return 'maeve';
    return 'tie';
  }, [state.rivals]);

  const resetRivals = useCallback(() => {
    dispatch({ type: 'RESET_RIVALS' });
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: RivalContextValue = {
    state,
    moveRival,
    rivalCompleteLocation,
    rivalFailLocation,
    startRace,
    updateRace,
    endRace,
    checkForRace,
    startSteal,
    updateSteal,
    endSteal,
    getAvailableSteals,
    showInterruption,
    dismissInterruption,
    triggerRandomInterruption,
    useCousinCall,
    getCousinResponse,
    canUseCousinCall,
    getRivalLocation,
    getRivalProgress,
    isRivalAhead,
    getLeadingRival,
    resetRivals,
  };

  return (
    <RivalContext.Provider value={value}>
      {children}
    </RivalContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useRival(): RivalContextValue {
  const context = useContext(RivalContext);
  if (!context) {
    throw new Error('useRival must be used within a RivalProvider');
  }
  return context;
}
