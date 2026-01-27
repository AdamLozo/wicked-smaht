import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRival } from '../../contexts';

interface BrendanTextOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  helpContent?: string; // Optional hint if using as cousin lifeline
}

export function BrendanTextOverlay({
  isOpen,
  onClose,
  message,
  helpContent,
}: BrendanTextOverlayProps) {
  const { state } = useRival();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss after duration
  useEffect(() => {
    if (!isOpen) return;

    const duration = helpContent ? 8000 : 4000; // Longer for hints
    timerRef.current = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isOpen, onClose, helpContent]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed top-4 left-4 right-4 z-50 pointer-events-none"
        >
          <div className="max-w-md mx-auto pointer-events-auto">
            {/* Text message bubble */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-blue-600 rounded-2xl rounded-tl-sm p-4 shadow-lg shadow-blue-500/30 border border-blue-400"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-700 border-2 border-blue-400 overflow-hidden flex-shrink-0">
                  <img
                    src={state.rivals.brendan.portrait}
                    alt="Brendan"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Brendan</p>
                  <p className="text-blue-200 text-xs">iMessage</p>
                </div>
                <div className="ml-auto text-blue-200 text-xs">
                  now
                </div>
              </div>

              {/* Message */}
              <p className="text-white text-sm leading-relaxed">
                {message}
              </p>

              {/* Help content if provided (cousin lifeline) */}
              {helpContent && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-3 pt-3 border-t border-blue-400/30"
                >
                  <p className="text-blue-100 text-xs mb-1 uppercase tracking-wider">
                    His suggestion:
                  </p>
                  <p className="text-white font-medium">
                    {helpContent}
                  </p>
                </motion.div>
              )}

              {/* Typing indicator animation */}
              <div className="flex items-center gap-1 mt-2">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: 2, duration: 0.6 }}
                  className="w-2 h-2 bg-blue-300 rounded-full"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: 2, duration: 0.6, delay: 0.2 }}
                  className="w-2 h-2 bg-blue-300 rounded-full"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: 2, duration: 0.6, delay: 0.4 }}
                  className="w-2 h-2 bg-blue-300 rounded-full"
                />
              </div>
            </motion.div>

            {/* Tap to dismiss */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={onClose}
              className="w-full mt-2 text-center text-boston-cream/50 text-xs hover:text-boston-cream"
            >
              Tap to dismiss
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Pre-defined Brendan text messages for random interruptions
export const BRENDAN_INTERRUPT_MESSAGES = [
  "Yo cuz! Just crushed Fenway. You slowin' down or what? 😤",
  "Bro I heard Maeve's like 2 keys ahead. Pick it up!",
  "This trivia is wicked easy, you got this 💪",
  "Dude I almost choked at North End but pulled through lol",
  "Mom's asking when you're gonna finish. No pressure 😂",
  "Just saw you on the map. We're headed to the same spot 👀",
  "Real talk - the Cambridge questions are tough. Study up",
  "Maeve just texted me she's nervous. You got this!",
  "Remember that time we got lost in Southie? Good times",
  "Bro if you beat me I'll never hear the end of it from dad",
];

// Brendan responses for cousin lifeline
export const BRENDAN_LIFELINE_RESPONSES = [
  { intro: "Aight lemme think...", confidence: "pretty sure" },
  { intro: "Oh I know this one!", confidence: "definitely" },
  { intro: "Hmm that's a tough one...", confidence: "maybe" },
  { intro: "Yo I literally just read about this!", confidence: "100%" },
  { intro: "Okay don't quote me but...", confidence: "I think" },
];
