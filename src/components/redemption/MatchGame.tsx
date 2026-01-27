import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Discovery {
  id: string;
  name: string;
  school: 'harvard' | 'mit';
  description: string;
}

const DISCOVERIES: Discovery[] = [
  // Harvard
  { id: 'anesthesia', name: 'Surgical Anesthesia', school: 'harvard', description: 'First demonstrated at Mass General' },
  { id: 'facebook', name: 'Facebook', school: 'harvard', description: 'Started in a dorm room in 2004' },
  { id: 'polio_vaccine', name: 'Polio Vaccine Development', school: 'harvard', description: 'Key research by John Enders' },
  { id: 'pacemaker', name: 'Implantable Pacemaker', school: 'harvard', description: 'Paul Zoll\'s pioneering work' },
  { id: 'cognitive_psych', name: 'Cognitive Psychology', school: 'harvard', description: 'Founded by Jerome Bruner' },
  // MIT
  { id: 'radar', name: 'Modern Radar', school: 'mit', description: 'Developed at the Radiation Laboratory' },
  { id: 'email', name: 'Email', school: 'mit', description: 'Ray Tomlinson sent the first one' },
  { id: 'spreadsheet', name: 'Electronic Spreadsheet', school: 'mit', description: 'VisiCalc created by Dan Bricklin' },
  { id: 'rsa', name: 'RSA Encryption', school: 'mit', description: 'Rivest, Shamir, and Adleman' },
  { id: 'www', name: 'World Wide Web Standards', school: 'mit', description: 'Tim Berners-Lee\'s lab is here' },
  { id: 'gps', name: 'GPS Development', school: 'mit', description: 'Key navigation algorithms' },
];

interface MatchGameProps {
  onComplete: (passed: boolean, score: number) => void;
  requiredCorrect?: number;
}

export function MatchGame({
  onComplete,
  requiredCorrect = 5,
}: MatchGameProps) {
  const [items, setItems] = useState<Discovery[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<('harvard' | 'mit' | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const totalItems = 8;

  useEffect(() => {
    // Get balanced selection
    const harvardItems = DISCOVERIES.filter(d => d.school === 'harvard').sort(() => Math.random() - 0.5).slice(0, 4);
    const mitItems = DISCOVERIES.filter(d => d.school === 'mit').sort(() => Math.random() - 0.5).slice(0, 4);
    const combined = [...harvardItems, ...mitItems].sort(() => Math.random() - 0.5);
    setItems(combined);
    setAnswers(new Array(totalItems).fill(null));
  }, []);

  const currentItem = items[currentIndex];

  const handleAnswer = useCallback((school: 'harvard' | 'mit') => {
    if (!currentItem || showResult) return;

    const isCorrect = school === currentItem.school;

    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentIndex] = school;
      return newAnswers;
    });

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    setShowResult(true);

    setTimeout(() => {
      if (currentIndex < totalItems - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowResult(false);
      } else {
        const finalCorrect = isCorrect ? correctCount + 1 : correctCount;
        const passed = finalCorrect >= requiredCorrect;
        onComplete(passed, finalCorrect * 15);
      }
    }, 1500);
  }, [currentItem, currentIndex, showResult, correctCount, requiredCorrect, onComplete]);

  if (items.length === 0 || !currentItem) {
    return <div className="text-center text-boston-cream">Loading...</div>;
  }

  const isCorrect = showResult && answers[currentIndex] === currentItem.school;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl text-boston-gold mb-2">
          Harvard or MIT?
        </h2>
        <p className="text-boston-cream/70">
          {currentIndex + 1} of {totalItems} | {correctCount} correct (need {requiredCorrect})
        </p>
      </div>

      {/* Discovery Card */}
      <motion.div
        key={currentItem.id}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-boston-navy/80 border border-boston-cream/20 rounded-lg p-8 mb-6"
      >
        <h3 className="text-2xl font-display text-boston-cream text-center mb-2">
          {currentItem.name}
        </h3>
        <p className="text-boston-cream/60 text-center text-sm">
          {currentItem.description}
        </p>
      </motion.div>

      {/* Answer Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.button
          whileHover={!showResult ? { scale: 1.02 } : {}}
          whileTap={!showResult ? { scale: 0.98 } : {}}
          onClick={() => handleAnswer('harvard')}
          disabled={showResult}
          className={`
            p-6 rounded-lg border-2 transition-all
            ${showResult && currentItem.school === 'harvard'
              ? 'bg-green-600/50 border-green-400'
              : showResult && answers[currentIndex] === 'harvard'
                ? 'bg-red-600/50 border-red-400'
                : 'bg-[#A51C30]/20 border-[#A51C30] hover:bg-[#A51C30]/40'}
          `}
        >
          <p className="text-2xl mb-1">🎓</p>
          <p className="text-boston-cream font-display">Harvard</p>
        </motion.button>

        <motion.button
          whileHover={!showResult ? { scale: 1.02 } : {}}
          whileTap={!showResult ? { scale: 0.98 } : {}}
          onClick={() => handleAnswer('mit')}
          disabled={showResult}
          className={`
            p-6 rounded-lg border-2 transition-all
            ${showResult && currentItem.school === 'mit'
              ? 'bg-green-600/50 border-green-400'
              : showResult && answers[currentIndex] === 'mit'
                ? 'bg-red-600/50 border-red-400'
                : 'bg-[#8B8B8B]/20 border-[#8B8B8B] hover:bg-[#8B8B8B]/40'}
          `}
        >
          <p className="text-2xl mb-1">⚙️</p>
          <p className="text-boston-cream font-display">MIT</p>
        </motion.button>
      </div>

      {/* Result Feedback */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            {isCorrect ? (
              <p className="text-green-400 font-display text-lg">
                Correct! That's {currentItem.school === 'harvard' ? 'Harvard' : 'MIT'}.
              </p>
            ) : (
              <p className="text-red-400 font-display text-lg">
                Nope, that's {currentItem.school === 'harvard' ? 'Harvard' : 'MIT'}.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalItems }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < currentIndex
                ? answers[i] === items[i]?.school
                  ? 'bg-green-400'
                  : 'bg-red-400'
                : i === currentIndex
                  ? 'bg-boston-gold'
                  : 'bg-boston-cream/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
