import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Quote {
  id: string;
  start: string;
  options: string[];
  correct: string;
  context: string;
}

const JFK_QUOTES: Quote[] = [
  {
    id: 'ask',
    start: '"Ask not what your country can do for you—',
    options: [
      'ask what you can do for your country."',
      'ask what you can give to your neighbor."',
      'ask what your government owes you."',
      'ask what freedom truly costs."',
    ],
    correct: 'ask what you can do for your country."',
    context: 'Inaugural Address, January 20, 1961',
  },
  {
    id: 'moon',
    start: '"We choose to go to the Moon in this decade and do the other things,',
    options: [
      'not because they are easy, but because they are hard."',
      'not because we must, but because we can."',
      'not for ourselves, but for all mankind."',
      'not for glory, but for progress."',
    ],
    correct: 'not because they are easy, but because they are hard."',
    context: 'Rice University Speech, September 12, 1962',
  },
  {
    id: 'berlin',
    start: '"Ich bin',
    options: [
      'ein Berliner."',
      'ein Amerikaner."',
      'ein Freund."',
      'mit euch."',
    ],
    correct: 'ein Berliner."',
    context: 'West Berlin Speech, June 26, 1963',
  },
  {
    id: 'torch',
    start: '"The torch has been passed to a new generation of Americans—',
    options: [
      'born in this century, tempered by war."',
      'ready to lead the free world."',
      'united in purpose and resolve."',
      'determined to preserve liberty."',
    ],
    correct: 'born in this century, tempered by war."',
    context: 'Inaugural Address, January 20, 1961',
  },
  {
    id: 'change',
    start: '"Change is the law of life. And those who look only to the past',
    options: [
      'or present are certain to miss the future."',
      'will be left behind by tomorrow."',
      'cannot hope to lead us forward."',
      'repeat the same mistakes."',
    ],
    correct: 'or present are certain to miss the future."',
    context: 'Frankfurt Assembly Hall, June 25, 1963',
  },
  {
    id: 'peace',
    start: '"Peace is a daily, a weekly, a monthly process,',
    options: [
      'gradually changing opinions, slowly eroding old barriers."',
      'requiring patience and perseverance."',
      'built one handshake at a time."',
      'never fully achieved but always pursued."',
    ],
    correct: 'gradually changing opinions, slowly eroding old barriers."',
    context: 'United Nations Address, September 20, 1963',
  },
  {
    id: 'enemy',
    start: '"Forgive your enemies,',
    options: [
      'but never forget their names."',
      'but remember their methods."',
      'but keep your guard raised."',
      'but learn from their actions."',
    ],
    correct: 'but never forget their names."',
    context: 'Attributed to JFK',
  },
  {
    id: 'cost',
    start: '"The cost of freedom is always high, but Americans have always',
    options: [
      'paid it."',
      'risen to the challenge."',
      'been willing to sacrifice."',
      'understood its value."',
    ],
    correct: 'paid it."',
    context: 'Cuban Missile Crisis Address, October 22, 1962',
  },
];

interface QuoteCompletionGameProps {
  onComplete: (passed: boolean, score: number) => void;
  requiredCorrect?: number;
  totalRounds?: number;
}

export function QuoteCompletionGame({
  onComplete,
  requiredCorrect = 4,
  totalRounds = 6,
}: QuoteCompletionGameProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  useEffect(() => {
    const shuffled = [...JFK_QUOTES].sort(() => Math.random() - 0.5);
    setQuotes(shuffled.slice(0, totalRounds));
  }, [totalRounds]);

  useEffect(() => {
    if (quotes.length > 0 && currentIndex < quotes.length) {
      setShuffledOptions([...quotes[currentIndex].options].sort(() => Math.random() - 0.5));
    }
  }, [currentIndex, quotes]);

  const currentQuote = quotes[currentIndex];

  const handleAnswer = useCallback((answer: string) => {
    if (!currentQuote || showResult) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentQuote.correct;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentIndex < totalRounds - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        const finalCorrect = isCorrect ? correctCount + 1 : correctCount;
        const passed = finalCorrect >= requiredCorrect;
        onComplete(passed, finalCorrect * 20);
      }
    }, 2000);
  }, [currentQuote, showResult, currentIndex, totalRounds, correctCount, requiredCorrect, onComplete]);

  if (quotes.length === 0 || !currentQuote) {
    return <div className="text-center text-boston-cream">Loading...</div>;
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl text-boston-gold mb-2">
          Kennedy Quotes
        </h2>
        <p className="text-boston-cream/70">
          {currentIndex + 1} of {totalRounds} | {correctCount} correct (need {requiredCorrect})
        </p>
      </div>

      {/* Quote Start */}
      <motion.div
        key={currentQuote.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-boston-navy/80 border border-boston-cream/20 rounded-lg p-6 mb-6"
      >
        <p className="text-boston-cream/50 text-sm text-center mb-4">
          Complete the JFK quote:
        </p>
        <p className="text-xl text-boston-cream font-serif italic text-center">
          {currentQuote.start}
        </p>
        <p className="text-boston-gold text-2xl text-center mt-2">___</p>
      </motion.div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {shuffledOptions.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === currentQuote.correct;

          return (
            <motion.button
              key={index}
              whileHover={!showResult ? { scale: 1.01 } : {}}
              whileTap={!showResult ? { scale: 0.99 } : {}}
              onClick={() => handleAnswer(option)}
              disabled={showResult}
              className={`
                w-full p-4 rounded-lg border text-left transition-all
                ${showResult && isCorrect
                  ? 'bg-green-600/50 border-green-400'
                  : showResult && isSelected && !isCorrect
                    ? 'bg-red-600/50 border-red-400'
                    : 'bg-boston-navy/50 border-boston-cream/30 hover:border-boston-gold/50'}
              `}
            >
              <p className="text-boston-cream font-serif italic">
                ...{option}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Result Context */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className={`font-display text-lg mb-2 ${selectedAnswer === currentQuote.correct ? 'text-green-400' : 'text-red-400'}`}>
              {selectedAnswer === currentQuote.correct ? 'Correct!' : 'Not quite.'}
            </p>
            <p className="text-boston-cream/50 text-sm">
              {currentQuote.context}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < currentIndex ? 'bg-green-400' : i === currentIndex ? 'bg-boston-gold' : 'bg-boston-cream/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
