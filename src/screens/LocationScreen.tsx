import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DialogueBox, TriviaCard, Button, Portrait, ScoreDisplay } from '../components';
import { RaceSplitScreen, StealChallengeScreen } from '../components/rivals';
import { useGame, useLifeline, useRival, useAudio } from '../contexts';
import { useSFX } from '../hooks';
import { locations, npcs, getTrivia, playerCharacters, SCORING, GAME_CONSTANTS, getNpcHintForQuestion, getSullyHintForQuestion, getStealQuestionForLocation } from '../data';
import type { ScreenId, LocationPhase, DialogueLine, Character, TriviaQuestion, StealQuestion } from '../types';

interface LocationScreenProps {
  onNavigate: (screen: ScreenId, data?: Record<string, unknown>) => void;
  data: Record<string, unknown>;
}

// Helper function for character-specific greetings
function getPlayerGreeting(characterId: string): string {
  const greetings: Record<string, string> = {
    danny: "Hi, uh, sorry to bother you. I'm Danny. Sully's nephew? Great-nephew? Something like that.",
    colleen: "Let's skip the small talk. I'm Colleen. You have something I need.",
    fitz: "The name's Fitz. And before you ask — yes, I know about the tunnels under the city.",
    meg: "Meg. Here for the key. Can we make this quick?",
  };
  return greetings[characterId] || "I'm here for the key.";
}

export function LocationScreen({ onNavigate, data }: LocationScreenProps) {
  const locationId = data.locationId as string;
  const raceOpponent = data.raceOpponent as 'brendan' | 'maeve' | null | undefined;
  const stealTarget = data.stealTarget as 'brendan' | 'maeve' | null | undefined;
  const isStealChallenge = data.isStealChallenge as boolean | undefined;

  const location = locations[locationId];
  const npc = npcs[location.npc];
  const trivia = getTrivia(locationId);

  const {
    state,
    answerQuestion,
    addScore,
    completeLocation,
    failLocation
  } = useGame();

  const { resetLocationLifelines } = useLifeline();
  const { startRace, startSteal, triggerRandomInterruption } = useRival();

  const playerCharacter = state.selectedCharacter
    ? playerCharacters[state.selectedCharacter]
    : null;

  const { play: playSFX } = useSFX();
  const { playMusic } = useAudio();

  // Location state machine
  const [phase, setPhase] = useState<LocationPhase>('entering');
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showReaction, setShowReaction] = useState(false);
  const [lastReaction, setLastReaction] = useState('');
  const [usedAlternateIndices, setUsedAlternateIndices] = useState<number[]>([]);

  // Race and steal state
  const [isRacing, setIsRacing] = useState(false);
  const [isStealing, setIsStealing] = useState(false);
  const [stealQuestion, setStealQuestion] = useState<StealQuestion | null>(null);

  // Get the current question and its hints
  const currentQuestion = trivia?.questions[questionIndex];

  const npcHint = useMemo(() => {
    if (!currentQuestion) return undefined;
    return getNpcHintForQuestion(locationId, currentQuestion.id);
  }, [locationId, currentQuestion]);

  const sullyHint = useMemo(() => {
    if (!currentQuestion) return undefined;
    return getSullyHintForQuestion(locationId, currentQuestion.id);
  }, [locationId, currentQuestion]);

  // Get an alternate question for Skip & Replace
  const alternateQuestion = useMemo((): TriviaQuestion | undefined => {
    if (!trivia?.alternateQuestions || trivia.alternateQuestions.length === 0) return undefined;

    // Find an alternate that hasn't been used yet
    const availableIndices = trivia.alternateQuestions
      .map((_, i) => i)
      .filter(i => !usedAlternateIndices.includes(i));

    if (availableIndices.length === 0) return undefined;

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    return trivia.alternateQuestions[randomIndex];
  }, [trivia?.alternateQuestions, usedAlternateIndices]);

  // Handle Skip & Replace
  const handleSkipReplace = useCallback(() => {
    if (!trivia?.alternateQuestions) return;

    // Find which alternate was used
    const usedIndex = trivia.alternateQuestions.findIndex(
      q => q.id === alternateQuestion?.id
    );

    if (usedIndex !== -1) {
      setUsedAlternateIndices(prev => [...prev, usedIndex]);
    }
  }, [trivia?.alternateQuestions, alternateQuestion]);

  // Generate intro dialogue
  const introDialogue: DialogueLine[] = [
    { speaker: 'npc', speakerId: npc.id, text: `Well, well. Another O'Brien looking for a key.` },
    { speaker: 'npc', speakerId: npc.id, text: `Sully told me you might come by.` },
    { speaker: 'player', text: playerCharacter ? getPlayerGreeting(playerCharacter.id) : `I'm here for the key.` },
    { speaker: 'npc', speakerId: npc.id, text: `Let's see if you know your Boston. Five questions. Get three right.` },
  ];

  const successDialogue: DialogueLine[] = [
    { speaker: 'npc', speakerId: npc.id, text: `Not bad, kid. Not bad at all.` },
    { speaker: 'npc', speakerId: npc.id, text: `Sully would've been proud. Here's your key.` },
  ];

  const failureDialogue: DialogueLine[] = [
    { speaker: 'npc', speakerId: npc.id, text: `That's... not great.` },
    { speaker: 'npc', speakerId: npc.id, text: `You want another shot? Redemption challenge?` },
  ];

  // Handle race or steal mode on mount
  useEffect(() => {
    if (raceOpponent) {
      // Start a race immediately
      setIsRacing(true);
      startRace(raceOpponent, locationId);
    } else if (isStealChallenge && stealTarget) {
      // Start a steal challenge
      const question = getStealQuestionForLocation(locationId);
      if (question) {
        setStealQuestion(question);
        setIsStealing(true);
        startSteal(stealTarget, locationId);
      } else {
        // No steal question available, go back to map
        onNavigate('map');
      }
    }
  }, [raceOpponent, stealTarget, isStealChallenge, locationId, startRace, startSteal, onNavigate]);

  // Play thinking music during trivia phase
  useEffect(() => {
    if (phase === 'trivia_loop') {
      playMusic('thinking');
    }
  }, [phase, playMusic]);

  // Auto-advance from entering (only if not racing or stealing)
  useEffect(() => {
    if (phase === 'entering' && !isRacing && !isStealing) {
      const timer = setTimeout(() => setPhase('intro_dialogue'), 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, isRacing, isStealing]);

  // Trigger random interruptions during trivia
  useEffect(() => {
    if (phase === 'trivia_loop' && !isRacing && !isStealing) {
      // 15% chance of interruption per question
      if (Math.random() < 0.15) {
        triggerRandomInterruption();
      }
    }
  }, [phase, questionIndex, isRacing, isStealing, triggerRandomInterruption]);

  const handleDialogueAdvance = useCallback(() => {
    const currentDialogue = phase === 'intro_dialogue'
      ? introDialogue
      : phase === 'success_dialogue'
        ? successDialogue
        : failureDialogue;

    if (dialogueIndex < currentDialogue.length - 1) {
      setDialogueIndex(prev => prev + 1);
    } else {
      // Transition to next phase
      if (phase === 'intro_dialogue') {
        setPhase('trivia_loop');
        setDialogueIndex(0);
      } else if (phase === 'success_dialogue') {
        setPhase('key_ceremony');
      } else if (phase === 'failure_dialogue') {
        // Go to redemption
        onNavigate('redemption', { locationId });
      }
    }
  }, [phase, dialogueIndex, introDialogue.length, successDialogue.length, failureDialogue.length, locationId, onNavigate]);

  const handleAnswer = useCallback((correct: boolean) => {
    if (!trivia) return;

    const question = trivia.questions[questionIndex];
    answerQuestion(question.id, correct);

    // Play SFX
    playSFX(correct ? 'correct' : 'wrong');

    // Update score
    if (correct) {
      addScore(SCORING.CORRECT_ANSWER);
    } else {
      addScore(SCORING.WRONG_ANSWER);
    }

    // Show reaction
    setLastReaction(correct ? question.npcReactionCorrect : question.npcReactionWrong);
    setShowReaction(true);

    const newCorrectCount = correct ? correctCount + 1 : correctCount;
    if (correct) {
      setCorrectCount(newCorrectCount);
    }

    // After reaction, move to next question or end
    setTimeout(() => {
      setShowReaction(false);

      if (questionIndex < trivia.questions.length - 1) {
        setQuestionIndex(prev => prev + 1);
      } else {
        // End of trivia
        if (newCorrectCount >= GAME_CONSTANTS.PASSING_THRESHOLD) {
          setPhase('success_dialogue');
          setDialogueIndex(0);
        } else {
          failLocation(locationId);
          setPhase('failure_dialogue');
          setDialogueIndex(0);
        }
      }
    }, 2000);
  }, [trivia, questionIndex, answerQuestion, addScore, correctCount, locationId, failLocation, playSFX]);

  // Reset location lifelines when entering a new location
  useEffect(() => {
    resetLocationLifelines();
  }, [locationId, resetLocationLifelines]);

  const handleKeyCeremony = useCallback(() => {
    playSFX('key_get');
    completeLocation(locationId, true);
    onNavigate('map');
  }, [completeLocation, locationId, onNavigate, playSFX]);

  const getCurrentDialogue = useCallback((): DialogueLine | null => {
    if (phase === 'intro_dialogue') return introDialogue[dialogueIndex];
    if (phase === 'success_dialogue') return successDialogue[dialogueIndex];
    if (phase === 'failure_dialogue') return failureDialogue[dialogueIndex];
    return null;
  }, [phase, dialogueIndex, introDialogue, successDialogue, failureDialogue]);

  const getCurrentSpeaker = useCallback((): Character | null => {
    const line = getCurrentDialogue();
    if (!line) return null;
    if (line.speaker === 'npc') return npc;
    if (line.speaker === 'player') {
      // Return player character or a fallback if not loaded
      return playerCharacter || {
        id: 'player',
        name: 'You',
        portrait: '',
        voiceProfile: { pitch: 1, rate: 1 }
      } as Character;
    }
    return null;
  }, [getCurrentDialogue, npc, playerCharacter]);

  // Handle race completion
  const handleRaceComplete = useCallback((playerWon: boolean, _playerCorrect: boolean) => {
    setIsRacing(false);

    if (playerWon) {
      // Player won the race, continue with normal location flow
      playSFX('correct');
      setPhase('intro_dialogue');
    } else {
      // Player lost the race, return to map
      playSFX('wrong');
      setTimeout(() => {
        onNavigate('map');
      }, 500);
    }
  }, [playSFX, onNavigate]);

  // Handle steal completion
  const handleStealComplete = useCallback((success: boolean) => {
    setIsStealing(false);
    setStealQuestion(null);

    if (success) {
      playSFX('key_get');
    } else {
      playSFX('wrong');
    }

    // Always return to map after steal attempt
    setTimeout(() => {
      onNavigate('map');
    }, 500);
  }, [playSFX, onNavigate]);

  // Show race screen if racing
  if (isRacing && raceOpponent && currentQuestion) {
    return (
      <RaceSplitScreen
        question={currentQuestion}
        opponentId={raceOpponent}
        onComplete={handleRaceComplete}
        timeLimit={30}
      />
    );
  }

  // Show steal screen if stealing
  if (isStealing && stealTarget && stealQuestion) {
    return (
      <StealChallengeScreen
        question={stealQuestion}
        targetId={stealTarget}
        onComplete={handleStealComplete}
        timeLimit={45}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-boston-navy/80">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('map')}
            className="text-boston-cream/50 hover:text-boston-cream"
          >
            &larr; Exit
          </button>
          <div>
            <h1 className="font-display text-xl text-boston-gold">{location.name}</h1>
            <p className="text-boston-cream/70 text-sm">Speaking with {npc.name}</p>
          </div>
        </div>
        <ScoreDisplay score={state.score} keysCollected={state.keysCollected.length} compact />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-end p-4">
        {/* NPC Portrait (centered when not in dialogue) */}
        {phase === 'entering' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex items-center justify-center"
          >
            <Portrait src={npc.portrait} name={npc.name} size="lg" />
          </motion.div>
        )}

        {/* Trivia Phase */}
        {phase === 'trivia_loop' && trivia && currentQuestion && !showReaction && (
          <div className="flex-1 flex items-center justify-center">
            <TriviaCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              className="w-full max-w-2xl"
              npcName={npc.name}
              npcPortrait={npc.portrait}
              npcId={npc.id}
              npcHint={npcHint}
              sullyHint={sullyHint}
              alternateQuestion={alternateQuestion}
              onSkipReplace={handleSkipReplace}
            />
          </div>
        )}

        {/* Reaction */}
        {showReaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="bg-boston-navy/90 backdrop-blur border border-boston-cream/20 rounded-lg p-6 max-w-2xl">
              <div className="flex gap-4 items-start">
                <Portrait src={npc.portrait} name={npc.name} size="md" speaking />
                <div>
                  <p className="text-boston-gold font-display text-sm mb-1">{npc.name}</p>
                  <p className="text-boston-cream font-body text-lg">{lastReaction}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Key Ceremony */}
        {phase === 'key_ceremony' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <div className="text-8xl mb-4">🔑</div>
            <h2 className="font-display text-3xl text-boston-gold mb-2">Key Acquired!</h2>
            <p className="text-boston-cream/70 mb-6">{location.name} complete</p>
            <Button onClick={handleKeyCeremony}>Return to Map</Button>
          </motion.div>
        )}

        {/* Dialogue Box */}
        <AnimatePresence>
          {(phase === 'intro_dialogue' || phase === 'success_dialogue' || phase === 'failure_dialogue') && (
            <DialogueBox
              text={getCurrentDialogue()?.text || ''}
              speakerName={getCurrentSpeaker()?.name || 'Unknown'}
              speakerPortrait={getCurrentSpeaker()?.portrait}
              onComplete={handleDialogueAdvance}
            />
          )}
        </AnimatePresence>

        {/* Progress Indicator */}
        {phase === 'trivia_loop' && (
          <div className="text-center mt-4 text-boston-cream/50">
            Question {questionIndex + 1} of {trivia?.questions.length} |
            {correctCount} correct (need {GAME_CONSTANTS.PASSING_THRESHOLD})
          </div>
        )}
      </div>

    </div>
  );
}
