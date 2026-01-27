import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  duration: number;
  onExpire: () => void;
  warningThreshold?: number;
  isPaused?: boolean;
  onTick?: (remaining: number) => void;
}

export function Timer({
  duration,
  onExpire,
  warningThreshold = 10,
  isPaused = false,
  onTick,
}: TimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const isWarning = remaining <= warningThreshold && remaining > 0;

  const handleExpire = useCallback(() => {
    onExpire();
  }, [onExpire]);

  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  useEffect(() => {
    if (isPaused) return;
    if (remaining <= 0) {
      handleExpire();
      return;
    }

    const timer = setInterval(() => {
      setRemaining(prev => {
        const newValue = prev - 1;
        onTick?.(newValue);
        return newValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining, isPaused, handleExpire, onTick]);

  const percentage = (remaining / duration) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-boston-cream/70">Time</span>
        <motion.span
          className={`text-xl font-bold tabular-nums ${
            isWarning ? 'text-red-400' : 'text-boston-cream'
          }`}
          animate={isWarning ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          {remaining}s
        </motion.span>
      </div>
      <div className="h-2 bg-boston-cream/20 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            isWarning ? 'bg-red-500' : 'bg-boston-gold'
          }`}
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
