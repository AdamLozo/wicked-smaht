import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { Howl, Howler } from 'howler';
import type { AudioState, VoiceProfile } from '../types';

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

  // Voice synthesis
  speak: (text: string, voiceProfile?: VoiceProfile) => void;
  stopSpeaking: () => void;
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
  const musicRef = useRef<Howl | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Update global Howler volume when master changes
  useEffect(() => {
    Howler.volume(audioState.masterVolume);
  }, [audioState.masterVolume]);

  // ============================================
  // SETTINGS
  // ============================================

  const setVoiceEnabled = useCallback((enabled: boolean) => {
    setAudioState(prev => ({ ...prev, voiceEnabled: enabled }));
    if (!enabled) {
      window.speechSynthesis?.cancel();
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
  // VOICE SYNTHESIS
  // ============================================

  const speak = useCallback((text: string, voiceProfile?: VoiceProfile) => {
    if (!audioState.voiceEnabled || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Apply voice profile if provided
    if (voiceProfile) {
      utterance.rate = voiceProfile.rate;
      utterance.pitch = voiceProfile.pitch;
    }

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.lang.startsWith('en') && v.name.includes('English')
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.volume = audioState.masterVolume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [audioState.voiceEnabled, audioState.masterVolume]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
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

    // Stop current track if different
    if (musicRef.current && currentTrack !== trackName) {
      musicRef.current.stop();
      musicRef.current.unload();
    }

    const path = `/assets/audio/music/${trackName}.mp3`;

    musicRef.current = new Howl({
      src: [path],
      volume: audioState.musicVolume * audioState.masterVolume,
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

    setCurrentTrack(trackName);
    musicRef.current.play();
  }, [audioState.musicEnabled, audioState.musicVolume, audioState.masterVolume, currentTrack]);

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
      if (musicRef.current) {
        musicRef.current.unload();
      }
      window.speechSynthesis?.cancel();
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
    speak,
    stopSpeaking,
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
