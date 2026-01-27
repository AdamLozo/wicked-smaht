import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Timer } from '../ui/Timer';

interface PronunciationWord {
  word: string;
  phonetic: string;
  correctPronunciation: string;
  wrongPronunciations: string[];
  hint: string;
}

const BOSTON_WORDS: PronunciationWord[] = [
  {
    word: "Worcester",
    phonetic: "WOO-stər",
    correctPronunciation: "Wooster",
    wrongPronunciations: ["Wor-chester", "Wor-ses-ter", "War-chester"],
    hint: "Rhymes with rooster, but starts with 'woo'"
  },
  {
    word: "Gloucester",
    phonetic: "GLOSS-tər",
    correctPronunciation: "Gloster",
    wrongPronunciations: ["Glow-chester", "Glou-ces-ter", "Glue-ster"],
    hint: "Just two syllables. The 'ou' is silent."
  },
  {
    word: "Quincy",
    phonetic: "KWIN-zee",
    correctPronunciation: "Kwinzy",
    wrongPronunciations: ["Kwin-see", "Quinn-cee", "Kwinch-ee"],
    hint: "Named after John Quincy Adams. The 'c' sounds like 'z'."
  },
  {
    word: "Peabody",
    phonetic: "PEE-buh-dee",
    correctPronunciation: "Pee-buddy",
    wrongPronunciations: ["Pea-body", "Pee-baw-dee", "Pay-boh-dee"],
    hint: "Like the cartoon dog, Mr. Peabody"
  },
  {
    word: "Medford",
    phonetic: "MED-fərd",
    correctPronunciation: "Meffid",
    wrongPronunciations: ["Med-ford", "Mead-ford", "Med-ferd"],
    hint: "Locals drop the 'd' entirely"
  },
  {
    word: "Scituate",
    phonetic: "SIT-choo-it",
    correctPronunciation: "Sitchuit",
    wrongPronunciations: ["Sit-you-ate", "Skit-u-ate", "Sky-too-ate"],
    hint: "SIT-choo-it. Three syllables, heavy on the first."
  },
  {
    word: "Haverhill",
    phonetic: "HAY-vril",
    correctPronunciation: "Hay-vrill",
    wrongPronunciations: ["Haver-hill", "Have-er-hill", "Hay-ver-hill"],
    hint: "Ignore the 'er'. It's basically invisible."
  },
  {
    word: "Leominster",
    phonetic: "LEM-in-stər",
    correctPronunciation: "Leminster",
    wrongPronunciations: ["Lee-oh-minster", "Leo-min-ster", "Lee-minster"],
    hint: "Starts like 'lemon', ends like 'minster'"
  },
];

interface PronunciationGameProps {
  onComplete: (passed: boolean, score: number) => void;
  requiredCorrect?: number;
  totalRounds?: number;
}

export function PronunciationGame({
  onComplete,
  requiredCorrect = 4,
  totalRounds = 5,
}: PronunciationGameProps) {
  const [currentRound, setCurrentRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [gameWords, setGameWords] = useState<PronunciationWord[]>([]);
  const [shuffledChoices, setShuffledChoices] = useState<string[]>([]);

  // Select random words for this game on mount
  useEffect(() => {
    const shuffled = [...BOSTON_WORDS].sort(() => Math.random() - 0.5);
    setGameWords(shuffled.slice(0, totalRounds));
  }, [totalRounds]);

  // Shuffle choices when word changes
  useEffect(() => {
    if (gameWords.length > 0 && currentRound < gameWords.length) {
      const word = gameWords[currentRound];
      const allChoices = [word.correctPronunciation, ...word.wrongPronunciations];
      setShuffledChoices(allChoices.sort(() => Math.random() - 0.5));
    }
  }, [currentRound, gameWords]);

  const currentWord = gameWords[currentRound];

  const handleChoice = useCallback((choice: string) => {
    if (!currentWord || showResult) return;

    const isCorrect = choice === currentWord.correctPronunciation;
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
        setTimedOut(false);
      } else {
        // Game over
        const finalCorrect = isCorrect ? correctCount + 1 : correctCount;
        const passed = finalCorrect >= requiredCorrect;
        onComplete(passed, finalCorrect * 20);
      }
    }, 1500);
  }, [currentWord, showResult, currentRound, totalRounds, correctCount, requiredCorrect, onComplete]);

  const handleTimeout = useCallback(() => {
    if (showResult || timedOut) return;
    setTimedOut(true);
    setLastCorrect(false);
    setShowResult(true);

    setTimeout(() => {
      if (currentRound < totalRounds - 1) {
        setCurrentRound(prev => prev + 1);
        setShowResult(false);
        setShowHint(false);
        setTimedOut(false);
      } else {
        const passed = correctCount >= requiredCorrect;
        onComplete(passed, correctCount * 20);
      }
    }, 1500);
  }, [showResult, timedOut, currentRound, totalRounds, correctCount, requiredCorrect, onComplete]);

  if (gameWords.length === 0 || !currentWord) {
    return (
      <div className="text-center text-boston-cream">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl text-boston-gold mb-2">
          Say It Like a Local
        </h2>
        <p className="text-boston-cream/70">
          Round {currentRound + 1} of {totalRounds} | {correctCount} correct (need {requiredCorrect})
        </p>
      </div>

      {/* Timer */}
      {!showResult && (
        <div className="mb-4">
          <Timer
            key={currentRound}
            duration={15}
            onExpire={handleTimeout}
            warningThreshold={5}
          />
        </div>
      )}

      {/* Word Display */}
      <motion.div
        key={currentRound}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-boston-navy/80 border border-boston-cream/20 rounded-lg p-6 mb-6"
      >
        <p className="text-boston-cream/50 text-sm text-center mb-2">
          How do you pronounce...
        </p>
        <h3 className="text-4xl font-display text-boston-cream text-center mb-2">
          {currentWord.word}
        </h3>

        {/* Hint */}
        <AnimatePresence>
          {showHint && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-boston-gold/80 text-sm text-center mt-4 italic"
            >
              Hint: {currentWord.hint}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {shuffledChoices.map((choice, index) => {
          const isCorrectChoice = choice === currentWord.correctPronunciation;
          const showWrong = showResult && !lastCorrect && choice === shuffledChoices.find(c => c !== currentWord.correctPronunciation && c === choice);

          return (
            <motion.button
              key={`${currentRound}-${index}`}
              whileHover={!showResult ? { scale: 1.02 } : {}}
              whileTap={!showResult ? { scale: 0.98 } : {}}
              onClick={() => handleChoice(choice)}
              disabled={showResult}
              className={`
                p-4 rounded-lg border text-center font-body
                transition-all duration-200
                ${showResult
                  ? isCorrectChoice
                    ? 'bg-green-600/50 border-green-400 text-green-100'
                    : 'opacity-50 border-boston-cream/20'
                  : 'bg-boston-navy/50 border-boston-cream/30 text-boston-cream hover:bg-boston-cream/10'
                }
                ${showWrong ? 'bg-red-600/50 border-red-400' : ''}
              `}
            >
              "{choice}"
            </motion.button>
          );
        })}
      </div>

      {/* Hint Button */}
      {!showResult && !showHint && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHint(true)}
          >
            Show Hint
          </Button>
        </div>
      )}

      {/* Result Feedback */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center mt-4"
          >
            {timedOut ? (
              <p className="text-red-400 font-display text-lg">
                Time's up! It's pronounced "{currentWord.phonetic}"
              </p>
            ) : lastCorrect ? (
              <p className="text-green-400 font-display text-lg">
                That's it! {currentWord.phonetic}
              </p>
            ) : (
              <p className="text-red-400 font-display text-lg">
                Nope. It's "{currentWord.phonetic}"
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < currentRound
                ? i < correctCount + (lastCorrect && i === currentRound - 1 ? 0 : 0)
                  ? 'bg-green-400'
                  : 'bg-red-400'
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
