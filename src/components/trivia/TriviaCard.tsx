import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from '../ui/Timer';
import { LifelinePanel } from '../ui/LifelinePanel';
import { AskTheBarModal } from '../ui/AskTheBarModal';
import { PhoneLocalModal } from '../ui/PhoneLocalModal';
import { useLifeline, useGame } from '../../contexts';
import type { TriviaQuestion, LifelineHint, SullyHint, VoiceProfile } from '../../types';

interface TriviaCardProps {
  question: TriviaQuestion;
  onAnswer: (correct: boolean) => void;
  timeLimit?: number;
  className?: string;
  inGauntlet?: boolean;
  inRedemption?: boolean;
  // NPC info for Ask the Bar
  npcName?: string;
  npcPortrait?: string;
  npcVoiceProfile?: VoiceProfile;
  // Hint data
  npcHint?: LifelineHint;
  sullyHint?: SullyHint;
  // Alternate question for Skip & Replace
  alternateQuestion?: TriviaQuestion;
  onSkipReplace?: () => void;
}

export function TriviaCard({
  question,
  onAnswer,
  timeLimit = 45,
  className = '',
  inGauntlet = false,
  inRedemption = false,
  npcName = 'NPC',
  npcPortrait,
  npcVoiceProfile,
  npcHint,
  sullyHint,
  alternateQuestion,
  onSkipReplace,
}: TriviaCardProps) {
  const [currentQuestion, setCurrentQuestion] = useState(question);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [eliminatedChoices, setEliminatedChoices] = useState<number[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showAskBarModal, setShowAskBarModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [fitzBonusTriggered, setFitzBonusTriggered] = useState(false);
  const timerRef = useRef<{ pause: () => void; resume: () => void } | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    useFiftyFifty,
    useAskTheBar,
    usePhoneLocal,
    useSkipReplace,
    canUseFiftyFifty,
    canUseAskTheBar,
    canUsePhoneLocal,
    canUseSkipReplace,
  } = useLifeline();

  const { state: gameState } = useGame();
  const isFitz = gameState.selectedCharacter === 'fitz';

  // Reset state when question changes
  useEffect(() => {
    setCurrentQuestion(question);
    setSelectedIndex(null);
    setRevealed(false);
    setEliminatedChoices([]);
    setIsPaused(false);
    setShowAskBarModal(false);
    setShowPhoneModal(false);
    setFitzBonusTriggered(false);
  }, [question.id]);

  const handleSelect = useCallback((index: number) => {
    if (revealed || eliminatedChoices.includes(index)) return;

    setSelectedIndex(index);
    setRevealed(true);

    const isCorrect = index === currentQuestion.correctIndex;

    // Delay to show result before callback
    setTimeout(() => {
      onAnswer(isCorrect);
    }, 1500);
  }, [revealed, eliminatedChoices, currentQuestion.correctIndex, onAnswer]);

  const pauseTimerBriefly = useCallback((duration: number = 5000) => {
    setIsPaused(true);
    timerRef.current?.pause();

    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }

    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
      timerRef.current?.resume();
    }, duration);
  }, []);

  const handleLifelineSelect = useCallback((lifeline: 'fifty_fifty' | 'ask_the_bar' | 'phone_a_local' | 'skip_and_replace') => {
    if (revealed) return;

    switch (lifeline) {
      case 'fifty_fifty': {
        if (!canUseFiftyFifty(inGauntlet, inRedemption)) return;
        if (!useFiftyFifty()) return;

        // Eliminate 2 wrong answers, leaving correct + 1 wrong
        const wrongIndices = currentQuestion.choices
          .map((_, i) => i)
          .filter(i => i !== currentQuestion.correctIndex && !eliminatedChoices.includes(i));

        if (wrongIndices.length >= 2) {
          // Shuffle and pick 2 to eliminate
          const shuffled = [...wrongIndices].sort(() => Math.random() - 0.5);
          setEliminatedChoices([...eliminatedChoices, shuffled[0], shuffled[1]]);
        } else if (wrongIndices.length === 1) {
          setEliminatedChoices([...eliminatedChoices, wrongIndices[0]]);
        }

        pauseTimerBriefly(2000);
        break;
      }

      case 'ask_the_bar': {
        if (!canUseAskTheBar(inGauntlet, inRedemption)) return;
        if (!npcHint) return;
        if (!useAskTheBar()) return;

        pauseTimerBriefly(15000); // Longer pause for reading hint
        setShowAskBarModal(true);
        break;
      }

      case 'phone_a_local': {
        if (!canUsePhoneLocal(inGauntlet, inRedemption)) return;
        if (!sullyHint) return;

        // Check for Fitz bonus (30% chance)
        const bonusTriggered = isFitz && Math.random() < 0.3;
        setFitzBonusTriggered(bonusTriggered);

        if (!usePhoneLocal()) return;

        pauseTimerBriefly(20000); // Longer pause for voice memo
        setShowPhoneModal(true);
        break;
      }

      case 'skip_and_replace': {
        if (!canUseSkipReplace(inGauntlet, inRedemption)) return;
        if (!alternateQuestion) return;
        if (!useSkipReplace()) return;

        // Replace the current question
        setCurrentQuestion(alternateQuestion);
        setSelectedIndex(null);
        setEliminatedChoices([]);
        onSkipReplace?.();
        break;
      }
    }
  }, [
    revealed,
    inGauntlet,
    inRedemption,
    currentQuestion,
    eliminatedChoices,
    npcHint,
    sullyHint,
    alternateQuestion,
    canUseFiftyFifty,
    canUseAskTheBar,
    canUsePhoneLocal,
    canUseSkipReplace,
    useFiftyFifty,
    useAskTheBar,
    usePhoneLocal,
    useSkipReplace,
    pauseTimerBriefly,
    onSkipReplace,
    isFitz,
  ]);

  const handleTimeout = useCallback(() => {
    if (!revealed) {
      setRevealed(true);
      onAnswer(false);
    }
  }, [revealed, onAnswer]);

  const handleAskBarClose = useCallback(() => {
    setShowAskBarModal(false);
    // Resume timer after modal closes
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    setIsPaused(false);
    timerRef.current?.resume();
  }, []);

  const handlePhoneClose = useCallback(() => {
    setShowPhoneModal(false);
    // Resume timer after modal closes
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    setIsPaused(false);
    timerRef.current?.resume();
  }, []);

  const getChoiceStyle = (index: number) => {
    if (eliminatedChoices.includes(index)) {
      return 'opacity-30 line-through cursor-not-allowed bg-boston-navy/50';
    }
    if (!revealed) {
      return 'hover:bg-boston-cream/10';
    }
    if (index === currentQuestion.correctIndex) {
      return 'bg-green-600/50 border-green-400';
    }
    if (index === selectedIndex) {
      return 'bg-red-600/50 border-red-400';
    }
    return 'opacity-50';
  };

  // Default hints if none provided
  const defaultNpcHint: LifelineHint = npcHint || {
    questionId: currentQuestion.id,
    text: "Hmm, let me think... I'm not sure I can help with this one.",
  };

  const defaultSullyHint: SullyHint = sullyHint || {
    theme: 'general',
    questionId: currentQuestion.id,
    text: "Kid, you're on your own with this one. Think it through.",
    audioFile: '',
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          bg-boston-navy/80 backdrop-blur
          border border-boston-cream/20
          rounded-lg p-6
          ${className}
        `}
      >
        {/* Timer */}
        {!revealed && (
          <div className="mb-4">
            <Timer
              duration={timeLimit}
              onExpire={handleTimeout}
              warningThreshold={10}
              isPaused={isPaused}
            />
          </div>
        )}

        {/* Question */}
        <h3 className="text-xl font-display text-boston-cream mb-6">
          {currentQuestion.prompt}
        </h3>

        {/* Choices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {currentQuestion.choices.map((choice, index) => (
            <motion.button
              key={index}
              whileHover={!revealed && !eliminatedChoices.includes(index) ? { scale: 1.02 } : {}}
              whileTap={!revealed && !eliminatedChoices.includes(index) ? { scale: 0.98 } : {}}
              onClick={() => handleSelect(index)}
              disabled={revealed || eliminatedChoices.includes(index)}
              className={`
                p-4 rounded border border-boston-cream/30
                text-left font-body text-boston-cream
                transition-all duration-200
                ${getChoiceStyle(index)}
              `}
            >
              <span className="text-boston-gold mr-2">
                {String.fromCharCode(65 + index)}.
              </span>
              {choice}

              {/* Eliminated X animation */}
              <AnimatePresence>
                {eliminatedChoices.includes(index) && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-2 text-red-400 font-bold"
                  >
                    ✕
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {/* Lifeline Panel */}
        {!revealed && (
          <LifelinePanel
            inGauntlet={inGauntlet}
            inRedemption={inRedemption}
            onLifelineSelect={handleLifelineSelect}
            isPaused={isPaused}
          />
        )}

        {/* Result feedback */}
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            {selectedIndex === currentQuestion.correctIndex ? (
              <p className="text-green-400 font-display text-lg">
                {currentQuestion.npcReactionCorrect}
              </p>
            ) : (
              <p className="text-red-400 font-display text-lg">
                {currentQuestion.npcReactionWrong}
              </p>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Ask the Bar Modal */}
      <AskTheBarModal
        isOpen={showAskBarModal}
        onClose={handleAskBarClose}
        npcName={npcName}
        npcPortrait={npcPortrait}
        voiceProfile={npcVoiceProfile}
        hint={defaultNpcHint}
        characterName={gameState.selectedCharacter || undefined}
      />

      {/* Phone a Local Modal */}
      <PhoneLocalModal
        isOpen={showPhoneModal}
        onClose={handlePhoneClose}
        hint={defaultSullyHint}
        showBonusMessage={fitzBonusTriggered}
      />
    </>
  );
}
