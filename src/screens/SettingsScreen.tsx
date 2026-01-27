import { Button } from '../components';
import { useAudio } from '../contexts';
import type { ScreenId } from '../types';

interface SettingsScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const {
    audioState,
    setVoiceEnabled,
    setMusicEnabled,
    setSfxEnabled,
    setMasterVolume,
  } = useAudio();

  return (
    <div className="min-h-screen p-8 max-w-md mx-auto bg-boston-navy">
      <h1 className="font-display text-3xl text-boston-gold mb-8 text-center">
        Settings
      </h1>

      {/* Audio Settings */}
      <div className="space-y-6">
        <h2 className="font-display text-xl text-boston-cream">Audio</h2>

        {/* Master Volume */}
        <div>
          <label className="flex justify-between text-boston-cream/70 mb-2">
            <span>Master Volume</span>
            <span>{Math.round(audioState.masterVolume * 100)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={audioState.masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="w-full h-2 bg-boston-cream/20 rounded-lg appearance-none cursor-pointer accent-boston-gold"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-boston-cream/70">Voice Narration</span>
            <input
              type="checkbox"
              checked={audioState.voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
              className="w-5 h-5 accent-boston-gold"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-boston-cream/70">Music</span>
            <input
              type="checkbox"
              checked={audioState.musicEnabled}
              onChange={(e) => setMusicEnabled(e.target.checked)}
              className="w-5 h-5 accent-boston-gold"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-boston-cream/70">Sound Effects</span>
            <input
              type="checkbox"
              checked={audioState.sfxEnabled}
              onChange={(e) => setSfxEnabled(e.target.checked)}
              className="w-5 h-5 accent-boston-gold"
            />
          </label>
        </div>
      </div>

      {/* Game Info */}
      <div className="mt-8 pt-6 border-t border-boston-cream/20">
        <h2 className="font-display text-xl text-boston-cream mb-4">About</h2>
        <p className="text-boston-cream/50 text-sm">
          Wicked Smart: A Boston Trivia Adventure
        </p>
        <p className="text-boston-cream/30 text-xs mt-2">
          Version 1.0.0
        </p>
      </div>

      {/* Back Button */}
      <div className="mt-12 text-center">
        <Button onClick={() => onNavigate('title')}>
          Back to Menu
        </Button>
      </div>
    </div>
  );
}
