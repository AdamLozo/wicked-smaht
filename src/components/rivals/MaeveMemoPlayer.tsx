import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRival, useAudio } from '../../contexts';

interface MaeveMemoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  audioFile?: string;
  helpContent?: string; // Optional hint if using as cousin lifeline
  onCallback?: (correctedAnswer: string) => void; // Maeve's callback correction
}

export function MaeveMemoPlayer({
  isOpen,
  onClose,
  message,
  audioFile,
  helpContent,
  onCallback,
}: MaeveMemoPlayerProps) {
  const { state } = useRival();
  const { audioState } = useAudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Typewriter effect
  useEffect(() => {
    if (!isOpen) {
      setDisplayedText('');
      setProgress(0);
      setIsPlaying(false);
      return;
    }

    // Start playing
    setIsPlaying(true);

    // Typewriter animation
    let index = 0;
    const typingSpeed = 40;
    animationRef.current = setInterval(() => {
      if (index < message.length) {
        setDisplayedText(message.slice(0, index + 1));
        setProgress((index + 1) / message.length);
        index++;
      } else {
        if (animationRef.current) {
          clearInterval(animationRef.current);
        }
        setIsPlaying(false);
      }
    }, typingSpeed);

    // Play audio if available
    if (audioFile && audioState.voiceEnabled) {
      audioRef.current = new Audio(audioFile);
      audioRef.current.volume = audioState.masterVolume;
      audioRef.current.play().catch(() => {
        // Audio playback failed, continue with text
      });
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isOpen, message, audioFile, audioState.voiceEnabled, audioState.masterVolume]);

  // Auto-dismiss after completion
  useEffect(() => {
    if (!isOpen || isPlaying) return;

    const duration = helpContent ? 6000 : 3000;
    timerRef.current = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isOpen, isPlaying, onClose, helpContent]);

  const handleSkip = useCallback(() => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setDisplayedText(message);
    setProgress(1);
    setIsPlaying(false);
  }, [message]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={isPlaying ? handleSkip : onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm"
          >
            {/* Voice memo card */}
            <div className="bg-gradient-to-b from-purple-900 to-purple-950 rounded-2xl p-4 shadow-xl shadow-purple-500/20 border border-purple-400/50">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-purple-700 border-2 border-purple-400 overflow-hidden">
                    <img
                      src={state.rivals.maeve.portrait}
                      alt="Maeve"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  {/* Recording indicator */}
                  {isPlaying && (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-purple-900"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold">Maeve</p>
                  <p className="text-purple-300 text-sm">Voice Memo</p>
                </div>
                <div className="text-purple-300 text-xs">
                  {isPlaying ? 'Playing...' : 'Finished'}
                </div>
              </div>

              {/* Waveform visualization */}
              <div className="flex items-center gap-0.5 h-12 mb-4 px-2">
                {Array.from({ length: 40 }).map((_, i) => {
                  const isActive = i / 40 <= progress;
                  const height = Math.random() * 100;
                  return (
                    <motion.div
                      key={i}
                      initial={{ height: '20%' }}
                      animate={{
                        height: isActive ? `${20 + height * 0.6}%` : '20%',
                        backgroundColor: isActive ? '#c084fc' : '#4c1d95',
                      }}
                      transition={{ duration: 0.1 }}
                      className="flex-1 rounded-full min-h-[4px]"
                    />
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-purple-800 rounded-full mb-4 overflow-hidden">
                <motion.div
                  className="h-full bg-purple-400"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>

              {/* Transcription */}
              <div className="bg-purple-950/50 rounded-lg p-3 min-h-[80px]">
                <p className="text-purple-100 text-sm leading-relaxed">
                  "{displayedText}
                  {isPlaying && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                      className="text-purple-400"
                    >
                      |
                    </motion.span>
                  )}
                  {!isPlaying && '"'}
                </p>
              </div>

              {/* Help content if provided (cousin lifeline) */}
              {helpContent && !isPlaying && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 bg-purple-800/50 rounded-lg border border-purple-400/30"
                >
                  <p className="text-purple-200 text-xs mb-1 uppercase tracking-wider">
                    Her suggestion:
                  </p>
                  <p className="text-white font-medium text-sm">
                    {helpContent}
                  </p>
                </motion.div>
              )}

              {/* Callback indicator */}
              {onCallback && !isPlaying && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-center text-purple-300 text-xs mt-3"
                >
                  She might call back with more info...
                </motion.p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-3">
              {isPlaying ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSkip}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500"
                >
                  Skip
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500"
                >
                  Dismiss
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Pre-defined Maeve voice memo messages for random interruptions
export const MAEVE_INTERRUPT_MESSAGES = [
  "Hey, just wanted to check in. I'm making good progress but don't let that psych you out. You've got this.",
  "Quick tip: the North End questions are mostly about food history. Trust your gut on those.",
  "I know we're competing but... good luck out there. Seriously. May the best cousin win.",
  "Brendan keeps texting me updates about you. He's actually rooting for you, you know.",
  "Just finished Cambridge. Those MIT questions are sneaky. Watch out for the trick answers.",
  "Mom says hi. She also says she bet on you winning so no pressure. Kidding. Mostly.",
  "Remember when we used to quiz each other on road trips? This feels like that but with stakes.",
  "I'm not going to lie, I'm a little nervous. You're better at this than you think.",
];

// Maeve responses for cousin lifeline
export const MAEVE_LIFELINE_RESPONSES = [
  { intro: "Hmm, let me think about this carefully...", confidence: "fairly certain" },
  { intro: "Oh interesting question...", confidence: "I believe" },
  { intro: "Give me a second to consider...", confidence: "probably" },
  { intro: "I actually studied this recently!", confidence: "confident" },
  { intro: "This is tricky but...", confidence: "I'd say" },
];
