import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRival } from '../../contexts';
import { Timer } from '../ui/Timer';
import { Button } from '../ui/Button';
import type { StealQuestion } from '../../types';

interface StealChallengeScreenProps {
  question: StealQuestion;
  targetId: 'brendan' | 'maeve';
  onComplete: (success: boolean) => void;
  timeLimit?: number;
}

export function StealChallengeScreen({
  question,
  targetId,
  onComplete,
  timeLimit = 45,
}: StealChallengeScreenProps) {
  const { state, updateSteal, endSteal } = useRival();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const target = state.rivals[targetId];

  const handleSelect = useCallback((index: number) => {
    if (revealed) return;

    setSelectedIndex(index);
    setRevealed(true);

    const isCorrect = index === question.correctIndex;

    updateSteal({
      questionIndex: index,
      result: isCorrect ? 'success' : 'failure',
    });

    // Show result
    setTimeout(() => {
      setShowResult(true);

      // Complete after showing result
      setTimeout(() => {
        endSteal(isCorrect ? 'success' : 'failure');
        onComplete(isCorrect);
      }, 2500);
    }, 1000);
  }, [revealed, question.correctIndex, updateSteal, endSteal, onComplete]);

  const handleTimeout = useCallback(() => {
    if (!revealed) {
      setRevealed(true);
      setShowResult(true);

      setTimeout(() => {
        endSteal('failure');
        onComplete(false);
      }, 2000);
    }
  }, [revealed, endSteal, onComplete]);

  const getChoiceStyle = (index: number) => {
    if (!revealed) {
      return 'hover:bg-boston-cream/10 hover:border-boston-gold';
    }
    if (index === question.correctIndex) {
      return 'bg-green-600/50 border-green-400';
    }
    if (index === selectedIndex) {
      return 'bg-red-600/50 border-red-400';
    }
    return 'opacity-50';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-red-950/95 to-black/95 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-4 mb-2">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-4xl"
            >
              🔓
            </motion.div>
            <h1 className="text-3xl font-display text-red-400">
              STEAL CHALLENGE
            </h1>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
              className="text-4xl"
            >
              🔓
            </motion.div>
          </div>

          <p className="text-boston-cream/70 text-sm">
            Answer correctly to steal a key from{' '}
            <span className={targetId === 'brendan' ? 'text-blue-400' : 'text-purple-400'}>
              {target.name}
            </span>
          </p>

          {/* Stakes display */}
          <div className="flex items-center justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-xs text-boston-cream/50 mb-1">If you win</p>
              <p className="text-green-400 font-display">+150 points</p>
              <p className="text-green-400/70 text-xs">+1 key stolen</p>
            </div>
            <div className="w-px h-10 bg-boston-cream/20" />
            <div className="text-center">
              <p className="text-xs text-boston-cream/50 mb-1">If you fail</p>
              <p className="text-red-400 font-display">-150 points</p>
              <p className="text-red-400/70 text-xs">Opportunity lost</p>
            </div>
          </div>
        </motion.div>

        {/* Timer */}
        {!revealed && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6"
          >
            <Timer
              duration={timeLimit}
              onExpire={handleTimeout}
              warningThreshold={15}
              variant="danger"
            />
          </motion.div>
        )}

        {/* Question card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-boston-navy/80 backdrop-blur border-2 border-red-500/50 rounded-lg p-6 mb-6"
        >
          {/* Difficulty badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded uppercase">
              Expert
            </span>
            <span className="text-boston-cream/50 text-xs">
              {question.locationId.replace('_', ' ')} category
            </span>
          </div>

          {/* Question */}
          <h2 className="text-xl font-display text-boston-cream mb-6">
            {question.prompt}
          </h2>

          {/* Choices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.choices.map((choice, index) => (
              <motion.button
                key={index}
                initial={{ x: index % 2 === 0 ? -20 : 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={!revealed ? { scale: 1.02 } : {}}
                whileTap={!revealed ? { scale: 0.98 } : {}}
                onClick={() => handleSelect(index)}
                disabled={revealed}
                className={`
                  p-4 rounded border-2 border-boston-cream/30
                  text-left font-body text-boston-cream
                  transition-all duration-200
                  ${getChoiceStyle(index)}
                `}
              >
                <span className="text-boston-gold mr-2 font-bold">
                  {String.fromCharCode(65 + index)}.
                </span>
                {choice}

                {/* Correct/incorrect indicator */}
                {revealed && index === question.correctIndex && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-2 text-green-400"
                  >
                    ✓
                  </motion.span>
                )}
                {revealed && index === selectedIndex && index !== question.correctIndex && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-2 text-red-400"
                  >
                    ✕
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Target info */}
        <div className="flex items-center justify-center gap-4">
          <div className={`w-12 h-12 rounded-full border-2 overflow-hidden ${
            targetId === 'brendan' ? 'bg-blue-600 border-blue-400' : 'bg-purple-600 border-purple-400'
          }`}>
            <img
              src={target.portrait}
              alt={target.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div>
            <p className={`font-display ${
              targetId === 'brendan' ? 'text-blue-400' : 'text-purple-400'
            }`}>
              {target.name}'s Key at Stake
            </p>
            <p className="text-boston-cream/50 text-xs">
              They have {target.keysCollected} keys total
            </p>
          </div>
        </div>
      </div>

      {/* Result overlay */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80"
          >
            <motion.div
              initial={{ scale: 0.5, rotateZ: -10 }}
              animate={{ scale: 1, rotateZ: 0 }}
              className="text-center"
            >
              {selectedIndex === question.correctIndex ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: 3, duration: 0.3 }}
                    className="text-8xl mb-4"
                  >
                    🔑
                  </motion.div>
                  <h2 className="text-5xl font-display text-green-400 mb-4">
                    KEY STOLEN!
                  </h2>
                  <p className="text-2xl text-green-300">+150 points</p>
                  <p className="text-boston-cream/70 mt-2">
                    You took a key from {target.name}!
                  </p>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ rotateZ: [0, 10, -10, 0] }}
                    transition={{ repeat: 2, duration: 0.3 }}
                    className="text-8xl mb-4"
                  >
                    💔
                  </motion.div>
                  <h2 className="text-5xl font-display text-red-400 mb-4">
                    STEAL FAILED!
                  </h2>
                  <p className="text-2xl text-red-300">-150 points</p>
                  <p className="text-boston-cream/70 mt-2">
                    {selectedIndex === null
                      ? 'You ran out of time!'
                      : `${target.name} keeps their key!`
                    }
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Modal to select which steal opportunity to pursue
interface StealSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (targetId: 'brendan' | 'maeve', locationId: string) => void;
}

export function StealSelectionModal({
  isOpen,
  onClose,
  onSelect,
}: StealSelectionModalProps) {
  const { getAvailableSteals, state } = useRival();
  const steals = getAvailableSteals();

  if (!isOpen || steals.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-boston-navy border-2 border-red-500/50 rounded-lg p-6"
        >
          <h2 className="text-2xl font-display text-red-400 text-center mb-2">
            Steal Opportunities
          </h2>
          <p className="text-boston-cream/70 text-sm text-center mb-6">
            Your rivals failed these locations. Steal their progress!
          </p>

          <div className="space-y-3">
            {steals.map((steal) => {
              const rival = state.rivals[steal.rivalId];
              const minutes = Math.floor(steal.timeRemaining / 60);
              const seconds = steal.timeRemaining % 60;

              return (
                <motion.button
                  key={`${steal.rivalId}-${steal.locationId}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(steal.rivalId, steal.locationId)}
                  className={`
                    w-full p-4 rounded-lg border-2 text-left
                    transition-all duration-200
                    ${steal.rivalId === 'brendan'
                      ? 'border-blue-500/50 hover:border-blue-400 hover:bg-blue-900/20'
                      : 'border-purple-500/50 hover:border-purple-400 hover:bg-purple-900/20'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full border-2 overflow-hidden ${
                      steal.rivalId === 'brendan' ? 'bg-blue-600 border-blue-400' : 'bg-purple-600 border-purple-400'
                    }`}>
                      <img
                        src={rival.portrait}
                        alt={rival.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className={`font-display ${
                        steal.rivalId === 'brendan' ? 'text-blue-400' : 'text-purple-400'
                      }`}>
                        {rival.name}
                      </p>
                      <p className="text-boston-cream text-sm">
                        Failed at {steal.locationId.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 text-sm font-mono">
                        {minutes}:{seconds.toString().padStart(2, '0')}
                      </p>
                      <p className="text-boston-cream/50 text-xs">remaining</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full mt-4"
          >
            Cancel
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
