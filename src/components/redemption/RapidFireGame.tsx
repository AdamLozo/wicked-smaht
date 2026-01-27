import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RapidQuestion {
  id: string;
  question: string;
  answer: string;
  wrongAnswers: string[];
  category: string;
}

const RAPID_FIRE_QUESTIONS: RapidQuestion[] = [
  // Sports
  { id: 'r1', question: 'What year did the Red Sox break the Curse of the Bambino?', answer: '2004', wrongAnswers: ['2007', '2013', '2001'], category: 'Sports' },
  { id: 'r2', question: 'What is the name of the Boston Bruins mascot?', answer: 'Blades', wrongAnswers: ['Bruno', 'Brawny', 'Bear'], category: 'Sports' },
  { id: 'r3', question: 'How many Super Bowls have the Patriots won?', answer: '6', wrongAnswers: ['5', '7', '4'], category: 'Sports' },

  // History
  { id: 'r4', question: 'What year was the Boston Tea Party?', answer: '1773', wrongAnswers: ['1776', '1770', '1775'], category: 'History' },
  { id: 'r5', question: 'Who designed the Massachusetts State House?', answer: 'Charles Bulfinch', wrongAnswers: ['Paul Revere', 'John Hancock', 'Samuel Adams'], category: 'History' },
  { id: 'r6', question: 'What was Paul Revere\'s profession?', answer: 'Silversmith', wrongAnswers: ['Blacksmith', 'Printer', 'Carpenter'], category: 'History' },

  // Geography
  { id: 'r7', question: 'What river separates Boston from Cambridge?', answer: 'Charles River', wrongAnswers: ['Mystic River', 'Neponset River', 'Merrimack River'], category: 'Geography' },
  { id: 'r8', question: 'How many miles is the Boston Marathon?', answer: '26.2', wrongAnswers: ['26.0', '25.0', '27.0'], category: 'Geography' },
  { id: 'r9', question: 'What neighborhood is Harvard in?', answer: 'Cambridge', wrongAnswers: ['Allston', 'Brookline', 'Somerville'], category: 'Geography' },

  // Culture
  { id: 'r10', question: 'What is a "frappe" in Boston?', answer: 'Milkshake with ice cream', wrongAnswers: ['Iced coffee', 'Frozen cocktail', 'Fruit smoothie'], category: 'Culture' },
  { id: 'r11', question: 'What is a "bubbler" in Boston?', answer: 'Water fountain', wrongAnswers: ['Hot tub', 'Fish tank', 'Beer tap'], category: 'Culture' },
  { id: 'r12', question: 'What candy is made in Cambridge?', answer: 'Necco Wafers', wrongAnswers: ['M&Ms', 'Snickers', 'Skittles'], category: 'Culture' },

  // Education
  { id: 'r13', question: 'What year was Harvard founded?', answer: '1636', wrongAnswers: ['1776', '1701', '1650'], category: 'Education' },
  { id: 'r14', question: 'What does MIT stand for?', answer: 'Massachusetts Institute of Technology', wrongAnswers: ['Massachusetts International Tech', 'Metro Institute of Technology', 'Mass Innovation Tech'], category: 'Education' },

  // Politics
  { id: 'r15', question: 'Which President was born in Brookline?', answer: 'John F. Kennedy', wrongAnswers: ['John Adams', 'Calvin Coolidge', 'George H.W. Bush'], category: 'Politics' },
  { id: 'r16', question: 'What is Boston\'s nickname?', answer: 'The Hub', wrongAnswers: ['The Bean', 'The Bay', 'The Rock'], category: 'Politics' },

  // Food
  { id: 'r17', question: 'What seafood is Boston famous for?', answer: 'Clam chowder', wrongAnswers: ['Shrimp gumbo', 'Fish tacos', 'Crab cakes'], category: 'Food' },
  { id: 'r18', question: 'What Boston dessert is named for a hotel?', answer: 'Boston cream pie', wrongAnswers: ['Parker House rolls', 'Faneuil fudge', 'Beacon brownie'], category: 'Food' },

  // Transit
  { id: 'r19', question: 'What is the oldest subway system in America?', answer: 'The T (MBTA)', wrongAnswers: ['NYC Subway', 'Chicago L', 'SEPTA'], category: 'Transit' },
  { id: 'r20', question: 'What color is the line to Harvard?', answer: 'Red', wrongAnswers: ['Green', 'Orange', 'Blue'], category: 'Transit' },
];

interface RapidFireGameProps {
  onComplete: (passed: boolean, score: number) => void;
  requiredCorrect?: number;
  timeLimit?: number;
}

export function RapidFireGame({
  onComplete,
  requiredCorrect = 8,
  timeLimit = 60,
}: RapidFireGameProps) {
  const [questions, setQuestions] = useState<RapidQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize questions
  useEffect(() => {
    const shuffled = [...RAPID_FIRE_QUESTIONS].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
  }, []);

  // Shuffle options when question changes
  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      const q = questions[currentIndex];
      const allOptions = [q.answer, ...q.wrongAnswers];
      setShuffledOptions(allOptions.sort(() => Math.random() - 0.5));
    }
  }, [currentIndex, questions]);

  // Timer
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          const passed = correctCount >= requiredCorrect;
          onComplete(passed, correctCount * 12 + Math.max(0, (correctCount - wrongCount) * 5));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, gameOver, correctCount, wrongCount, requiredCorrect, onComplete]);

  const handleStart = useCallback(() => {
    setGameStarted(true);
  }, []);

  const handleAnswer = useCallback((answer: string) => {
    if (gameOver || !questions[currentIndex]) return;

    const isCorrect = answer === questions[currentIndex].answer;

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setLastResult('correct');
    } else {
      setWrongCount(prev => prev + 1);
      setLastResult('wrong');
    }

    // Quick flash then next question
    setTimeout(() => {
      setLastResult(null);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Ran out of questions
        setGameOver(true);
        const finalCorrect = isCorrect ? correctCount + 1 : correctCount;
        const finalWrong = isCorrect ? wrongCount : wrongCount + 1;
        const passed = finalCorrect >= requiredCorrect;
        onComplete(passed, finalCorrect * 12 + Math.max(0, (finalCorrect - finalWrong) * 5));
      }
    }, 300);
  }, [gameOver, questions, currentIndex, correctCount, wrongCount, requiredCorrect, onComplete]);

  const currentQuestion = questions[currentIndex];

  // Pre-game
  if (!gameStarted) {
    return (
      <div className="w-full max-w-lg mx-auto text-center">
        <h2 className="font-display text-2xl text-boston-gold mb-4">
          Boston Rapid Fire
        </h2>
        <p className="text-boston-cream/70 mb-6">
          Answer as many questions as you can in {timeLimit} seconds.
          Need {requiredCorrect} correct to pass. No mercy.
        </p>
        <div className="bg-boston-navy/50 border border-boston-cream/20 rounded-lg p-4 mb-6">
          <p className="text-boston-cream/50 text-sm">
            Questions from all neighborhoods. Sports, history, food, culture — everything.
          </p>
        </div>
        <button
          onClick={handleStart}
          className="px-8 py-4 bg-boston-gold text-boston-navy font-display text-xl rounded-lg hover:bg-boston-gold/90 transition-colors"
        >
          GO!
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="text-center text-boston-cream">Loading...</div>;
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Stats Bar */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="text-green-400 font-mono">
          ✓ {correctCount}
        </div>
        <div className={`font-mono text-4xl ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-boston-gold'}`}>
          {timeLeft}
        </div>
        <div className="text-red-400 font-mono">
          ✗ {wrongCount}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-boston-cream/10 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-boston-gold"
          initial={{ width: '100%' }}
          animate={{ width: `${(timeLeft / timeLimit) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Category Badge */}
      <div className="text-center mb-2">
        <span className="text-xs bg-boston-cream/20 text-boston-cream/70 px-2 py-1 rounded">
          {currentQuestion.category}
        </span>
      </div>

      {/* Question */}
      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
        className={`
          bg-boston-navy/80 border rounded-lg p-6 mb-4
          ${lastResult === 'correct' ? 'border-green-400 bg-green-600/20' : ''}
          ${lastResult === 'wrong' ? 'border-red-400 bg-red-600/20' : 'border-boston-cream/20'}
        `}
      >
        <p className="text-boston-cream text-lg text-center">
          {currentQuestion.question}
        </p>
      </motion.div>

      {/* Options - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2">
        {shuffledOptions.map((option, index) => (
          <motion.button
            key={`${currentQuestion.id}-${index}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAnswer(option)}
            disabled={gameOver}
            className="p-3 bg-boston-navy/50 border border-boston-cream/30 rounded-lg text-boston-cream text-sm hover:border-boston-gold/50 hover:bg-boston-cream/10 transition-all active:bg-boston-gold/20"
          >
            {option}
          </motion.button>
        ))}
      </div>

      {/* Question Counter */}
      <p className="text-center text-boston-cream/50 text-sm mt-4">
        Question {currentIndex + 1}
      </p>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-boston-navy/90 flex items-center justify-center z-50"
          >
            <div className="text-center">
              {correctCount >= requiredCorrect ? (
                <>
                  <p className="text-green-400 font-display text-3xl mb-2">
                    You did it!
                  </p>
                  <p className="text-boston-cream/70">
                    {correctCount} correct, {wrongCount} wrong
                  </p>
                </>
              ) : (
                <>
                  <p className="text-red-400 font-display text-3xl mb-2">
                    Time's up!
                  </p>
                  <p className="text-boston-cream/70">
                    {correctCount} of {requiredCorrect} needed
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
