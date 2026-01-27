import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components';
import { useAudio, useGame, useRival } from '../contexts';
import { useSaveGame } from '../hooks/useSaveGame';
import type { ScreenId } from '../types';

interface TitleScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export function TitleScreen({ onNavigate }: TitleScreenProps) {
  const { hasSave, deleteSave } = useSaveGame();
  const { playMusic, playSfx } = useAudio();
  const { resetGame } = useGame();
  const { resetRivals } = useRival();
  const saveExists = hasSave();

  // Play title music on mount
  useEffect(() => {
    playMusic('title');
  }, [playMusic]);

  const handleNewGame = () => {
    playSfx('click');
    if (saveExists) {
      // Confirm before overwriting
      if (confirm('This will erase your current progress. Continue?')) {
        deleteSave();
        resetGame();
        resetRivals();
        onNavigate('character_select');
      }
    } else {
      // Reset state even if no save exists (in case of in-memory state from previous game)
      resetGame();
      resetRivals();
      onNavigate('character_select');
    }
  };

  const handleContinue = () => {
    playSfx('click');
    onNavigate('map');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <h1 className="text-6xl md:text-8xl font-display text-boston-gold mb-4">
          Wicked Smaht
        </h1>
        <p className="text-xl text-boston-cream/70 font-body">
          A Boston Trivia Adventure
        </p>
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="text-boston-cream/50 text-center max-w-md mb-12 font-body italic"
      >
        "Your Great-Uncle Sully left you his bar.
        But first, you gotta prove you deserve it."
      </motion.p>

      {/* Menu Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="flex flex-col gap-4 w-full max-w-xs"
      >
        {saveExists && (
          <Button
            size="lg"
            onClick={handleContinue}
            className="w-full"
          >
            Continue
          </Button>
        )}

        <Button
          size="lg"
          variant={saveExists ? 'secondary' : 'primary'}
          onClick={handleNewGame}
          className="w-full"
        >
          New Game
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={() => onNavigate('settings')}
          className="w-full"
        >
          Sound Settings
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-4 text-boston-cream/30 text-sm"
      >
        Made in Boston
      </motion.p>
    </div>
  );
}
