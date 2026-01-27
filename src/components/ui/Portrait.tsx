import { useState } from 'react';
import { motion } from 'framer-motion';

interface PortraitProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  speaking?: boolean;
  className?: string;
}

const sizes = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

const textSizes = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
};

// Generate a consistent color based on name
function getAvatarColor(name: string): string {
  const colors = [
    'from-amber-600 to-amber-800',
    'from-emerald-600 to-emerald-800',
    'from-blue-600 to-blue-800',
    'from-purple-600 to-purple-800',
    'from-rose-600 to-rose-800',
    'from-cyan-600 to-cyan-800',
    'from-orange-600 to-orange-800',
    'from-indigo-600 to-indigo-800',
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Portrait({
  src,
  name,
  size = 'md',
  speaking = false,
  className = ''
}: PortraitProps) {
  const [imageError, setImageError] = useState(false);
  const showFallback = !src || imageError;

  return (
    <motion.div
      animate={speaking ? { scale: [1, 1.02, 1] } : {}}
      transition={speaking ? { repeat: Infinity, duration: 0.5 } : {}}
      className={`
        ${sizes[size]}
        rounded-full overflow-hidden
        border-2 ${speaking ? 'border-boston-gold' : 'border-boston-cream/30'}
        ${className}
      `}
    >
      {showFallback ? (
        <div
          className={`
            w-full h-full
            bg-gradient-to-br ${getAvatarColor(name)}
            flex items-center justify-center
            ${textSizes[size]} font-bold text-white
          `}
        >
          {getInitials(name)}
        </div>
      ) : (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </motion.div>
  );
}
