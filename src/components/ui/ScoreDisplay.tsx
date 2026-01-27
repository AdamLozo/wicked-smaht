import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ScoreDisplayProps {
  score: number;
  keysCollected: number;
  totalKeys?: number;
  showChange?: boolean;
  compact?: boolean;
}

export function ScoreDisplay({
  score,
  keysCollected,
  totalKeys = 10,
  showChange = true,
  compact = false,
}: ScoreDisplayProps) {
  const [previousScore, setPreviousScore] = useState(score);
  const [scoreChange, setScoreChange] = useState<number | null>(null);

  useEffect(() => {
    if (score !== previousScore && showChange) {
      const change = score - previousScore;
      setScoreChange(change);
      setPreviousScore(score);

      const timer = setTimeout(() => setScoreChange(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [score, previousScore, showChange]);

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-boston-cream">
        <div className="flex items-center gap-1">
          <span className="text-boston-gold">★</span>
          <span className="font-bold">{score}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-boston-gold">🔑</span>
          <span>{keysCollected}/{totalKeys}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-boston-navy/80 border border-boston-cream/20 rounded-lg p-4">
      <div className="flex justify-between items-center">
        {/* Score */}
        <div className="relative">
          <span className="text-boston-cream/70 text-sm block mb-1">Score</span>
          <div className="flex items-center gap-2">
            <motion.span
              key={score}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-boston-gold"
            >
              {score.toLocaleString()}
            </motion.span>

            <AnimatePresence>
              {scoreChange !== null && (
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`text-sm font-bold ${
                    scoreChange > 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {scoreChange > 0 ? '+' : ''}{scoreChange}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Keys */}
        <div>
          <span className="text-boston-cream/70 text-sm block mb-1">Keys</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalKeys }).map((_, i) => (
              <motion.span
                key={i}
                initial={false}
                animate={{
                  scale: i < keysCollected ? 1 : 0.8,
                  opacity: i < keysCollected ? 1 : 0.3,
                }}
                className="text-lg"
              >
                {i < keysCollected ? '🔑' : '○'}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
