import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Landmark {
  id: string;
  name: string;
  description: string;
  hint: string;
  options: string[];
}

// Using descriptions since we don't have actual photos
const FREEDOM_TRAIL_LANDMARKS: Landmark[] = [
  {
    id: 'common',
    name: 'Boston Common',
    description: 'A large open green space with a central gazebo, duck pond, and the Soldiers and Sailors Monument visible on a hill.',
    hint: 'The oldest public park in the United States, established 1634',
    options: ['Boston Common', 'Public Garden', 'Esplanade', 'Christopher Columbus Park'],
  },
  {
    id: 'state_house',
    name: 'Massachusetts State House',
    description: 'A grand building with a distinctive golden dome, red brick facade, and white columned entrance on Beacon Hill.',
    hint: 'The dome was originally wooden, then copper-covered by Paul Revere',
    options: ['Massachusetts State House', 'Faneuil Hall', 'Old State House', 'Custom House'],
  },
  {
    id: 'park_street',
    name: 'Park Street Church',
    description: 'A white church with a tall, elegant steeple. "America" was first sung here in 1831.',
    hint: 'Located at the corner of Park and Tremont Streets',
    options: ['Park Street Church', 'Old North Church', 'Kings Chapel', 'Old South Meeting House'],
  },
  {
    id: 'granary',
    name: 'Granary Burying Ground',
    description: 'An old cemetery with weathered gravestones, including those of Paul Revere, Samuel Adams, and John Hancock.',
    hint: 'Named for a granary that once stood nearby',
    options: ['Granary Burying Ground', 'Copps Hill Burying Ground', 'Kings Chapel Burying Ground', 'Central Burying Ground'],
  },
  {
    id: 'old_south',
    name: 'Old South Meeting House',
    description: 'A brick church with a tall white steeple where colonists gathered before the Boston Tea Party.',
    hint: 'The largest building in colonial Boston',
    options: ['Old South Meeting House', 'Park Street Church', 'Faneuil Hall', 'Old North Church'],
  },
  {
    id: 'old_state',
    name: 'Old State House',
    description: 'A small brick building with a distinctive white tower, lion and unicorn statues on top, surrounded by modern skyscrapers.',
    hint: 'Site of the Boston Massacre in 1770',
    options: ['Old State House', 'Massachusetts State House', 'Faneuil Hall', 'Custom House'],
  },
  {
    id: 'faneuil',
    name: 'Faneuil Hall',
    description: 'A Georgian brick building with a grasshopper weathervane on top, known as "The Cradle of Liberty."',
    hint: 'Samuel Adams and others debated independence here',
    options: ['Faneuil Hall', 'Old South Meeting House', 'Quincy Market', 'Old State House'],
  },
  {
    id: 'old_north',
    name: 'Old North Church',
    description: 'A white brick church with a tall steeple in the North End. Two lanterns hung here signaled "by sea."',
    hint: '"One if by land, two if by sea"',
    options: ['Old North Church', 'Park Street Church', 'Old South Meeting House', 'Kings Chapel'],
  },
  {
    id: 'bunker',
    name: 'Bunker Hill Monument',
    description: 'A tall granite obelisk in Charlestown commemorating the first major battle of the Revolution.',
    hint: '294 steps to the top, no elevator',
    options: ['Bunker Hill Monument', 'Washington Monument', 'Soldiers Monument', 'Dorchester Heights Monument'],
  },
  {
    id: 'constitution',
    name: 'USS Constitution',
    description: 'A three-masted wooden warship docked in Charlestown Navy Yard, the oldest commissioned warship afloat.',
    hint: 'Nicknamed "Old Ironsides"',
    options: ['USS Constitution', 'USS Cassin Young', 'Mayflower II', 'USS Salem'],
  },
];

interface PhotoIdGameProps {
  onComplete: (passed: boolean, score: number) => void;
  requiredCorrect?: number;
  totalRounds?: number;
}

export function PhotoIdGame({
  onComplete,
  requiredCorrect = 5,
  totalRounds = 7,
}: PhotoIdGameProps) {
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  useEffect(() => {
    const shuffled = [...FREEDOM_TRAIL_LANDMARKS].sort(() => Math.random() - 0.5);
    setLandmarks(shuffled.slice(0, totalRounds));
  }, [totalRounds]);

  useEffect(() => {
    if (landmarks.length > 0 && currentIndex < landmarks.length) {
      setShuffledOptions([...landmarks[currentIndex].options].sort(() => Math.random() - 0.5));
    }
  }, [currentIndex, landmarks]);

  const currentLandmark = landmarks[currentIndex];

  const handleAnswer = useCallback((answer: string) => {
    if (!currentLandmark || showResult) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentLandmark.name;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentIndex < totalRounds - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setShowHint(false);
      } else {
        const finalCorrect = isCorrect ? correctCount + 1 : correctCount;
        const passed = finalCorrect >= requiredCorrect;
        onComplete(passed, finalCorrect * 18);
      }
    }, 2000);
  }, [currentLandmark, showResult, currentIndex, totalRounds, correctCount, requiredCorrect, onComplete]);

  if (landmarks.length === 0 || !currentLandmark) {
    return <div className="text-center text-boston-cream">Loading...</div>;
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl text-boston-gold mb-2">
          Freedom Trail Photo ID
        </h2>
        <p className="text-boston-cream/70">
          {currentIndex + 1} of {totalRounds} | {correctCount} correct (need {requiredCorrect})
        </p>
      </div>

      {/* "Photo" Description */}
      <motion.div
        key={currentLandmark.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-boston-navy/80 border-4 border-boston-cream/40 rounded-lg p-6 mb-6 relative"
      >
        {/* Simulated photo frame */}
        <div className="absolute top-2 right-2 text-boston-cream/30 text-xs">📷</div>

        <p className="text-boston-cream/50 text-xs text-center mb-3">
          [Imagine a photo showing...]
        </p>

        <p className="text-boston-cream text-center leading-relaxed">
          {currentLandmark.description}
        </p>

        {/* Hint */}
        <AnimatePresence>
          {showHint && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-boston-gold/80 text-sm text-center mt-4 italic"
            >
              Hint: {currentLandmark.hint}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Hint Button */}
      {!showResult && !showHint && (
        <div className="text-center mb-4">
          <button
            onClick={() => setShowHint(true)}
            className="text-boston-cream/50 text-sm hover:text-boston-gold underline"
          >
            Need a hint?
          </button>
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {shuffledOptions.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === currentLandmark.name;

          return (
            <motion.button
              key={index}
              whileHover={!showResult ? { scale: 1.02 } : {}}
              whileTap={!showResult ? { scale: 0.98 } : {}}
              onClick={() => handleAnswer(option)}
              disabled={showResult}
              className={`
                p-3 rounded-lg border text-center transition-all
                ${showResult && isCorrect
                  ? 'bg-green-600/50 border-green-400'
                  : showResult && isSelected && !isCorrect
                    ? 'bg-red-600/50 border-red-400'
                    : 'bg-boston-navy/50 border-boston-cream/30 hover:border-boston-gold/50'}
              `}
            >
              <p className="text-boston-cream text-sm">{option}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Result */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p className={`font-display text-lg ${selectedAnswer === currentLandmark.name ? 'text-green-400' : 'text-red-400'}`}>
              {selectedAnswer === currentLandmark.name
                ? 'Correct!'
                : `It's ${currentLandmark.name}`}
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
