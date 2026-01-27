// ============================================
// GAME TYPES
// ============================================

export interface Location {
  id: string;
  name: string;
  npc: string;
  unlockRequirement: string[] | null;
  triviaCount: number;
  parTime: number;
  redemptionType: RedemptionType;
  backgroundImage: string;
}

export type RedemptionType =
  | 'pronunciation'
  | 'memory_match'
  | 'speed_naming'
  | 'unscramble'
  | 'timeline'
  | 'spot_errors'
  | 'match_game'
  | 'quote_completion'
  | 'photo_id'
  | 'rapid_fire';

export interface Character {
  id: string;
  name: string;
  location?: string;
  portrait: string;
  voiceProfile: VoiceProfile;
  perk?: PlayerPerk;
  description?: string;
}

export interface VoiceProfile {
  rate: number;
  pitch: number;
  voice?: string;
}

export interface PlayerPerk {
  id: string;
  name: string;
  description: string;
}

// ============================================
// TRIVIA TYPES
// ============================================

export interface TriviaQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  npcReactionCorrect: string;
  npcReactionWrong: string;
  difficulty?: 'normal' | 'hard';
  polaroidReward?: string;
}

export interface RedemptionChallenge {
  type: 'speed_naming' | 'matching' | 'timeline' | 'rapid_fire';
  instructions: string;
  validAnswers?: string[];
  passThreshold: number;
  timeLimit: number;
  npcPassResponse: string;
  npcFailResponse: string;
}

export interface TriviaSet {
  locationId: string;
  questions: TriviaQuestion[];
  alternateQuestions?: TriviaQuestion[];
  redemptionChallenge?: RedemptionChallenge;
}

// ============================================
// DIALOGUE TYPES
// ============================================

export interface DialogueLine {
  speaker: 'npc' | 'player' | 'narrator';
  speakerId?: string;
  text: string;
  characterVariants?: Record<string, string>;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
}

export interface DialogueSequence {
  id: string;
  locationId: string;
  type: 'intro' | 'success' | 'failure' | 'redemption_pass' | 'redemption_fail';
  lines: DialogueLine[];
}

// ============================================
// POLAROID TYPES
// ============================================

export interface Polaroid {
  id: string;
  location: string;
  image: string;
  caption: string;
  triggerType: 'dialogue_branch' | 'environment' | 'trivia_bonus' | 'redemption_reward';
  triggerCondition?: string;
}

// ============================================
// RIVAL TYPES
// ============================================

export interface Rival {
  id: string;
  name: string;
  portrait: string;
  voiceProfile: VoiceProfile;
  personality: string;
}

export interface RivalMessage {
  rivalId: string;
  locationId: string;
  trigger: 'player_enter' | 'player_complete' | 'player_fail' | 'rival_complete';
  text: string;
  messageType: 'text' | 'voice_memo';
}

// ============================================
// RIVAL RACING TYPES (Enhancement Phase 12)
// ============================================

export type RivalStatus = 'active' | 'racing' | 'stealing' | 'completed' | 'eliminated';

export interface FailedLocation {
  locationId: string;
  failedAt: number; // timestamp
  stealAvailable: boolean;
  stealExpires: number; // 20 minutes after fail
}

export interface RivalCharacter {
  id: 'brendan' | 'maeve';
  name: string;
  portrait: string;
  voiceProfile: VoiceProfile;
  personality: string;
  // Dynamic game state
  currentLocation: string | null;
  locationProgress: string[]; // locations they've completed
  keysCollected: number;
  failedLocations: FailedLocation[];
  score: number;
  status: RivalStatus;
  // Movement timing
  lastMoveTime: number;
  nextMoveTime: number;
}

export interface RaceState {
  active: boolean;
  opponent: 'brendan' | 'maeve' | null;
  locationId: string | null;
  questionIndex: number;
  playerAnswerTime: number | null;
  opponentAnswerTime: number | null;
  opponentAnswer: number | null; // index of their chosen answer
  opponentCorrect: boolean | null;
  result: 'win' | 'loss' | 'tie' | null;
}

export interface StealState {
  active: boolean;
  target: 'brendan' | 'maeve' | null;
  locationId: string | null;
  questionIndex: number;
  timeRemaining: number;
  result: 'success' | 'failure' | null;
}

export type InterruptionType = 'brendan_text' | 'maeve_memo' | 'group_chat';

export interface InterruptionState {
  active: boolean;
  type: InterruptionType | null;
  source: 'brendan' | 'maeve' | null;
  content: string;
  audioFile?: string;
  displayDuration: number;
  helpContent?: string; // For cousin lifeline hints
}

export interface RivalSystemState {
  rivals: {
    brendan: RivalCharacter;
    maeve: RivalCharacter;
  };
  race: RaceState;
  steal: StealState;
  interruption: InterruptionState;
  // Cousin lifeline tracking
  cousinCallsRemaining: number;
  lastCousinCall: number | null;
  // Movement interval settings
  movementIntervalMin: number; // 45 seconds
  movementIntervalMax: number; // 90 seconds
}

export interface StealQuestion {
  id: string;
  locationId: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  difficulty: 'expert';
}

export interface CousinResponse {
  rivalId: 'brendan' | 'maeve';
  text: string;
  suggestedAnswer: number; // index
  confidence: number; // 0-1, brendan ~0.6, maeve ~0.8
  callback?: {
    delay: number; // seconds before callback
    text: string;
    correction?: number; // corrected answer index if initial was wrong
  };
}

// ============================================
// GAME STATE TYPES
// ============================================

export interface AnsweredQuestion {
  correct: boolean;
  attempts: number;
}

export interface GameState {
  // Player
  selectedCharacter: string | null;

  // Progress
  currentLocation: string | null;
  completedLocations: string[];
  keysCollected: string[];

  // Scoring
  score: number;
  hintsRemaining: number;

  // Trivia tracking
  answeredQuestions: Record<string, AnsweredQuestion>;

  // Collectibles
  collectedPolaroids: string[];

  // Rivals
  rivalScores: {
    brendan: number;
    maeve: number;
  };

  // Gauntlet
  gauntletAttempts: number;
  gauntletPassed: boolean;

  // Meta
  playthroughId: string;
  startedAt: number;
  totalPlayTime: number;
}

export interface AudioState {
  voiceEnabled: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
}

// ============================================
// SAVE DATA TYPES
// ============================================

export interface SaveData {
  version: string;
  timestamp: number;
  playthrough: {
    id: string;
    startedAt: number;
    totalPlayTime: number;
  };
  gameState: GameState;
  audioSettings: AudioState;
}

export interface LeaderboardEntry {
  character: string;
  score: number;
  endingType: 'standard' | 'true' | 'perfect';
  polaroidsCollected: number;
  completedAt: number;
  playTime: number;
}

// ============================================
// LOCATION STATE MACHINE
// ============================================

export type LocationPhase =
  | 'entering'
  | 'intro_dialogue'
  | 'trivia_loop'
  | 'trivia_result'
  | 'success_dialogue'
  | 'failure_dialogue'
  | 'redemption_challenge'
  | 'key_ceremony'
  | 'exit';

// ============================================
// SCREEN TYPES
// ============================================

export type ScreenId =
  | 'title'
  | 'character_select'
  | 'map'
  | 'location'
  | 'redemption'
  | 'gauntlet'
  | 'ending'
  | 'collection'
  | 'settings';

// ============================================
// LIFELINE TYPES (Enhancement Phase 11)
// ============================================

export type LifelineType = 'fifty_fifty' | 'ask_the_bar' | 'phone_a_local' | 'skip_and_replace';

export interface LifelineState {
  fiftyFifty: {
    remaining: number; // starts at 3
    usedThisLocation: boolean;
    usedInGauntlet: boolean;
  };
  askTheBar: {
    usedThisLocation: boolean; // resets per location, free lifeline
  };
  phoneLocal: {
    remaining: number; // starts at 2
    usedInGauntlet: boolean;
  };
  skipReplace: {
    remaining: number; // starts at 2
  };
  // Track total lifelines used for efficiency bonus
  totalUsed: number;
}

export interface LifelineConfig {
  fiftyFiftyMax: number;
  askTheBarPerLocation: number;
  phoneLocalMax: number;
  skipReplaceMax: number;
  skipReplaceCost: number; // Can be modified by character perk
}

export interface LifelineHint {
  questionId: string;
  text: string;
  audioFile?: string;
}

export interface NPCHintData {
  npcId: string;
  locationId: string;
  hints: LifelineHint[];
}

// Extended hint with NPC info for use in components
export interface LifelineHintWithNpc extends LifelineHint {
  npcId: string;
}

export interface SullyHint {
  theme: string;
  questionId: string;
  text: string;
  audioFile: string;
}

// Lifeline costs
export const LIFELINE_COSTS = {
  fifty_fifty: -15,
  ask_the_bar: 0, // FREE
  phone_a_local: -30,
  skip_and_replace: -50, // Can be modified by Colleen's perk to -35
} as const;
