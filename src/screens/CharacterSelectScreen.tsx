import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Portrait } from '../components';
import { useGame, useAudio } from '../contexts';
import { playerCharacters } from '../data';
import type { ScreenId, DifficultyLevel } from '../types';

interface CharacterSelectScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export function CharacterSelectScreen({ onNavigate }: CharacterSelectScreenProps) {
  const { selectCharacter, setDifficulty } = useGame();
  const { playSfx } = useAudio();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('local');

  const characters = Object.values(playerCharacters);
  const selectedCharacter = selectedId ? playerCharacters[selectedId] : null;

  const handleConfirm = () => {
    if (selectedId) {
      playSfx('click');
      selectCharacter(selectedId);
      setDifficulty(selectedDifficulty);
      onNavigate('map');
    }
  };

  const handleDifficultyToggle = (difficulty: DifficultyLevel) => {
    playSfx('click');
    setSelectedDifficulty(difficulty);
  };

  const handleCharacterSelect = (charId: string) => {
    playSfx('click');
    setSelectedId(charId);
  };

  return (
    <div className="min-h-screen p-8 overflow-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-4xl font-display text-boston-gold mb-2">
          Choose Your O'Brien
        </h1>
        <p className="text-boston-cream/70">
          Each cousin has their own way of handling Boston.
        </p>
      </motion.div>

      {/* Difficulty Selection - Moved to top for visibility */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-md mx-auto mb-6"
      >
        <h3 className="text-center text-boston-cream/70 mb-3 font-body text-sm">
          How well do you know Boston?
        </h3>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => handleDifficultyToggle('novice')}
            className={`
              px-4 py-2 rounded-lg border-2 transition-all font-body
              ${selectedDifficulty === 'novice'
                ? 'border-boston-gold bg-boston-gold/20 text-boston-gold'
                : 'border-boston-cream/30 text-boston-cream/70 hover:border-boston-cream/50'}
            `}
          >
            <span className="block font-display text-base">Novice</span>
            <span className="text-xs opacity-70">Extra time</span>
          </button>
          <button
            onClick={() => handleDifficultyToggle('local')}
            className={`
              px-4 py-2 rounded-lg border-2 transition-all font-body
              ${selectedDifficulty === 'local'
                ? 'border-boston-gold bg-boston-gold/20 text-boston-gold'
                : 'border-boston-cream/30 text-boston-cream/70 hover:border-boston-cream/50'}
            `}
          >
            <span className="block font-display text-base">From Boston</span>
            <span className="text-xs opacity-70">Standard</span>
          </button>
        </div>
      </motion.div>

      {/* Character Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
        {characters.map((char, index) => (
          <motion.button
            key={char.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleCharacterSelect(char.id)}
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
