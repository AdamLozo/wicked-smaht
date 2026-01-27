import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRival } from '../../contexts';

interface RaceResultOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  result: 'win' | 'loss' | 'tie';
  opponentId: 'brendan' | 'maeve';
  playerTime: number;
  opponentTime: number;
  playerCorrect: boolean;
  opponentCorrect: boolean;
}

export function RaceResultOverlay({
  isOpen,
  onClose,
  result,
  opponentId,
  playerTime,
  opponentTime,
  playerCorrect,
  opponentCorrect,
}: RaceResultOverlayProps) {
  const { state } = useRival();
  const opponent = state.rivals[opponentId];

  // Auto-close after delay
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  const getResultMessage = () => {
    if (result === 'win') {
      if (!opponentCorrect) {
        return `${opponent.name} got it wrong!`;
      }
      return `You were ${((opponentTime - playerTime) / 1000).toFixed(1)}s faster!`;
    }
    if (result === 'loss') {
      if (!playerCorrect) {
        return 'You got it wrong!';
      }
      return `${opponent.name} was ${((playerTime - opponentTime) / 1000).toFixed(1)}s faster!`;
    }
    return 'Neither of you got it right!';
  };

  const getFlavorText = () => {
    if (result === 'win') {
      return opponentId === 'brendan'
        ? [
            '"Dude, how are you so fast?!"',
            '"Alright alright, you got lucky!"',
            '"Fine, you win this round..."',
          ]
        : [
            '"Impressive. I underestimated you."',
            '"Well played. I\'ll get the next one."',
            '"Okay, I see you..."',
          ];
    }
    if (result === 'loss') {
      return opponentId === 'brendan'
        ? [
            '"Let\'s GO! Too easy!"',
            '"Sorry cuz, better luck next time!"',
            '"Brendan: 1, You: 0!"',
          ]
        : [
            '"You\'ll have to be quicker than that."',
            '"Nice try, but not quite."',
            '"I expected more, honestly."',
          ];
    }
    return [
      '"We both whiffed on that one."',
      '"Yikes, neither of us knew that."',
      '"Let\'s just pretend this didn\'t happen."',
    ];
  };

  const flavorTexts = getFlavorText();
  const randomFlavor = flavorTexts[Math.floor(Math.random() * flavorTexts.length)];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, rotateY: -90 }}
            animate={{ scale: 1, rotateY: 0 }}
            exit={{ scale: 0.5, rotateY: 90 }}
            transition={{ type: 'spring', damping: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md"
          >
            {/* Trophy/X animation */}
            <motion.div
              initial={{ scale: 0, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring', damping: 10 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 text-6xl"
            >
              {result === 'win' ? (
                <span className="text-yellow-400 drop-shadow-lg">🏆</span>
              ) : result === 'loss' ? (
                <span className="text-red-400 drop-shadow-lg">💀</span>
              ) : (
                <span className="text-gray-400 drop-shadow-lg">🤷</span>
              )}
            </motion.div>

            {/* Card */}
            <div className={`
              rounded-lg p-6 pt-10 border-2
              ${result === 'win'
                ? 'bg-gradient-to-b from-green-900/90 to-green-950/90 border-green-500'
                : result === 'loss'
                  ? 'bg-gradient-to-b from-red-900/90 to-red-950/90 border-red-500'
                  : 'bg-gradient-to-b from-gray-800/90 to-gray-900/90 border-gray-500'
              }
            `}>
              {/* Result title */}
              <motion.h2
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className={`
                  text-4xl font-display text-center mb-2
                  ${result === 'win' ? 'text-green-400' : result === 'loss' ? 'text-red-400' : 'text-gray-400'}
                `}
              >
                {result === 'win' ? 'VICTORY!' : result === 'loss' ? 'DEFEAT!' : 'DRAW!'}
              </motion.h2>

              {/* Points */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={`
                  text-2xl font-display text-center mb-4
                  ${result === 'win' ? 'text-green-300' : result === 'loss' ? 'text-red-300' : 'text-gray-400'}
                `}
              >
                {result === 'win' && '+100'}
                {result === 'loss' && '-25'}
                {result === 'tie' && '+0'}
              </motion.div>

              {/* Time comparison */}
              <div className="flex items-center justify-center gap-8 mb-4">
                {/* Player */}
                <div className="text-center">
                  <div className={`
                    w-12 h-12 rounded-full mx-auto mb-1 border-2 flex items-center justify-center
                    ${playerCorrect ? 'bg-green-600/50 border-green-400' : 'bg-red-600/50 border-red-400'}
                  `}>
                    {playerCorrect ? '✓' : '✕'}
                  </div>
                  <p className="text-boston-cream text-sm">You</p>
                  <p className="text-boston-gold text-xs">{(playerTime / 1000).toFixed(1)}s</p>
                </div>

                <div className="text-boston-cream/50 text-2xl">vs</div>

                {/* Opponent */}
                <div className="text-center">
                  <div className={`
                    w-12 h-12 rounded-full mx-auto mb-1 border-2 flex items-center justify-center overflow-hidden
                    ${opponentCorrect ? 'bg-green-600/50 border-green-400' : 'bg-red-600/50 border-red-400'}
                  `}>
                    {opponentCorrect ? '✓' : '✕'}
                  </div>
                  <p className={`text-sm ${opponentId === 'brendan' ? 'text-blue-400' : 'text-purple-400'}`}>
                    {opponent.name}
                  </p>
                  <p className={`text-xs ${opponentId === 'brendan' ? 'text-blue-300' : 'text-purple-300'}`}>
                    {(opponentTime / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>

              {/* Result message */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center text-boston-cream mb-3"
              >
                {getResultMessage()}
              </motion.p>

              {/* Flavor text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className={`
                  text-center text-sm italic
                  ${opponentId === 'brendan' ? 'text-blue-300/70' : 'text-purple-300/70'}
                `}
              >
                {randomFlavor}
              </motion.p>
            </div>

            {/* Click to continue */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: 2, repeat: Infinity, duration: 1.5 }}
              className="text-center text-boston-cream/50 text-xs mt-4"
            >
              Click anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
