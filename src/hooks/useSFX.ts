import { useCallback, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { useAudio } from '../contexts';

const SFX_FILES = {
  correct: '/assets/audio/sfx/correct.mp3',
  wrong: '/assets/audio/sfx/wrong.mp3',
  key_get: '/assets/audio/sfx/key_get.mp3',
  polaroid: '/assets/audio/sfx/polaroid.mp3',
  timer_tick: '/assets/audio/sfx/timer_tick.mp3',
  timer_end: '/assets/audio/sfx/timer_end.mp3',
  unlock: '/assets/audio/sfx/unlock.mp3',
  notification: '/assets/audio/sfx/notification.mp3',
};

type SFXId = keyof typeof SFX_FILES;

export function useSFX() {
  const { audioState } = useAudio();
  const soundsRef = useRef<Record<string, Howl>>({});
  const loadedRef = useRef(false);

  // Preload sounds
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    Object.entries(SFX_FILES).forEach(([id, src]) => {
      soundsRef.current[id] = new Howl({
        src: [src],
        preload: true,
        volume: audioState.sfxVolume * audioState.masterVolume,
        onloaderror: () => {
          console.warn(`Failed to load SFX: ${src}`);
        }
      });
    });

    return () => {
      Object.values(soundsRef.current).forEach(sound => sound.unload());
    };
  }, []);

  // Update volumes when settings change
  useEffect(() => {
    Object.values(soundsRef.current).forEach(sound => {
      sound.volume(audioState.sfxVolume * audioState.masterVolume);
    });
  }, [audioState.sfxVolume, audioState.masterVolume]);

  const play = useCallback((id: SFXId) => {
    if (!audioState.sfxEnabled) return;
    soundsRef.current[id]?.play();
  }, [audioState.sfxEnabled]);

  return { play };
}
