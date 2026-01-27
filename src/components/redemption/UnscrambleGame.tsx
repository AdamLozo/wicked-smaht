import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface GovernorWord {
  scrambled: string;
  answer: string;
  hint: string;
  years: string;
}

const GOVERNORS: GovernorWord[] = [
  { scrambled: 'TTMIO MRNOEY', answer: 'MITT ROMNEY', hint: 'Ran for president twice', years: '2003-2007' },
  { scrambled: 'VLEDA CIKPART', answer: 'DEVAL PATRICK', hint: 'First Black governor of Massachusetts', years: '2007-2015' },
  { scrambled: 'LIAHCME AUKSIKD', answer: 'MICHAEL DUKAKIS', hint: '1988 presidential nominee', years: '1975-1979, 1983-1991' },
  { scrambled: 'LAIHCECR KBERA', answer: 'CHARLIE BAKER', hint: 'Most recent Republican governor', years: '2015-2023' },
  { scrambled: 'WNILLAI LDEW', answer: 'WILLIAM WELD', hint: 'Later ran as Libertarian VP', years: '1991-1997' },
  { scrambled: 'NUAAMRE AYHLEE', answer: 'MAURA HEALEY', hint: 'First woman and openly LGBT governor', years: '2023-present' },
  { scrambled: 'NHOJ KVOLE', answer: 'JOHN VOLPE', hint: 'Later became Transportation Secretary', years: '1961-1963, 1965-1969' },
  { scrambled: 'AEDWDR IGNK', answer: 'EDWARD KING', hint: 'Democrat who beat Dukakis in 1978', years: '1979-1983' },
];

interface UnscrambleGameProps {
  onComplete: (passed: boolean, score: number) => void;
  requiredCorrect?: number;
  totalRounds?: number;
}

export function UnscrambleGame({
  onComplete,
  requiredCorrect = 4,
  totalRounds = 5,
}: UnscrambleGameProps) {
  const [currentRound, setCurrentRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [input, setInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [gameWords, setGameWords] = useState<GovernorWord[]>([]);
  const [timeLeft, setTimeLeft] = useState(45);

  // Select random words on mount
  useEffect(() => {
    const shuffled = [...GOVERNORS].sort(() => Math.random() - 0.5);
    setGameWords(shuffled.slice(0, totalRounds));
  }, [totalRounds]);

  // Timer
  useEffect(() => {
    if (showResult || gameWords.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit(true);
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResult, currentRound, gameWords.length]);

  const currentWord = gameWords[currentRound];

  const normalizeAnswer = (str: string) => {
    return str.toUpperCase().replace(/[^A-Z]/g, '');
  };

  const handleSubmit = useCallback((timeout = false) => {
    if (!currentWord || showResult) return;

    const isCorrect = !timeout && normalizeAnswer(input) === normalizeAnswer(currentWord.answer);
    setLastCorrect(isCorrect);
    setShowResult(true);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentRound < totalRounds - 1) {
        setCurrentRound(prev => prev + 1);
        setShowResult(false);
        setShowHint(false);
        setInput('');
        setTimeLeft(45);
      } else {
        const finalCorrect = isCorrect ? correctCount + 1 : correctCount;
        const passed = finalCorrect >= requiredCorrect;
        onComplete(passed, finalCorrect * 25);
      }
    }, 2000);
  }, [currentWord, input, showResult, currentRound, totalRounds, correctCount, requiredCorrect, onComplete]);

  if (gameWords.length === 0 || !currentWord) {
    return <div className="text-center text-boston-cream">Loading...</div>;
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl text-boston-gold mb-2">
          Governor Scramble
        </h2>
        <p className="text-boston-cream/70">
          Round {currentRound + 1} of {totalRounds} | {correctCount} correct (need {requiredCorrect})
        </p>
      </div>

      {/* Timer */}
      <div className={`text-center mb-4 ${timeLeft <= 10 ? 'animate-pulse' : ''}`}>
        <span className={`font-mono text-4xl ${timeLeft <= 10 ? 'text-red-400' : 'text-boston-gold'}`}>
          {timeLeft}
        </span>
      </div>

      {/* Scrambled Word */}
      <motion.div
        key={currentRound}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-boston-navy/80 border border-boston-cream/20 rounded-lg p-6 mb-6"
      >
        <p className="text-boston-cream/50 text-sm text-center mb-2">
          Unscramble this Massachusetts Governor:
        </p>
        <h3 className="text-3xl font-mono text-boston-cream text-center tracking-wider mb-4">
          {currentWord.scrambled}
        </h3>

        {/* Hint */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-center"
            >
              <p className="text-boston-gold/80 text-sm italic">
                Hint: {currentWord.hint}
              </p>
              <p className="text-boston-cream/50 text-xs mt-1">
                Served: {currentWord.years}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Input */}
      {!showResult && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="Type the governor's name..."
              autoComplete="off"
              autoFocus
              className="flex-1 p-3 bg-boston-navy/80 border border-boston-cream/30 rounded-lg text-boston-cream placeholder-boston-cream/30 focus:outline-none focus:border-boston-gold"
            />
            <Button type="submit">Submit</Button>
          </div>
        </form>
      )}

      {/* Hint Button */}
      {!showResult && !showHint && (
        <div className="text-center mb-4">
          <Button variant="outline" size="sm" onClick={() => setShowHint(true)}>
            Show Hint
          </Button>
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            {lastCorrect ? (
              <p className="text-green-400 font-display text-xl">
                Correct! {currentWord.answer}
              </p>
            ) : (
              <p className="text-red-400 font-display text-xl">
                It was {currentWord.answer}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < currentRound
                ? 'bg-green-400'
                : i === currentRound
                  ? 'bg-boston-gold'
                  : 'bg-boston-cream/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
