import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { GameState, AnsweredQuestion } from '../types';
import { GAME_CONSTANTS } from '../data';

// ============================================
// INITIAL STATE
// ============================================

function generatePlaythroughId(): string {
  return `playthrough_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Lifeline defaults moved to LifelineContext

const initialState: GameState = {
  // Player
  selectedCharacter: null,

  // Progress
  currentLocation: null,
  completedLocations: [],
  keysCollected: [],

  // Scoring
  score: 0,
  hintsRemaining: 3,

  // Trivia tracking
  answeredQuestions: {},

  // Collectibles
  collectedPolaroids: [],

  // Rivals
  rivalScores: {
    brendan: 0,
    maeve: 0,
  },

  // Gauntlet
  gauntletAttempts: 0,
  gauntletPassed: false,

  // Meta
  playthroughId: generatePlaythroughId(),
  startedAt: Date.now(),
  totalPlayTime: 0,
};

// ============================================
// ACTION TYPES
// ============================================

type GameAction =
  | { type: 'SELECT_CHARACTER'; characterId: string }
  | { type: 'START_LOCATION'; locationId: string }
  | { type: 'COMPLETE_LOCATION'; locationId: string; keyEarned: boolean }
  | { type: 'LEAVE_LOCATION' }
  | { type: 'ANSWER_QUESTION'; questionId: string; correct: boolean }
  | { type: 'USE_HINT' }
  | { type: 'ADD_SCORE'; points: number }
  | { type: 'COLLECT_POLAROID'; polaroidId: string }
  | { type: 'UPDATE_RIVAL_SCORE'; rivalId: 'brendan' | 'maeve'; score: number }
  | { type: 'START_GAUNTLET' }
  | { type: 'COMPLETE_GAUNTLET'; passed: boolean }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_GAME'; state: GameState }
  | { type: 'UPDATE_PLAY_TIME'; time: number }
  | { type: 'USE_LIFELINE'; lifeline: string }
  | { type: 'RESET_LIFELINES' };

// ============================================
// REDUCER
// ============================================

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_CHARACTER':
      return {
        ...state,
        selectedCharacter: action.characterId,
      };

    case 'START_LOCATION':
      return {
        ...state,
        currentLocation: action.locationId,
      };

    case 'COMPLETE_LOCATION': {
      const newCompleted = state.completedLocations.includes(action.locationId)
        ? state.completedLocations
        : [...state.completedLocations, action.locationId];

      const newKeys = action.keyEarned && !state.keysCollected.includes(action.locationId)
        ? [...state.keysCollected, action.locationId]
        : state.keysCollected;

      return {
        ...state,
        currentLocation: null,
        completedLocations: newCompleted,
        keysCollected: newKeys,
      };
    }

    case 'LEAVE_LOCATION':
      return {
        ...state,
        currentLocation: null,
      };

    case 'ANSWER_QUESTION': {
      const existing = state.answeredQuestions[action.questionId];
      const newAnswered: AnsweredQuestion = {
        correct: action.correct,
        attempts: (existing?.attempts || 0) + 1,
      };

      return {
        ...state,
        answeredQuestions: {
          ...state.answeredQuestions,
          [action.questionId]: newAnswered,
        },
      };
    }

    case 'USE_HINT':
      return {
        ...state,
        hintsRemaining: Math.max(0, state.hintsRemaining - 1),
      };

    case 'ADD_SCORE':
      return {
        ...state,
        score: Math.max(0, state.score + action.points),
      };

    case 'COLLECT_POLAROID':
      if (state.collectedPolaroids.includes(action.polaroidId)) {
        return state;
      }
      return {
        ...state,
        collectedPolaroids: [...state.collectedPolaroids, action.polaroidId],
      };

    case 'UPDATE_RIVAL_SCORE':
      return {
        ...state,
        rivalScores: {
          ...state.rivalScores,
          [action.rivalId]: action.score,
        },
      };

    case 'START_GAUNTLET':
      return {
        ...state,
        gauntletAttempts: state.gauntletAttempts + 1,
      };

    case 'COMPLETE_GAUNTLET':
      return {
        ...state,
        gauntletPassed: action.passed,
      };

    case 'RESET_GAME':
      return {
        ...initialState,
        playthroughId: generatePlaythroughId(),
        startedAt: Date.now(),
      };

    case 'LOAD_GAME':
      return action.state;

    case 'UPDATE_PLAY_TIME':
      return {
        ...state,
        totalPlayTime: action.time,
      };

    case 'USE_LIFELINE':
      // Lifeline state is managed separately but we track usage here
      return state;

    case 'RESET_LIFELINES':
      return state;

    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;

  // Helper methods
  selectCharacter: (characterId: string) => void;
  startLocation: (locationId: string) => void;
  completeLocation: (locationId: string, keyEarned?: boolean) => void;
  failLocation: (locationId: string) => void;
  leaveLocation: () => void;
  answerQuestion: (questionId: string, correct: boolean) => void;
  useHint: () => void;
  addScore: (points: number) => void;
  collectPolaroid: (polaroidId: string) => void;
  startGauntlet: () => void;
  attemptGauntlet: (passed: boolean, score: number) => void;
  completeGauntlet: (passed: boolean) => void;
  updateRivalScore: (rivalId: 'brendan' | 'maeve', score: number) => void;
  resetGame: () => void;

  // Computed values
  canAccessGauntlet: boolean;
  canAttemptGauntlet: boolean;
  totalKeys: number;
  correctAnswersForLocation: (locationId: string) => number;
  locationProgress: string;
  endingType: 'standard' | 'true' | 'perfect';
}

const GameContext = createContext<GameContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Helper methods
  const selectCharacter = (characterId: string) => {
    dispatch({ type: 'SELECT_CHARACTER', characterId });
  };

  const startLocation = (locationId: string) => {
    dispatch({ type: 'START_LOCATION', locationId });
  };

  const completeLocation = (locationId: string, keyEarned: boolean = true) => {
    dispatch({ type: 'COMPLETE_LOCATION', locationId, keyEarned });
  };

  const failLocation = (_locationId: string) => {
    // Location failed - no key earned, but tracked as attempted
    // locationId reserved for future failure tracking
    dispatch({ type: 'LEAVE_LOCATION' });
  };

  const leaveLocation = () => {
    dispatch({ type: 'LEAVE_LOCATION' });
  };

  const answerQuestion = (questionId: string, correct: boolean) => {
    dispatch({ type: 'ANSWER_QUESTION', questionId, correct });
  };

  const useHint = () => {
    dispatch({ type: 'USE_HINT' });
  };

  const addScore = (points: number) => {
    dispatch({ type: 'ADD_SCORE', points });
  };

  const collectPolaroid = (polaroidId: string) => {
    dispatch({ type: 'COLLECT_POLAROID', polaroidId });
  };

  const startGauntlet = () => {
    dispatch({ type: 'START_GAUNTLET' });
  };

  const attemptGauntlet = (passed: boolean, score: number) => {
    dispatch({ type: 'START_GAUNTLET' });
    dispatch({ type: 'ADD_SCORE', points: score });
    dispatch({ type: 'COMPLETE_GAUNTLET', passed });
  };

  const completeGauntlet = (passed: boolean) => {
    dispatch({ type: 'COMPLETE_GAUNTLET', passed });
  };

  const updateRivalScore = (rivalId: 'brendan' | 'maeve', score: number) => {
    dispatch({ type: 'UPDATE_RIVAL_SCORE', rivalId, score });
  };

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  // Computed values
  const canAccessGauntlet = state.keysCollected.length >= GAME_CONSTANTS.KEYS_FOR_GAUNTLET;
  const canAttemptGauntlet = canAccessGauntlet && !state.gauntletPassed;
  const totalKeys = state.keysCollected.length;

  const correctAnswersForLocation = (locationId: string): number => {
    return Object.entries(state.answeredQuestions)
      .filter(([questionId, answer]) =>
        questionId.startsWith(locationId) && answer.correct
      )
      .length;
  };

  const locationProgress = `${state.completedLocations.length}/10 locations | ${state.keysCollected.length}/10 keys`;

  // Determine ending type based on conditions
  const endingType: 'standard' | 'true' | 'perfect' = (() => {
    if (state.gauntletAttempts === 1 && state.gauntletPassed) {
      return 'perfect';
    }
    if (state.collectedPolaroids.length >= 30) {
      return 'true';
    }
    return 'standard';
  })();

  const value: GameContextValue = {
    state,
    dispatch,
    selectCharacter,
    startLocation,
    completeLocation,
    failLocation,
    leaveLocation,
    answerQuestion,
    useHint,
    addScore,
    collectPolaroid,
    startGauntlet,
    attemptGauntlet,
    completeGauntlet,
    updateRivalScore,
    resetGame,
    canAccessGauntlet,
    canAttemptGauntlet,
    totalKeys,
    correctAnswersForLocation,
    locationProgress,
    endingType,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
