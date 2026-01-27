import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Portrait } from '../components';
import { useGame } from '../contexts';
import { playerCharacters } from '../data';
import type { ScreenId } from '../types';

interface CharacterSelectScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export function CharacterSelectScreen({ onNavigate }: CharacterSelectScreenProps) {
  const { selectCharacter } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const characters = Object.values(playerCharacters);
  const selectedCharacter = selectedId ? playerCharacters[selectedId] : null;

  const handleConfirm = () => {
    if (selectedId) {
      selectCharacter(selectedId);
      onNavigate('map');
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-display text-boston-gold mb-2">
          Choose Your O'Brien
        </h1>
        <p className="text-boston-cream/70">
          Each cousin has their own way of handling Boston.
        </p>
      </motion.div>

      {/* Character Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
        {characters.map((char, index) => (
          <motion.button
            key={char.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedId(char.id)}
            className={`
              p-4 rounded-lg border-2 transition-all
              ${selectedId === char.id
                ? 'border-boston-gold bg-boston-gold/10'
                : 'border-boston-cream/20 hover:border-boston-cream/50'}
            `}
          >
            <Portrait
              src={char.portrait}
              name={char.name}
              size="lg"
              className="mx-auto mb-3"
            />
            <h3 className="font-display text-boston-cream text-lg">
              {char.name.split(' ')[0]}
            </h3>
          </motion.button>
        ))}
      </div>

      {/* Selected Character Details */}
      {selectedCharacter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto bg-boston-navy/50 border border-boston-cream/20 rounded-lg p-6 mb-8"
        >
          <h2 className="font-display text-2xl text-boston-gold mb-2">
            {selectedCharacter.name}
          </h2>
          <p className="text-boston-cream/70 mb-4">
            {selectedCharacter.description}
          </p>

          {selectedCharacter.perk && (
            <div className="bg-boston-cream/5 rounded p-3">
              <p className="text-boston-gold text-sm font-medium">
                Perk: {selectedCharacter.perk.name}
              </p>
              <p className="text-boston-cream/70 text-sm">
                {selectedCharacter.perk.description}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Confirm Button */}
      <div className="text-center">
        <Button
          size="lg"
          disabled={!selectedId}
          onClick={handleConfirm}
        >
          Start Game
        </Button>
      </div>

      {/* Back Button */}
      <button
        onClick={() => onNavigate('title')}
        className="absolute top-4 left-4 text-boston-cream/50 hover:text-boston-cream"
      >
        &larr; Back
      </button>
    </div>
  );
}
