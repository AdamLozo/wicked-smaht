import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface PolaroidProps {
  image: string;
  caption: string;
  collected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Polaroid({
  image,
  caption,
  collected = true,
  onClick,
  className = ''
}: PolaroidProps) {
  // Generate a stable random rotation based on caption
  const rotation = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < caption.length; i++) {
      hash = caption.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (hash % 6) - 3; // -3 to 3 degrees
  }, [caption]);

  return (
    <motion.div
      whileHover={{ rotate: [-1, 1, -1], scale: 1.05 }}
      onClick={onClick}
      className={`
        bg-boston-cream p-2 pb-12 shadow-lg
        cursor-pointer select-none
        ${collected ? '' : 'grayscale opacity-50'}
        ${className}
      `}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <div className="aspect-square bg-gray-200 overflow-hidden">
        {collected ? (
          <img
            src={image}
            alt={caption}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/assets/images/ui/polaroid-unknown.png';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500 text-4xl">
            ?
          </div>
        )}
      </div>

      <p className="mt-2 text-boston-navy text-sm font-body text-center italic">
        {collected ? caption : '???'}
      </p>
    </motion.div>
  );
}
