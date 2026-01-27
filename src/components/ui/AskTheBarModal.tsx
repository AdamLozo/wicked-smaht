import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VoiceProfile, LifelineHint } from '../../types';
import { useAudio } from '../../contexts';
import { useFocusTrap } from '../../hooks/useKeyboardNavigation';
import { Button } from './Button';

interface AskTheBarModalProps {
  isOpen: boolean;
  onClose: () => void;
  npcName: string;
  npcPortrait?: string;
  voiceProfile?: VoiceProfile;
  hint: LifelineHint;
  characterName?: string;
}

export function AskTheBarModal({
  isOpen,
  onClose,
  npcName,
  npcPortrait,
  voiceProfile,
  hint,
  characterName,
}: AskTheBarModalProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const { speak, stopSpeaking, isSpeaking } = useAudio();
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, isOpen);

  const typingSpeed = 30;

  const completeTyping = useCallback(() => {
    setDisplayedText(hint.text);
    setIsTypingComplete(true);
    stopSpeaking();
  }, [hint.text, stopSpeaking]);

  // Typewriter effect
  useEffect(() => {
    if (!isOpen) return;

    setDisplayedText('');
    setIsTypingComplete(false);

    // Start speaking if voice is available
    if (voiceProfile) {
      speak(hint.text, voiceProfile);
    }

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

    return () => {
      clearInterval(timer);
      stopSpeaking();
    };
  }, [isOpen, hint.text, voiceProfile, speak, stopSpeaking]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleClick = () => {
    if (!isTypingComplete) {
      completeTyping();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ask-bar-title"
      >
        <motion.div
          ref={containerRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-boston-navy border-2 border-boston-gold/50 rounded-xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-southie-blue/50 px-4 py-3 border-b border-boston-cream/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-boston-cream/10 border-2 border-boston-gold/30">
                  {npcPortrait ? (
                    <img
                      src={npcPortrait}
                      alt={npcName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/ui/portrait-placeholder.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-boston-cream/50">
                      ?
                    </div>
                  )}
                </div>
                {/* Speaking indicator */}
                {isSpeaking && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-boston-gold border-2 border-boston-navy"
                  />
                )}
              </div>
              <div>
                <h2 id="ask-bar-title" className="text-boston-gold font-display text-lg">
                  {npcName}
                </h2>
                <p className="text-boston-cream/50 text-xs">Ask the Bar</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div
            className="p-6 cursor-pointer min-h-[150px]"
            onClick={handleClick}
          >
            {characterName && (
              <p className="text-boston-cream/70 text-sm mb-3 italic">
                "{characterName} leans in to ask..."
              </p>
            )}

            <p className="text-boston-cream text-lg leading-relaxed">
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
              <p className="text-boston-cream/40 text-xs mt-4">
                Click to skip animation
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <Button
              variant="primary"
              onClick={onClose}
              className="w-full"
              disabled={!isTypingComplete}
            >
              Got it
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
