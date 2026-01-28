import type { Location, Character, TriviaSet, Polaroid, Rival, LifelineHint, SullyHint, StealQuestion, DialogueLine, LocationInterludes, InterludeContent } from '../types';

// Import JSON data
import locationsData from './locations.json';
import charactersData from './characters.json';
import polaroidsData from './polaroids.json';
import lifelineHintsData from './lifeline-hints.json';
import stealQuestionsData from './steal-questions.json';
import rivalDialogueData from './rival-dialogue.json';
import npcDialogueData from './npc-dialogue.json';
import interludesData from './interludes.json';

// Import trivia files
import southieTrivia from './trivia/southie.json';
import northEndTrivia from './trivia/north_end.json';
import fenwayTrivia from './trivia/fenway.json';
import beaconHillTrivia from './trivia/beacon_hill.json';
import charlestownTrivia from './trivia/charlestown.json';
import backBayTrivia from './trivia/back_bay.json';
import cambridgeTrivia from './trivia/cambridge.json';
import dorchesterTrivia from './trivia/dorchester.json';
import downtownTrivia from './trivia/downtown.json';
import seaportTrivia from './trivia/seaport.json';
import gauntletTrivia from './trivia/gauntlet.json';

// ============================================
// LOCATIONS
// ============================================

export const locations: Record<string, Location> = locationsData as Record<string, Location>;

export function getLocation(id: string): Location | undefined {
  return locations[id];
}

export function getAllLocations(): Location[] {
  return Object.values(locations);
}

export function getUnlockedLocations(completedLocations: string[]): string[] {
  return getAllLocations()
    .filter(location => {
      if (!location.unlockRequirement) return true; // Southie is always unlocked
      return location.unlockRequirement.every(req => completedLocations.includes(req));
    })
    .map(location => location.id);
}

export function isLocationUnlocked(locationId: string, completedLocations: string[]): boolean {
  const location = getLocation(locationId);
  if (!location) return false;
  if (!location.unlockRequirement) return true;
  return location.unlockRequirement.every(req => completedLocations.includes(req));
}

// ============================================
// CHARACTERS
// ============================================

export const playerCharacters: Record<string, Character> = charactersData.players as Record<string, Character>;
export const npcs: Record<string, Character> = charactersData.npcs as Record<string, Character>;
export const rivals: Record<string, Rival> = charactersData.rivals as Record<string, Rival>;

export function getPlayerCharacter(id: string): Character | undefined {
  return playerCharacters[id];
}

export function getAllPlayerCharacters(): Character[] {
  return Object.values(playerCharacters);
}

export function getNpc(id: string): Character | undefined {
  return npcs[id];
}

export function getNpcForLocation(locationId: string): Character | undefined {
  const location = getLocation(locationId);
  if (!location) return undefined;
  return npcs[location.npc];
}

export function getRival(id: string): Rival | undefined {
  return rivals[id];
}

// ============================================
// TRIVIA
// ============================================

const triviaData: Record<string, TriviaSet> = {
  southie: southieTrivia as unknown as TriviaSet,
  north_end: northEndTrivia as unknown as TriviaSet,
  fenway: fenwayTrivia as unknown as TriviaSet,
  beacon_hill: beaconHillTrivia as unknown as TriviaSet,
  charlestown: charlestownTrivia as unknown as TriviaSet,
  back_bay: backBayTrivia as unknown as TriviaSet,
  cambridge: cambridgeTrivia as unknown as TriviaSet,
  dorchester: dorchesterTrivia as unknown as TriviaSet,
  downtown: downtownTrivia as unknown as TriviaSet,
  seaport: seaportTrivia as unknown as TriviaSet,
  gauntlet: gauntletTrivia as unknown as TriviaSet,
};

export function getTriviaForLocation(locationId: string): TriviaSet | undefined {
  return triviaData[locationId];
}

// Alias for simpler access
export function getTrivia(locationId: string): TriviaSet | undefined {
  return triviaData[locationId];
}

export function getRandomQuestions(locationId: string, count: number = 5): TriviaSet['questions'] {
  const trivia = getTriviaForLocation(locationId);
  if (!trivia) return [];

  // Shuffle and take the requested count
  const shuffled = [...trivia.questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getGauntletTrivia() {
  return gauntletTrivia;
}

// ============================================
// POLAROIDS
// ============================================

export const polaroids: Polaroid[] = polaroidsData.polaroids as Polaroid[];

export function getPolaroid(id: string): Polaroid | undefined {
  return polaroids.find(p => p.id === id);
}

export function getPolaroidsForLocation(locationId: string): Polaroid[] {
  return polaroids.filter(p => p.location === locationId);
}

export function getCollectedPolaroidsForLocation(locationId: string, collectedIds: string[]): Polaroid[] {
  return getPolaroidsForLocation(locationId).filter(p => collectedIds.includes(p.id));
}

export function getUncollectedPolaroidsForLocation(locationId: string, collectedIds: string[]): Polaroid[] {
  return getPolaroidsForLocation(locationId).filter(p => !collectedIds.includes(p.id));
}

export function getTotalPolaroidCount(): number {
  return polaroids.length;
}

export function hasAllPolaroidsForLocation(locationId: string, collectedIds: string[]): boolean {
  const locationPolaroids = getPolaroidsForLocation(locationId);
  return locationPolaroids.every(p => collectedIds.includes(p.id));
}

export function getUncollectedPolaroidByType(
  locationId: string,
  triggerType: 'environment' | 'dialogue_branch' | 'trivia_bonus' | 'redemption_reward',
  collectedIds: string[]
): Polaroid | undefined {
  const uncollected = getUncollectedPolaroidsForLocation(locationId, collectedIds);
  return uncollected.find(p => p.triggerType === triggerType);
}

export function getRandomUncollectedPolaroid(
  locationId: string,
  collectedIds: string[]
): Polaroid | undefined {
  const uncollected = getUncollectedPolaroidsForLocation(locationId, collectedIds);
  if (uncollected.length === 0) return undefined;
  return uncollected[Math.floor(Math.random() * uncollected.length)];
}

// ============================================
// SCORING HELPERS
// ============================================

export const SCORING = {
  CORRECT_ANSWER: 100,
  WRONG_ANSWER: -10,
  HINT_COST: 25,
  POLAROID_FOUND: 25,
  LOCATION_ALL_POLAROIDS_BONUS: 75,
  ALL_POLAROIDS_BONUS: 500,
  TIME_BONUS_PER_SECOND: 2,
  GAUNTLET_CORRECT: 150,
  GAUNTLET_WRONG: 0,
} as const;

export function calculateLocationScore(
  correctAnswers: number,
  wrongAnswers: number,
  hintsUsed: number,
  timeRemaining: number = 0
): number {
  const answerScore = (correctAnswers * SCORING.CORRECT_ANSWER) + (wrongAnswers * SCORING.WRONG_ANSWER);
  const hintPenalty = hintsUsed * SCORING.HINT_COST;
  const timeBonus = timeRemaining * SCORING.TIME_BONUS_PER_SECOND;
  return Math.max(0, answerScore - hintPenalty + timeBonus);
}

// ============================================
// GAME CONSTANTS
// ============================================

export const GAME_CONSTANTS = {
  QUESTIONS_PER_LOCATION: 5,
  PASSING_THRESHOLD: 3, // Correct answers needed to pass a location
  GAUNTLET_QUESTIONS: 10,
  GAUNTLET_PASSING_THRESHOLD: 7,
  TIMER_DURATION: 45, // Seconds per question
  TIMER_WARNING: 10, // Seconds left when warning shows
  TOTAL_KEYS: 10,
  KEYS_FOR_GAUNTLET: 10,
} as const;

// ============================================
// ENDING TYPES
// ============================================

export type EndingType = 'standard' | 'true' | 'perfect';

export function determineEnding(
  gauntletAttempts: number,
  polaroidsCollected: number,
  score: number
): EndingType {
  const allPolaroids = polaroidsCollected >= getTotalPolaroidCount() - 1; // Bonus polaroid excluded
  const firstTryGauntlet = gauntletAttempts === 1;
  const highScore = score >= 5000;

  if (firstTryGauntlet && allPolaroids && highScore) {
    return 'perfect';
  } else if (allPolaroids) {
    return 'true';
  } else {
    return 'standard';
  }
}

// ============================================
// LIFELINE HINTS
// ============================================

interface NPCHintData {
  npcId: string;
  locationId: string;
  hints: LifelineHint[];
}

const npcHintsMap = lifelineHintsData.npcHints as Record<string, NPCHintData>;
const sullyHintsMap = lifelineHintsData.sullyHints as Record<string, SullyHint[]>;

export function getNpcHintForQuestion(locationId: string, questionId: string): LifelineHint | undefined {
  const locationHints = npcHintsMap[locationId];
  if (!locationHints) return undefined;
  return locationHints.hints.find(h => h.questionId === questionId);
}

export function getSullyHintForQuestion(locationId: string, questionId: string): SullyHint | undefined {
  const locationHints = sullyHintsMap[locationId];
  if (!locationHints) return undefined;
  return locationHints.find(h => h.questionId === questionId);
}

export function getRandomNpcHint(locationId: string): LifelineHint | undefined {
  const locationHints = npcHintsMap[locationId];
  if (!locationHints || locationHints.hints.length === 0) return undefined;
  const randomIndex = Math.floor(Math.random() * locationHints.hints.length);
  return locationHints.hints[randomIndex];
}

export function getRandomSullyHint(locationId: string): SullyHint | undefined {
  const locationHints = sullyHintsMap[locationId];
  if (!locationHints || locationHints.length === 0) return undefined;
  const randomIndex = Math.floor(Math.random() * locationHints.length);
  return locationHints[randomIndex];
}

export const gauntletSullyReactions = lifelineHintsData.gauntletSullyReactions;

// ============================================
// STEAL QUESTIONS (Enhancement Phase 12)
// ============================================

export const stealQuestions: StealQuestion[] = stealQuestionsData.stealQuestions as StealQuestion[];

export function getStealQuestionForLocation(locationId: string): StealQuestion | undefined {
  const locationQuestions = stealQuestions.filter(q => q.locationId === locationId);
  if (locationQuestions.length === 0) return undefined;
  // Return a random steal question for this location
  return locationQuestions[Math.floor(Math.random() * locationQuestions.length)];
}

export function getRandomStealQuestion(): StealQuestion | undefined {
  if (stealQuestions.length === 0) return undefined;
  return stealQuestions[Math.floor(Math.random() * stealQuestions.length)];
}

// ============================================
// RIVAL DIALOGUE (Enhancement Phase 12)
// ============================================

export const rivalDialogue = rivalDialogueData.rivalDialogue;
export const systemMessages = rivalDialogueData.systemMessages;
export const locationSpecificDialogue = rivalDialogueData.locationSpecific;

export function getRivalDialogue(
  rivalId: 'brendan' | 'maeve',
  category: keyof typeof rivalDialogue.brendan
): string {
  const messages = rivalDialogue[rivalId][category] as string[];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getLocationDialogue(
  locationId: string,
  rivalId: 'brendan' | 'maeve'
): string | undefined {
  const locationData = locationSpecificDialogue[locationId as keyof typeof locationSpecificDialogue];
  if (!locationData) return undefined;
  return locationData[rivalId];
}

// ============================================
// NPC DIALOGUE VARIATION
// ============================================

interface NpcDialogueSet {
  npcOpener: string;
  npcFollowup: string;
  playerGreetings: Record<string, string>;
  npcChallenge: string;
}

interface NpcSuccessDialogue {
  line1: string;
  line2: string;
}

interface NpcFailureDialogue {
  line1: string;
  line2: string;
}

interface NpcDialogueData {
  intro: NpcDialogueSet[];
  success: NpcSuccessDialogue[];
  failure: NpcFailureDialogue[];
}

const npcDialogue = npcDialogueData as Record<string, NpcDialogueData>;

export function getRandomIntroDialogue(
  npcId: string,
  playerId: string
): DialogueLine[] {
  const dialogueData = npcDialogue[npcId];
  if (!dialogueData || !dialogueData.intro || dialogueData.intro.length === 0) {
    // Fallback to default dialogue
    return [
      { speaker: 'npc', speakerId: npcId, text: `Well, well. Another O'Brien looking for a key.`, audioFile: `${npcId}_intro_1.mp3` },
      { speaker: 'npc', speakerId: npcId, text: `Sully told me you might come by.`, audioFile: `${npcId}_intro_2.mp3` },
      { speaker: 'player', speakerId: playerId, text: `I'm here for the key.`, audioFile: `${playerId}_intro_response.mp3` },
      { speaker: 'npc', speakerId: npcId, text: `Let's see if you know your Boston. Five questions. Get three right.`, audioFile: `${npcId}_intro_3.mp3` },
    ];
  }

  // Pick a random intro set and get its index for audio file naming
  const introIndex = Math.floor(Math.random() * dialogueData.intro.length);
  const introSet = dialogueData.intro[introIndex];
  const playerGreeting = introSet.playerGreetings[playerId] || `I'm here for the key.`;

  return [
    { speaker: 'npc', speakerId: npcId, text: introSet.npcOpener, audioFile: `${npcId}_intro_${introIndex + 1}_1.mp3` },
    { speaker: 'npc', speakerId: npcId, text: introSet.npcFollowup, audioFile: `${npcId}_intro_${introIndex + 1}_2.mp3` },
    { speaker: 'player', speakerId: playerId, text: playerGreeting, audioFile: `${playerId}_intro_${npcId}_${introIndex + 1}.mp3` },
    { speaker: 'npc', speakerId: npcId, text: introSet.npcChallenge, audioFile: `${npcId}_intro_${introIndex + 1}_3.mp3` },
  ];
}

export function getRandomSuccessDialogue(npcId: string): DialogueLine[] {
  const dialogueData = npcDialogue[npcId];
  if (!dialogueData || !dialogueData.success || dialogueData.success.length === 0) {
    // Fallback to default dialogue
    return [
      { speaker: 'npc', speakerId: npcId, text: `Not bad, kid. Not bad at all.`, audioFile: `${npcId}_success_1.mp3` },
      { speaker: 'npc', speakerId: npcId, text: `Sully would've been proud. Here's your key.`, audioFile: `${npcId}_success_2.mp3` },
    ];
  }

  // Pick a random success set and get its index for audio file naming
  const successIndex = Math.floor(Math.random() * dialogueData.success.length);
  const successSet = dialogueData.success[successIndex];

  return [
    { speaker: 'npc', speakerId: npcId, text: successSet.line1, audioFile: `${npcId}_success_${successIndex + 1}_1.mp3` },
    { speaker: 'npc', speakerId: npcId, text: successSet.line2, audioFile: `${npcId}_success_${successIndex + 1}_2.mp3` },
  ];
}

export function getRandomFailureDialogue(npcId: string): DialogueLine[] {
  const dialogueData = npcDialogue[npcId];
  if (!dialogueData || !dialogueData.failure || dialogueData.failure.length === 0) {
    // Fallback to default dialogue
    return [
      { speaker: 'npc', speakerId: npcId, text: `That's... not great.`, audioFile: `${npcId}_failure_1.mp3` },
      { speaker: 'npc', speakerId: npcId, text: `You want another shot? Redemption challenge?`, audioFile: `${npcId}_failure_2.mp3` },
    ];
  }

  // Pick a random failure set and get its index for audio file naming
  const failureIndex = Math.floor(Math.random() * dialogueData.failure.length);
  const failureSet = dialogueData.failure[failureIndex];

  return [
    { speaker: 'npc', speakerId: npcId, text: failureSet.line1, audioFile: `${npcId}_failure_${failureIndex + 1}_1.mp3` },
    { speaker: 'npc', speakerId: npcId, text: failureSet.line2, audioFile: `${npcId}_failure_${failureIndex + 1}_2.mp3` },
  ];
}

// ============================================
// INTERLUDES (Between-question content)
// ============================================

const interludesMap = interludesData as Record<string, LocationInterludes>;

export function getInterludesForLocation(locationId: string): LocationInterludes | undefined {
  return interludesMap[locationId];
}

export function getInterludeForQuestion(
  locationId: string,
  questionIndex: number
): InterludeContent | undefined {
  const locationInterludes = interludesMap[locationId];
  if (!locationInterludes || !locationInterludes.interludes) return undefined;

  // Use questionIndex to pick an interlude (wrapping if needed)
  const interludeIndex = questionIndex % locationInterludes.interludes.length;
  return locationInterludes.interludes[interludeIndex];
}

export function getRandomInterlude(locationId: string): InterludeContent | undefined {
  const locationInterludes = interludesMap[locationId];
  if (!locationInterludes || locationInterludes.interludes.length === 0) return undefined;

  const randomIndex = Math.floor(Math.random() * locationInterludes.interludes.length);
  return locationInterludes.interludes[randomIndex];
}
