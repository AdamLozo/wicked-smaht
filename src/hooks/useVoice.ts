import { useState, useCallback, useRef, useEffect } from 'react';
import { Howl } from 'howler';
import { useAudio } from '../contexts';

// Base path for voice files
const VOICE_BASE_PATH = '/assets/audio/voice';

// Character folder mapping
const CHARACTER_FOLDERS: Record<string, string> = {
  sully: 'sully',
  brendan: 'brendan',
  maeve: 'maeve',
  danny: 'danny',
  colleen: 'colleen',
  fitz: 'fitz',
  meg: 'meg',
  rita: 'rita',
  enzo: 'enzo',
  tommy: 'npc',
  trish: 'npc',
  eddie: 'npc',
  miles: 'npc',
  simon: 'npc',
  mary_catherine: 'npc',
  jerome: 'npc',
  elena: 'npc',
  shared_npc: 'npc',
};

export function useVoice() {
  const { audioState } = useAudio();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentSoundRef = useRef<Howl | null>(null);
  const soundCacheRef = useRef<Map<string, Howl>>(new Map());

  // Update volume on existing sounds when master volume changes
  useEffect(() => {
    if (currentSoundRef.current && currentSoundRef.current.playing()) {
      currentSoundRef.current.volume(audioState.masterVolume);
    }
  }, [audioState.masterVolume]);

  // Build the file path for a voice line
  const getVoiceFilePath = useCallback((character: string, filename: string): string => {
    const folder = CHARACTER_FOLDERS[character.toLowerCase()] || character.toLowerCase();
    return `${VOICE_BASE_PATH}/${folder}/${filename}`;
  }, []);

  // Play a specific voice file
  const playVoiceFile = useCallback((character: string, filename: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioState.voiceEnabled) {
        resolve();
        return;
      }

      // Stop any currently playing voice
      if (currentSoundRef.current) {
        currentSoundRef.current.stop();
        currentSoundRef.current = null;
      }

      const filePath = getVoiceFilePath(character, filename);

      // Check cache first
      let sound = soundCacheRef.current.get(filePath);

      if (!sound) {
        sound = new Howl({
          src: [filePath],
          volume: audioState.masterVolume,
          onend: () => {
            setIsSpeaking(false);
            resolve();
          },
          onloaderror: () => {
            console.warn(`Failed to load voice file: ${filePath}`);
            setIsSpeaking(false);
            resolve(); // Resolve to avoid breaking game flow
          },
        });

        // Cache the sound for reuse
        soundCacheRef.current.set(filePath, sound);
      } else {
        // Update volume on cached sound
        sound.volume(audioState.masterVolume);
        sound.off('end');
        sound.on('end', () => {
          setIsSpeaking(false);
          resolve();
        });
      }

      currentSoundRef.current = sound;
      setIsSpeaking(true);
      sound.play();
    });
  }, [audioState.voiceEnabled, audioState.masterVolume, getVoiceFilePath]);

  // Play a hint voice line (Sully's hints)
  const playHint = useCallback((locationId: string, questionId: string): Promise<void> => {
    const filename = `sully_hint_${locationId}_q${questionId}.mp3`;
    return playVoiceFile('sully', filename);
  }, [playVoiceFile]);

  // Play NPC reaction (correct/wrong answer)
  const playNpcReaction = useCallback((character: string, locationId: string, questionId: string, isCorrect: boolean): Promise<void> => {
    const result = isCorrect ? 'correct' : 'wrong';
    const filename = `${character.toLowerCase()}_reaction_${locationId}_q${questionId}_${result}.mp3`;
    return playVoiceFile(character, filename);
  }, [playVoiceFile]);

  // Play rival dialogue (Brendan or Maeve)
  const playRivalLine = useCallback((rival: 'brendan' | 'maeve', category: string, variant?: number): Promise<void> => {
    const variantSuffix = variant !== undefined ? `_${variant}` : '';
    const filename = `${rival}_${category}${variantSuffix}.mp3`;
    return playVoiceFile(rival, filename);
  }, [playVoiceFile]);

  // Play player intro line
  const playPlayerIntro = useCallback((character: string): Promise<void> => {
    const filename = `${character.toLowerCase()}_intro.mp3`;
    return playVoiceFile(character, filename);
  }, [playVoiceFile]);

  // Play shared NPC line
  const playSharedNpcLine = useCallback((lineId: string): Promise<void> => {
    const filename = `npc_shared_${lineId}.mp3`;
    return playVoiceFile('shared_npc', filename);
  }, [playVoiceFile]);

  // Play Sully gauntlet line
  const playSullyGauntlet = useCallback((category: string, variant?: number): Promise<void> => {
    const variantSuffix = variant !== undefined ? `_${variant}` : '';
    const filename = `sully_gauntlet_${category}${variantSuffix}.mp3`;
    return playVoiceFile('sully', filename);
  }, [playVoiceFile]);

  // Generic play by filename (for custom cases)
  const playByFilename = useCallback((character: string, filename: string): Promise<void> => {
    return playVoiceFile(character, filename);
  }, [playVoiceFile]);

  // Stop any currently playing voice
  const stop = useCallback(() => {
    if (currentSoundRef.current) {
      currentSoundRef.current.stop();
      currentSoundRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // Preload voice files for a character/category
  const preload = useCallback((filePaths: string[]) => {
    filePaths.forEach(filePath => {
      if (!soundCacheRef.current.has(filePath)) {
        const sound = new Howl({
          src: [filePath],
          preload: true,
        });
        soundCacheRef.current.set(filePath, sound);
      }
    });
  }, []);

  // Clear cache (useful for memory management)
  const clearCache = useCallback(() => {
    soundCacheRef.current.forEach(sound => sound.unload());
    soundCacheRef.current.clear();
  }, []);

  return {
    isSpeaking,
    // Specific play functions
    playHint,
    playNpcReaction,
    playRivalLine,
    playPlayerIntro,
    playSharedNpcLine,
    playSullyGauntlet,
    // Generic play
    playByFilename,
    // Control
    stop,
    preload,
    clearCache,
  };
}
