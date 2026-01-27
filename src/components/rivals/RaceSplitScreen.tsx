import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRival, useGame } from '../../contexts';
import { Timer } from '../ui/Timer';
import type { TriviaQuestion } from '../../types';

interface RaceSplitScreenProps {
  question: TriviaQuestion;
  opponentId: 'brendan' | 'maeve';
  onComplete: (playerWon: boolean, playerCorrect: boolean) => void;
  timeLimit?: number;
}

export function RaceSplitScreen({
  question,
  opponentId,
  onComplete,
  timeLimit = 30,
}: RaceSplitScreenProps) {
  const { state: rivalState, updateRace, endRace } = useRival();
  const { state: gameState } = useGame();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [playerAnswerTime, setPlayerAnswerTime] = useState<number | null>(null);
  const [opponentAnswerTime, setOpponentAnswerTime] = useState<number | null>(null);
  const [opponentSelectedIndex, setOpponentSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [raceResult, setRaceResult] = useState<'win' | 'loss' | 'tie' | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const opponentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const opponent = rivalState.rivals[opponentId];

  // Simulate opponent answering
  useEffect(() => {
    // Opponent answers between 5-20 seconds with some variance
    const baseTime = 5000 + Math.random() * 15000;
    // Maeve is slightly faster (smarter)
    const adjustedTime = opponentId === 'maeve' ? baseTime * 0.85 : baseTime;

    opponentTimerRef.current = setTimeout(() => {
      const answerTime = Date.now() - startTimeRef.current;
      setOpponentAnswerTime(answerTime);

      // Opponent accuracy: Brendan 70%, Maeve 85%
      const accuracy = opponentId === 'brendan' ? 0.7 : 0.85;
      const isCorrect = Math.random() < accuracy;

      const opponentAnswer = isCorrect
        ? question.correctIndex
        : question.choices.findIndex((_, i) => i !== question.correctIndex);

      setOpponentSelectedIndex(opponentAnswer);

      updateRace({
        opponentAnswerTime: answerTime,
        opponentAnswer,
        opponentCorrect: isCorrect,
      });
    }, adjustedTime);

    return () => {
      if (opponentTimerRef.current) {
        clearTimeout(opponentTimerRef.current);
      }
    };
  }, [opponentId, question, updateRace]);

  const handleSelect = useCallback((index: number) => {
    if (selectedIndex !== null) return;

    const answerTime = Date.now() - startTimeRef.current;
    setSelectedIndex(index);
    setPlayerAnswerTime(answerTime);

    updateRace({
      playerAnswerTime: answerTime,
    });
  }, [selectedIndex, updateRace]);

  // Determine winner when both have answered
  useEffect(() => {
    if (playerAnswerTime === null || opponentAnswerTime === null) return;
    if (showResult) return;

    const playerCorrect = selectedIndex === question.correctIndex;
    const opponentCorrect = opponentSelectedIndex === question.correctIndex;

    let result: 'win' | 'loss' | 'tie';

    if (playerCorrect && !opponentCorrect) {
      result = 'win';
    } else if (!playerCorrect && opponentCorrect) {
      result = 'loss';
    } else if (playerCorrect && opponentCorrect) {
      // Both correct - faster wins
      result = playerAnswerTime < opponentAnswerTime ? 'win' : 'loss';
    } else {
      // Both wrong - tie (no points either way for speed)
      result = 'tie';
    }

    setRaceResult(result);
    setShowResult(true);

    // Delay before completing
    setTimeout(() => {
      endRace(result);
      onComplete(result === 'win', playerCorrect);
    }, 2500);
  }, [
    playerAnswerTime,
    opponentAnswerTime,
    selectedIndex,
    opponentSelectedIndex,
    question.correctIndex,
    showResult,
    endRace,
    onComplete,
  ]);

  const handleTimeout = useCallback(() => {
    if (selectedIndex === null) {
      // Player ran out of time
      setSelectedIndex(-1); // Mark as timed out
      setPlayerAnswerTime(timeLimit * 1000);
      updateRace({ playerAnswerTime: timeLimit * 1000 });
    }
  }, [selectedIndex, timeLimit, updateRace]);

  const getChoiceStyle = (index: number, isOpponent: boolean) => {
    const selected = isOpponent ? opponentSelectedIndex : selectedIndex;
    const revealed = showResult;

    if (!revealed && selected === null) {
      return isOpponent ? 'bg-gray-700/50' : 'hover:bg-boston-cream/10';
    }

    if (selected === index) {
      if (revealed) {
        const isCorrect = index === question.correctIndex;
        return isCorrect
          ? 'bg-green-600/50 border-green-400'
          : 'bg-red-600/50 border-red-400';
      }
      return isOpponent ? 'bg-purple-600/50 border-purple-400' : 'bg-boston-gold/30 border-boston-gold';
    }

    if (revealed && index === question.correctIndex) {
      return 'bg-green-600/30 border-green-400/50';
    }

    return 'opacity-50';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex"
    >
      {/* Race header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-boston-gold border-2 border-boston-gold overflow-hidden">
              <img
                src={`/assets/images/portraits/${gameState.selectedCharacter}.png`}
                alt="You"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <span className="text-boston-gold font-display">YOU</span>
          </div>

          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="text-2xl font-display text-red-500"
            >
              RACE!
            </motion.div>
            {!showResult && (
              <Timer
                duration={timeLimit}
                onExpire={handleTimeout}
                warningThreshold={10}
                compact
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className={`font-display ${opponentId === 'brendan' ? 'text-blue-400' : 'text-purple-400'}`}>
              {opponent.name.toUpperCase()}
            </span>
            <div className={`w-10 h-10 rounded-full border-2 overflow-hidden ${
              opponentId === 'brendan' ? 'bg-blue-600 border-blue-400' : 'bg-purple-600 border-purple-400'
            }`}>
              <img
                src={opponent.portrait}
                alt={opponent.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Split screen content */}
      <div className="flex w-full pt-24 pb-8">
        {/* Player side */}
        <div className="flex-1 p-4 border-r border-white/20">
          <div className="h-full flex flex-col">
            {/* Question */}
            <div className="mb-4 text-center">
              <h3 className="text-lg font-display text-boston-cream">
                {question.prompt}
              </h3>
            </div>

            {/* Player choices */}
            <div className="flex-1 grid grid-cols-1 gap-2 content-center">
              {question.choices.map((choice, index) => (
                <motion.button
                  key={index}
                  whileHover={selectedIndex === null ? { scale: 1.02 } : {}}
                  whileTap={selectedIndex === null ? { scale: 0.98 } : {}}
                  onClick={() => handleSelect(index)}
                  disabled={selectedIndex !== null}
                  className={`
                    p-3 rounded border border-boston-cream/30
                    text-left text-sm font-body text-boston-cream
                    transition-all duration-200
                    ${getChoiceStyle(index, false)}
                  `}
                >
                  <span className="text-boston-gold mr-2">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {choice}
                </motion.button>
              ))}
            </div>

            {/* Player status */}
            <div className="text-center mt-4">
              {selectedIndex !== null && !showResult ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-boston-gold"
                >
                  Answered in {((playerAnswerTime || 0) / 1000).toFixed(1)}s
                  <br />
                  <span className="text-sm text-boston-cream/70">Waiting for {opponent.name}...</span>
                </motion.div>
              ) : selectedIndex === null ? (
                <span className="text-boston-cream/70">Choose your answer!</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Opponent side */}
        <div className="flex-1 p-4">
          <div className="h-full flex flex-col">
            {/* Opponent avatar */}
            <div className="mb-4 text-center">
              <div className={`w-16 h-16 mx-auto rounded-full border-2 overflow-hidden ${
                opponentId === 'brendan' ? 'bg-blue-600 border-blue-400' : 'bg-purple-600 border-purple-400'
              }`}>
                <img
                  src={opponent.portrait}
                  alt={opponent.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <p className={`mt-2 font-display ${
                opponentId === 'brendan' ? 'text-blue-400' : 'text-purple-400'
              }`}>
                {opponent.name}
              </p>
            </div>

            {/* Opponent choices (hidden until they answer) */}
            <div className="flex-1 grid grid-cols-1 gap-2 content-center">
              {question.choices.map((choice, index) => (
                <div
                  key={index}
                  className={`
                    p-3 rounded border border-gray-600/30
                    text-left text-sm font-body text-gray-400
                    transition-all duration-200
                    ${opponentSelectedIndex !== null ? getChoiceStyle(index, true) : 'bg-gray-800/30'}
                  `}
                >
                  <span className="text-gray-500 mr-2">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {opponentSelectedIndex !== null ? choice : '???'}
                </div>
              ))}
            </div>

            {/* Opponent status */}
            <div className="text-center mt-4">
              {opponentAnswerTime !== null ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={opponentId === 'brendan' ? 'text-blue-400' : 'text-purple-400'}
                >
                  Answered in {(opponentAnswerTime / 1000).toFixed(1)}s
                </motion.div>
              ) : (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-gray-500"
                >
                  Thinking...
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Result overlay */}
      <AnimatePresence>
        {showResult && raceResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-black/70"
          >
            <div className="text-center">
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className={`text-6xl font-display mb-4 ${
                  raceResult === 'win'
                    ? 'text-green-400'
                    : raceResult === 'loss'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                }`}
              >
                {raceResult === 'win' ? 'YOU WIN!' : raceResult === 'loss' ? 'YOU LOSE!' : 'TIE!'}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-boston-cream"
              >
                {raceResult === 'win' && '+100 points!'}
                {raceResult === 'loss' && '-25 points'}
                {raceResult === 'tie' && 'No points change'}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
