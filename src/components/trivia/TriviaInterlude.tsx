import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { InterludeContent } from '../../types';

interface TriviaInterludeProps {
  content: InterludeContent;
  locationName: string;
  duration?: number;
  onComplete: () => void;
  questionNumber: number;
  totalQuestions: number;
}

const ICON_MAP: Record<string, string> = {
  // Southie
  shamrock: '\u2618',
  castle: '\u{1F3F0}',
  home: '\u{1F3E0}',
  waves: '\u{1F30A}',
  street: '\u{1F6E4}',
  // North End
  pasta: '\u{1F35D}',
  celebrate: '\u{1F389}',
  horse: '\u{1F40E}',
  map: '\u{1F5FA}',
  dessert: '\u{1F36C}',
  // Fenway
  baseball: '\u26BE',
  wall: '\u{1F7E2}',
  trophy: '\u{1F3C6}',
  neon: '\u{1F4A1}',
  flag: '\u{1F6A9}',
  // Beacon Hill
  lamp: '\u{1F3EE}',
  window: '\u{1FA9F}',
  camera: '\u{1F4F7}',
  fish: '\u{1F41F}',
  book: '\u{1F4DA}',
  // Charlestown
  ship: '\u{1F6A2}',
  monument: '\u{1F3DB}',
  anchor: '\u2693',
  stairs: '\u{1FA9C}',
  community: '\u{1F46A}',
  // Back Bay
  construction: '\u{1F3D7}',
  abc: '\u{1F520}',
  library: '\u{1F4DA}',
  building: '\u{1F3E2}',
  church: '\u26EA',
  // Cambridge
  graduation: '\u{1F393}',
  bridge: '\u{1F309}',
  medal: '\u{1F3C5}',
  plaza: '\u{1F3DB}',
  statue: '\u{1F5FF}',
  // Dorchester
  dot: '\u{1F534}',
  president: '\u{1F3DB}',
  chocolate: '\u{1F36B}',
  globe: '\u{1F30D}',
  // Downtown
  trail: '\u{1F6B6}',
  hall: '\u{1F3DB}',
  marker: '\u{1F4CD}',
  meeting: '\u{1F3DB}',
  chapel: '\u26EA',
  // Seaport
  rocket: '\u{1F680}',
  tea: '\u{1FAD6}',
  art: '\u{1F3A8}',
  convention: '\u{1F3E2}',
  walk: '\u{1F6B6}',
};

export function TriviaInterlude({
  content,
  locationName,
  duration = 10000,
  onComplete,
  questionNumber,
  totalQuestions,
}: TriviaInterludeProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= duration) {
        clearInterval(interval);
        onComplete();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  const icon = ICON_MAP[content.icon] || '\u{1F4CD}';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.9, rotate: 3 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex-1 flex items-center justify-center p-4"
    >
      {/* Postcard Container */}
      <div className="relative max-w-lg w-full">
        {/* Postcard */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="bg-boston-cream rounded-lg shadow-2xl overflow-hidden"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Postcard Header - like a stamp area */}
          <div className="bg-gradient-to-r from-boston-brick to-boston-brick/80 px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <span className="text-boston-cream font-display text-sm tracking-wide uppercase">
                {content.type === 'fun_fact' ? 'Did You Know?' : 'Local Lore'}
              </span>
            </div>
            {/* Stamp */}
            <div className="w-12 h-14 bg-boston-cream/90 rounded border-2 border-dashed border-boston-navy/30 flex items-center justify-center">
              <span className="text-boston-navy font-display text-xs text-center leading-tight">
                Boston<br />MA
              </span>
            </div>
          </div>

          {/* Postcard Body */}
          <div className="p-6">
            {/* Location Tag */}
            <div className="mb-4">
              <span className="inline-block bg-boston-navy/10 text-boston-navy px-3 py-1 rounded-full text-xs font-body">
                {locationName}
              </span>
            </div>

            {/* Main Content */}
            <h3 className="font-display text-boston-navy text-xl mb-3">
              {content.headline}
            </h3>
            <p className="font-body text-boston-navy/80 text-base leading-relaxed">
              {content.text}
            </p>

            {/* Decorative Line */}
            <div className="mt-6 pt-4 border-t border-boston-navy/10 flex justify-between items-center">
              <span className="text-boston-navy/40 text-sm font-body italic">
                Greetings from Boston
              </span>
              <span className="text-boston-navy/40 text-sm font-body">
                Question {questionNumber} of {totalQuestions}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-boston-navy/10">
            <motion.div
              className="h-full bg-gradient-to-r from-boston-gold to-boston-brick"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: 'linear' }}
            />
          </div>
        </motion.div>

        {/* Decorative shadow/tilt effect */}
        <div
          className="absolute inset-0 bg-boston-navy/20 rounded-lg -z-10"
          style={{
            transform: 'rotate(2deg) translateY(8px)',
          }}
        />
      </div>
    </motion.div>
  );
}
