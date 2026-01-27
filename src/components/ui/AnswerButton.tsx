import { motion } from 'framer-motion';

interface AnswerButtonProps {
  label: string;
  index: number;
  onClick: () => void;
  disabled?: boolean;
  isSelected?: boolean;
  isCorrect?: boolean | null;
  isEliminated?: boolean;
}

const indexLabels = ['A', 'B', 'C', 'D'];

export function AnswerButton({
  label,
  index,
  onClick,
  disabled = false,
  isSelected = false,
  isCorrect = null,
  isEliminated = false,
}: AnswerButtonProps) {
  const getBackgroundColor = () => {
    if (isEliminated) return 'bg-boston-cream/10 opacity-50';
    if (isCorrect === true) return 'bg-green-600';
    if (isCorrect === false && isSelected) return 'bg-red-600';
    if (isSelected) return 'bg-boston-gold';
    return 'bg-boston-cream/10 hover:bg-boston-cream/20';
  };

  const getTextColor = () => {
    if (isEliminated) return 'text-boston-cream/50';
    if (isCorrect !== null) return 'text-white';
    if (isSelected) return 'text-boston-navy';
    return 'text-boston-cream';
  };

  return (
    <motion.button
      whileHover={!disabled && !isEliminated ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isEliminated ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || isEliminated}
      className={`
        w-full p-4 rounded-lg
        flex items-center gap-4
        transition-colors duration-200
        disabled:cursor-not-allowed
        ${getBackgroundColor()}
        ${getTextColor()}
      `}
    >
      <span
        className={`
          w-8 h-8 rounded-full
          flex items-center justify-center
          font-bold text-sm
          ${isSelected && isCorrect === null ? 'bg-boston-navy text-boston-gold' : 'bg-boston-cream/20'}
        `}
      >
        {indexLabels[index]}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {isCorrect === true && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-xl"
        >
          ✓
        </motion.span>
      )}
      {isCorrect === false && isSelected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-xl"
        >
          ✗
        </motion.span>
      )}
    </motion.button>
  );
}
