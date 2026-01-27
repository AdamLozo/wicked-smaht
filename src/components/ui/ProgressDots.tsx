import { motion } from 'framer-motion';

interface ProgressDotsProps {
  total: number;
  current: number;
  results?: ('correct' | 'wrong' | null)[];
}

export function ProgressDots({ total, current, results = [] }: ProgressDotsProps) {
  return (
    <div className="flex gap-2 items-center justify-center">
      {Array.from({ length: total }).map((_, index) => {
        const result = results[index];
        const isCurrent = index === current;
        const isPast = index < current;

        let bgColor = 'bg-boston-cream/20';
        if (result === 'correct') bgColor = 'bg-green-500';
        if (result === 'wrong') bgColor = 'bg-red-500';
        if (isCurrent && !result) bgColor = 'bg-boston-gold';

        return (
          <motion.div
            key={index}
            className={`
              w-3 h-3 rounded-full
              ${bgColor}
              ${isCurrent ? 'ring-2 ring-boston-gold ring-offset-2 ring-offset-boston-navy' : ''}
            `}
            initial={false}
            animate={{
              scale: isCurrent ? 1.2 : 1,
              opacity: isPast || isCurrent ? 1 : 0.5,
            }}
            transition={{ duration: 0.2 }}
          />
        );
      })}
    </div>
  );
}
