import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SullyHint } from '../../types';
import { useAudio } from '../../contexts';
import { useFocusTrap } from '../../hooks/useKeyboardNavigation';
import { Button } from './Button';

interface PhoneLocalModalProps {
  isOpen: boolean;
  onClose: () => void;
  hint: SullyHint;
  showBonusMessage?: boolean; // Fitz's perk
}

export function PhoneLocalModal({
  isOpen,
  onClose,
  hint,
  showBonusMessage = false,
}: PhoneLocalModalProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isRinging, setIsRinging] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const { audioState } = useAudio();
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, isOpen);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const typingSpeed = 35;

  const completeTyping = useCallback(() => {
    setDisplayedText(hint.text);
    setIsTypingComplete(true);
  }, [hint.text]);

  // Simulate phone ringing
  useEffect(() => {
    if (!isOpen) return;

    setIsRinging(true);
    setIsConnected(false);
    setDisplayedText('');
    setIsTypingComplete(false);

    const ringTimer = setTimeout(() => {
      setIsRinging(false);
      setIsConnected(true);
    }, 1500);

    return () => clearTimeout(ringTimer);
  }, [isOpen]);

  // Typewriter effect after connection
  useEffect(() => {
    if (!isOpen || !isConnected) return;

    let index = 0;
    const timer = setInterval(() => {
      if (index < hint.text.length) {
        setDisplayedText(hint.text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsTypingComplete(true);
      }
    }, typingSpeed);

    // Play audio if available
    if (hint.audioFile && audioState.voiceEnabled) {
      audioRef.current = new Audio(hint.audioFile);
      audioRef.current.volume = audioState.masterVolume;
      audioRef.current.play().catch(() => {
        // Audio playback failed, continue with text only
      });
    }

    return () => {
      clearInterval(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isOpen, isConnected, hint.text, hint.audioFile, audioState.voiceEnabled, audioState.masterVolume]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && isTypingComplete) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isTypingComplete, onClose]);

  const handleClick = () => {
    if (!isTypingComplete && isConnected) {
      completeTyping();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        onClick={isTypingComplete ? onClose : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-local-title"
      >
        <motion.div
          ref={containerRef}
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md"
        >
          {/* Phone frame */}
          <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-3xl p-3 shadow-2xl">
            <div className="bg-boston-navy rounded-2xl overflow-hidden border border-boston-cream/10">
              {/* Phone header */}
              <div className="bg-fenway-green/30 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-boston-gold/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-boston-gold" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 id="phone-local-title" className="text-boston-cream font-display text-sm">
                      Sully O'Brien
                    </h2>
                    <p className="text-boston-cream/50 text-xs">
                      {isRinging ? 'Calling...' : 'Voice Memo'}
                    </p>
                  </div>
                </div>
                {isConnected && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-3 h-3 rounded-full bg-boston-green"
                  />
                )}
              </div>

              {/* Content */}
              <div className="p-6 min-h-[200px] flex items-center justify-center">
                {isRinging ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="text-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-boston-gold/10 border-2 border-boston-gold/30 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-boston-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </div>
                    <p className="text-boston-cream/70">Connecting to Sully...</p>
                  </motion.div>
                ) : (
                  <div
                    className="w-full cursor-pointer"
                    onClick={handleClick}
                  >
                    {/* Sully portrait */}
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-boston-cream/10 border-2 border-boston-gold/30">
                        <img
                          src="/assets/images/portraits/sully.png"
                          alt="Sully O'Brien"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/images/ui/portrait-placeholder.png';
                          }}
                        />
                      </div>
                    </div>

                    <p className="text-boston-cream text-center leading-relaxed">
                      "{displayedText}
                      {!isTypingComplete && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 0.5 }}
                        >
                          |
                        </motion.span>
                      )}
                      {isTypingComplete && '"'}
                    </p>

                    {!isTypingComplete && (
                      <p className="text-boston-cream/40 text-xs mt-4 text-center">
                        Click to skip
                      </p>
                    )}

                    {/* Fitz bonus message */}
                    {showBonusMessage && isTypingComplete && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-boston-gold/20 rounded-lg border border-boston-gold/30"
                      >
                        <p className="text-boston-gold text-sm text-center">
                          Bonus insight revealed! +25 points
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {isConnected && (
                <div className="px-6 pb-6">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className="w-full"
                    disabled={!isTypingComplete}
                  >
                    Hang Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
