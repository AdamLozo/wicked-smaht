import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts';
import { Portrait } from './Portrait';

interface DialogueBoxProps {
  speakerName: string;
  speakerPortrait?: string;
  speakerId?: string; // Character ID for voice file lookup
  text: string;
  audioFile?: string; // Voice file to play
  onComplete?: () => void;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
  showContinuePrompt?: boolean;
  typingSpeed?: number;
}

export function DialogueBox({
  speakerName,
  speakerPortrait,
  speakerId,
  text,
  audioFile,
  onComplete,
  autoAdvance = false,
  autoAdvanceDelay = 2000,
  showContinuePrompt = true,
  typingSpeed = 30,
}: DialogueBoxProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const { playVoice, stopVoice, isSpeaking } = useAudio();

  const completeTyping = useCallback(() => {
    setDisplayedText(text);
    setIsComplete(true);
    stopVoice();
  }, [text, stopVoice]);

  // Typewriter effect
  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);

    // Start playing voice file if available
    if (audioFile && speakerId) {
      playVoice(speakerId, audioFile);
    }

    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
      }
    }, typingSpeed);

    return () => {
      clearInterval(timer);
      stopVoice();
    };
  }, [text, typingSpeed, audioFile, speakerId, playVoice, stopVoice]);

  // Auto-advance after both typing AND voice are complete
  useEffect(() => {
    if (isComplete && !isSpeaking && autoAdvance && onComplete) {
      const timer = setTimeout(onComplete, autoAdvanceDelay);
      return () => clearTimeout(timer);
    }
  }, [isComplete, isSpeaking, autoAdvance, autoAdvanceDelay, onComplete]);

  const handleClick = () => {
    if (!isComplete) {
      completeTyping();
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onClick={handleClick}
      className="bg-boston-navy/90 border border-boston-cream/30 rounded-lg p-4 cursor-pointer"
    >
      <div className="flex gap-4">
        {/* Portrait */}
        <Portrait
          src={speakerPortrait}
          name={speakerName}
          size="sm"
          speaking={!isComplete}
        />

        {/* Content */}
        <div className="flex-1">
          <h4 className="text-boston-gold font-bold mb-1">{speakerName}</h4>
          <p className="text-boston-cream leading-relaxed">
            {displayedText}
            {!isComplete && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                |
              </motion.span>
            )}
          </p>
        </div>
      </div>

      {/* Continue prompt */}
      <AnimatePresence>
        {isComplete && showContinuePrompt && !autoAdvance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-right"
          >
            <span className="text-boston-cream/50 text-sm">
              Click to continue
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="inline-block ml-1"
              >
                →
              </motion.span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="absolute top-2 right-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
            className="w-2 h-2 rounded-full bg-boston-gold"
          />
        </div>
      )}
    </motion.div>
  );
}
