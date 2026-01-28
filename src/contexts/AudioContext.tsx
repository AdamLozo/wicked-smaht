import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { Howl, Howler } from 'howler';
import type { AudioState } from '../types';

// ============================================
// INITIAL STATE
// ============================================

const initialAudioState: AudioState = {
  voiceEnabled: true,
  musicEnabled: true,
  sfxEnabled: true,
  masterVolume: 0.8,
  musicVolume: 0.6,
  sfxVolume: 0.8,
};

// ============================================
// SOUND EFFECT DEFINITIONS
// ============================================

const SFX_PATHS = {
  correct: '/assets/audio/sfx/correct.mp3',
  wrong: '/assets/audio/sfx/wrong.mp3',
  keyGet: '/assets/audio/sfx/key_get.mp3',
  click: '/assets/audio/sfx/click.mp3',
  timerTick: '/assets/audio/sfx/timer_tick.mp3',
  timerWarning: '/assets/audio/sfx/timer_warning.mp3',
  polaroid: '/assets/audio/sfx/polaroid.mp3',
  success: '/assets/audio/sfx/success.mp3',
  failure: '/assets/audio/sfx/failure.mp3',
} as const;

type SfxName = keyof typeof SFX_PATHS;

// ============================================
// VOICE FILE PATH HELPERS
// ============================================

const VOICE_BASE_PATH = '/assets/audio/voice';

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
  tommy: 'tommy',
  trish: 'trish',
  eddie: 'eddie',
  miles: 'miles',
  simon: 'simon',
  mary_catherine: 'mary_catherine',
  jerome: 'jerome',
  elena: 'elena',
  shared_npc: 'npc',
};

function getVoiceFilePath(character: string, filename: string): string {
  const folder = CHARACTER_FOLDERS[character.toLowerCase()] || character.toLowerCase();
  return `${VOICE_BASE_PATH}/${folder}/${filename}`;
}

// ============================================
// CONTEXT VALUE TYPE
// ============================================

interface AudioContextValue {
  audioState: AudioState;

  // Settings
  setVoiceEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setSfxEnabled: (enabled: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;

  // Sound effects
  playSfx: (name: SfxName) => void;

  // Voice (pre-recorded files)
  playVoice: (character: string, filename: string) => Promise<void>;
  stopVoice: () => void;
  isSpeaking: boolean;

  // Music
  playMusic: (trackName: string) => void;
  stopMusic: () => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
  isMusicPlaying: boolean;
  currentTrack: string | null;
}

const AudioContext = createContext<AudioContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface AudioProviderProps {
  children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [audioState, setAudioState] = useState<AudioState>(initialAudioState);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);

  // Refs for audio instances
  const sfxCache = useRef<Map<string, Howl>>(new Map());
  const voiceCache = useRef<Map<string, Howl>>(new Map());
  const currentVoiceRef = useRef<Howl | null>(null);
  const musicRef = useRef<Howl | null>(null);

  // Update global Howler volume when master changes
  useEffect(() => {
    Howler.volume(audioState.masterVolume);
  }, [audioState.masterVolume]);

  // ============================================
  // SETTINGS
  // ============================================

  const setVoiceEnabled = useCallback((enabled: boolean) => {
    setAudioState(prev => ({ ...prev, voiceEnabled: enabled }));
    if (!enabled && currentVoiceRef.current) {
      currentVoiceRef.current.stop();
      setIsSpeaking(false);
    }
  }, []);

  const setMusicEnabled = useCallback((enabled: boolean) => {
    setAudioState(prev => ({ ...prev, musicEnabled: enabled }));
    if (!enabled && musicRef.current) {
      musicRef.current.pause();
      setIsMusicPlaying(false);
    } else if (enabled && musicRef.current && currentTrack) {
      musicRef.current.play();
      setIsMusicPlaying(true);
    }
  }, [currentTrack]);

  const setSfxEnabled = useCallback((enabled: boolean) => {
    setAudioState(prev => ({ ...prev, sfxEnabled: enabled }));
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    setAudioState(prev => ({ ...prev, masterVolume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setAudioState(prev => ({ ...prev, musicVolume: clampedVolume }));
    if (musicRef.current) {
      musicRef.current.volume(clampedVolume * audioState.masterVolume);
    }
  }, [audioState.masterVolume]);

  const setSfxVolume = useCallback((volume: number) => {
    setAudioState(prev => ({ ...prev, sfxVolume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  // ============================================
  // SOUND EFFECTS
  // ============================================

  const playSfx = useCallback((name: SfxName) => {
    if (!audioState.sfxEnabled) return;

    const path = SFX_PATHS[name];
    if (!path) return;

    // Check cache or create new Howl
    let sound = sfxCache.current.get(name);
    if (!sound) {
      sound = new Howl({
        src: [path],
        volume: audioState.sfxVolume * audioState.masterVolume,
        preload: true,
      });
      sfxCache.current.set(name, sound);
    } else {
      // Update volume in case it changed
      sound.volume(audioState.sfxVolume * audioState.masterVolume);
    }

    sound.play();
  }, [audioState.sfxEnabled, audioState.sfxVolume, audioState.masterVolume]);

  // ============================================
  // VOICE (PRE-RECORDED FILES)
  // ============================================

  const playVoice = useCallback((character: string, filename: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioState.voiceEnabled) {
        resolve();
        return;
      }

      // Stop any currently playing voice
      if (currentVoiceRef.current) {
        currentVoiceRef.current.stop();
        currentVoiceRef.current = null;
      }

      const filePath = getVoiceFilePath(character, filename);

      // Check cache first
      let sound = voiceCache.current.get(filePath);

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
            resolve(); // Resolve instead of reject to avoid breaking game flow
          },
        });

        // Cache the sound for reuse
        voiceCache.current.set(filePath, sound);
      } else {
        // Update volume on cached sound
        sound.volume(audioState.masterVolume);
        sound.off('end');
        sound.on('end', () => {
          setIsSpeaking(false);
          resolve();
        });
      }

      currentVoiceRef.current = sound;
      setIsSpeaking(true);
      sound.play();
    });
  }, [audioState.voiceEnabled, audioState.masterVolume]);

  const stopVoice = useCallback(() => {
    if (currentVoiceRef.current) {
      currentVoiceRef.current.stop();
      currentVoiceRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // ============================================
  // MUSIC
  // ============================================

  const playMusic = useCallback((trackName: string) => {
    if (!audioState.musicEnabled) {
      setCurrentTrack(trackName);
      return;
    }

    // If same track is already playing, do nothing
    if (currentTrack === trackName && musicRef.current && isMusicPlaying) {
      return;
    }

    // Stop and cleanup current track with fade out
    if (musicRef.current) {
      const oldMusic = musicRef.current;
      oldMusic.fade(oldMusic.volume(), 0, 500);
      setTimeout(() => {
        oldMusic.stop();
        oldMusic.unload();
      }, 500);
      musicRef.current = null;
    }

    const path = `/assets/audio/music/${trackName}.mp3`;
    const targetVolume = audioState.musicVolume * audioState.masterVolume;

    const newMusic = new Howl({
      src: [path],
      volume: 0, // Start silent for fade in
      loop: true,
      preload: true,
      onplay: () => setIsMusicPlaying(true),
      onpause: () => setIsMusicPlaying(false),
      onstop: () => setIsMusicPlaying(false),
      onend: () => {
        // Loop is enabled, this shouldn't fire normally
        setIsMusicPlaying(false);
      },
    });

    musicRef.current = newMusic;
    setCurrentTrack(trackName);

    // Fade in after a short delay to let old track fade out
    setTimeout(() => {
      if (musicRef.current === newMusic) {
        newMusic.play();
        newMusic.fade(0, targetVolume, 500);
      }
    }, 300);
  }, [audioState.musicEnabled, audioState.musicVolume, audioState.masterVolume, currentTrack, isMusicPlaying]);

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.stop();
      musicRef.current.unload();
      musicRef.current = null;
    }
    setCurrentTrack(null);
    setIsMusicPlaying(false);
  }, []);

  const pauseMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
    }
  }, []);

  const resumeMusic = useCallback(() => {
    if (musicRef.current && audioState.musicEnabled) {
      musicRef.current.play();
    }
  }, [audioState.musicEnabled]);

  // ============================================
  // CLEANUP
  // ============================================

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      sfxCache.current.forEach(sound => sound.unload());
      sfxCache.current.clear();
      voiceCache.current.forEach(sound => sound.unload());
      voiceCache.current.clear();
      if (currentVoiceRef.current) {
        currentVoiceRef.current.unload();
      }
      if (musicRef.current) {
        musicRef.current.unload();
      }
    };
  }, []);

  // ============================================
  // VALUE
  // ============================================

  const value: AudioContextValue = {
    audioState,
    setVoiceEnabled,
    setMusicEnabled,
    setSfxEnabled,
    setMasterVolume,
    setMusicVolume,
    setSfxVolume,
    playSfx,
    playVoice,
    stopVoice,
    isSpeaking,
    playMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    isMusicPlaying,
    currentTrack,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
