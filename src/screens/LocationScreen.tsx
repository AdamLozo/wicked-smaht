import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DialogueBox, TriviaCard, TriviaInterlude, Button, Portrait, ScoreDisplay, Polaroid } from '../components';
import { RaceSplitScreen, StealChallengeScreen, BrendanTextOverlay, MaeveMemoPlayer } from '../components/rivals';
import { useGame, useLifeline, useRival, useAudio } from '../contexts';
import { useSFX } from '../hooks';
import { locations, npcs, getTrivia, playerCharacters, SCORING, GAME_CONSTANTS, getNpcHintForQuestion, getSullyHintForQuestion, getStealQuestionForLocation, getRandomIntroDialogue, getRandomSuccessDialogue, getRandomFailureDialogue, getUncollectedPolaroidByType, getRandomUncollectedPolaroid, getInterludeForQuestion } from '../data';
import type { ScreenId, LocationPhase, DialogueLine, Character, TriviaQuestion, StealQuestion, InterludeContent } from '../types';

interface LocationScreenProps {
  onNavigate: (screen: ScreenId, data?: Record<string, unknown>) => void;
  data: Record<string, unknown>;
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
    failLocation,
    collectPolaroid,
    timerDuration
  } = useGame();

  const { resetLocationLifelines } = useLifeline();
  const { state: rivalState, startRace, startSteal, triggerRandomInterruption, dismissInterruption } = useRival();

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

  // Polaroid collection state
  const [showPolaroidNotification, setShowPolaroidNotification] = useState(false);
  const [collectedPolaroidTitle, setCollectedPolaroidTitle] = useState('');
  const [collectedPolaroidImage, setCollectedPolaroidImage] = useState('');
  const [collectedPolaroidCaption, setCollectedPolaroidCaption] = useState('');
  const [showPolaroidModal, setShowPolaroidModal] = useState(false);

  // Interlude state (shows between questions)
  const [showInterlude, setShowInterlude] = useState(false);
  const [currentInterlude, setCurrentInterlude] = useState<InterludeContent | null>(null);
  const [pendingQuestionIndex, setPendingQuestionIndex] = useState<number | null>(null);

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

  // Generate randomized dialogue - memoized so it stays consistent during the visit
  const introDialogue = useMemo(() =>
    getRandomIntroDialogue(npc.id, playerCharacter?.id || 'danny'),
    [npc.id, playerCharacter?.id]
  );

  const successDialogue = useMemo(() =>
    getRandomSuccessDialogue(npc.id),
    [npc.id]
  );

  const failureDialogue = useMemo(() =>
    getRandomFailureDialogue(npc.id),
    [npc.id]
  );

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

    // After reaction, show interlude or move to next question/end
    setTimeout(() => {
      setShowReaction(false);

      if (questionIndex < trivia.questions.length - 1) {
        // Not the last question - show interlude before next question
        const nextIndex = questionIndex + 1;
        const interlude = getInterludeForQuestion(locationId, questionIndex);

        if (interlude) {
          setCurrentInterlude(interlude);
          setPendingQuestionIndex(nextIndex);
          setShowInterlude(true);
        } else {
          // No interlude available, advance directly
          setQuestionIndex(nextIndex);
        }
      } else {
        // End of trivia
        if (newCorrectCount >= GAME_CONSTANTS.PASSING_THRESHOLD) {
          // Award polaroid on success
          const polaroidToCollect = getRandomUncollectedPolaroid(locationId, state.collectedPolaroids);
          if (polaroidToCollect) {
            collectPolaroid(polaroidToCollect.id);
            addScore(SCORING.POLAROID_FOUND);
            setCollectedPolaroidTitle(polaroidToCollect.title || 'Memory');
            setCollectedPolaroidImage(polaroidToCollect.image);
            setCollectedPolaroidCaption(polaroidToCollect.caption);
            setShowPolaroidNotification(true);
            playSFX('polaroid');
          }

          // Perfect score bonus: award trivia_bonus polaroid if available
          if (newCorrectCount === trivia.questions.length) {
            const bonusPolaroid = getUncollectedPolaroidByType(locationId, 'trivia_bonus', state.collectedPolaroids);
            if (bonusPolaroid && bonusPolaroid.id !== polaroidToCollect?.id) {
              collectPolaroid(bonusPolaroid.id);
              addScore(SCORING.POLAROID_FOUND);
            }
          }

          setPhase('success_dialogue');
          setDialogueIndex(0);
        } else {
          failLocation(locationId);
          setPhase('failure_dialogue');
          setDialogueIndex(0);
        }
      }
    }, 1000);
  }, [trivia, questionIndex, answerQuestion, addScore, correctCount, locationId, failLocation, playSFX, state.collectedPolaroids, collectPolaroid]);

  // Reset location lifelines when entering a new location
  useEffect(() => {
    resetLocationLifelines();
  }, [locationId, resetLocationLifelines]);

  // Handle interlude completion - advance to next question
  const handleInterludeComplete = useCallback(() => {
    setShowInterlude(false);
    setCurrentInterlude(null);
    if (pendingQuestionIndex !== null) {
      setQuestionIndex(pendingQuestionIndex);
      setPendingQuestionIndex(null);
    }
  }, [pendingQuestionIndex]);

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
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${location.backgroundImage})` }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-boston-navy/70 via-boston-navy/50 to-boston-navy/90" />
      </div>

      {/* Header */}
      <div className="relative p-4 flex justify-between items-center bg-boston-navy/80">
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
      <div className="relative flex-1 flex flex-col justify-end p-4">
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
        {phase === 'trivia_loop' && trivia && currentQuestion && !showReaction && !showInterlude && (
          <div className="flex-1 flex items-center justify-center">
            <TriviaCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              timeLimit={timerDuration}
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

        {/* Interlude between questions */}
        {phase === 'trivia_loop' && showInterlude && currentInterlude && trivia && (
          <TriviaInterlude
            content={currentInterlude}
            locationName={location.name}
            duration={10000}
            onComplete={handleInterludeComplete}
            questionNumber={pendingQuestionIndex !== null ? pendingQuestionIndex + 1 : questionIndex + 1}
            totalQuestions={trivia.questions.length}
          />
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
              speakerId={getCurrentDialogue()?.speakerId}
              audioFile={getCurrentDialogue()?.audioFile}
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

      {/* Rival Interruption Overlays */}
      <BrendanTextOverlay
        isOpen={rivalState.interruption.active && rivalState.interruption.type === 'brendan_text'}
        onClose={dismissInterruption}
        message={rivalState.interruption.content || ''}
        helpContent={rivalState.interruption.helpContent}
      />
      <MaeveMemoPlayer
        isOpen={rivalState.interruption.active && rivalState.interruption.type === 'maeve_memo'}
        onClose={dismissInterruption}
        message={rivalState.interruption.content || ''}
        audioFile={rivalState.interruption.audioFile}
        helpContent={rivalState.interruption.helpContent}
      />

      {/* Polaroid Collection Notification */}
      <AnimatePresence>
        {showPolaroidNotification && !showPolaroidModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-boston-navy/95 backdrop-blur border-2 border-boston-gold rounded-lg p-4 shadow-lg shadow-boston-gold/20 cursor-pointer hover:border-boston-cream transition-colors"
            onClick={() => {
              setShowPolaroidModal(true);
            }}
          >
            <div className="flex items-center gap-3">
              <div className="text-4xl">📸</div>
              <div>
                <p className="text-boston-gold font-display text-sm">Memory Found!</p>
                <p className="text-boston-cream font-body">"{collectedPolaroidTitle}"</p>
                <p className="text-boston-cream/50 text-xs mt-1">+{SCORING.POLAROID_FOUND} points · Tap to view</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Polaroid Modal */}
      <AnimatePresence>
        {showPolaroidModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => {
              setShowPolaroidModal(false);
              setShowPolaroidNotification(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.8, rotate: 5 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-sm w-full"
            >
              <Polaroid
                image={collectedPolaroidImage}
                caption={collectedPolaroidCaption}
                collected={true}
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center text-boston-cream/50 text-sm mt-4"
              >
                Tap anywhere to close
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
