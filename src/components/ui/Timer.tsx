import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  duration: number;
  onExpire: () => void;
  warningThreshold?: number;
  isPaused?: boolean;
  onTick?: (remaining: number) => void;
  compact?: boolean;
  variant?: 'default' | 'danger';
}

export function Timer({
  duration,
  onExpire,
  warningThreshold = 10,
  isPaused = false,
  onTick,
  compact = false,
  variant = 'default',
}: TimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const isWarning = remaining <= warningThreshold && remaining > 0;
  const isDanger = variant === 'danger';

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

  const getBarColor = () => {
    if (isDanger) return 'bg-red-500';
    if (isWarning) return 'bg-red-500';
    return 'bg-boston-gold';
  };

  const getTextColor = () => {
    if (isDanger || isWarning) return 'text-red-400';
    return 'text-boston-cream';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <motion.span
          className={`text-lg font-bold tabular-nums ${getTextColor()}`}
          animate={isWarning || isDanger ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          {remaining}s
        </motion.span>
        <div className="w-16 h-1.5 bg-boston-cream/20 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${getBarColor()}`}
            initial={{ width: '100%' }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-boston-cream/70">Time</span>
        <motion.span
          className={`text-xl font-bold tabular-nums ${getTextColor()}`}
          animate={isWarning || isDanger ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          {remaining}s
        </motion.span>
      </div>
      <div className="h-2 bg-boston-cream/20 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getBarColor()}`}
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
