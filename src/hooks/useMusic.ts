import { useCallback, useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';
import { useAudio } from '../contexts';

const MUSIC_TRACKS = {
  title: '/assets/audio/music/title.mp3',
  map: '/assets/audio/music/map.mp3',
  southie: '/assets/audio/music/southie.mp3',
  north_end: '/assets/audio/music/north_end.mp3',
  fenway: '/assets/audio/music/fenway.mp3',
  beacon_hill: '/assets/audio/music/beacon_hill.mp3',
  charlestown: '/assets/audio/music/charlestown.mp3',
  back_bay: '/assets/audio/music/back_bay.mp3',
  cambridge: '/assets/audio/music/cambridge.mp3',
  dorchester: '/assets/audio/music/dorchester.mp3',
  downtown: '/assets/audio/music/downtown.mp3',
  seaport: '/assets/audio/music/seaport.mp3',
  gauntlet: '/assets/audio/music/gauntlet.mp3',
  ending: '/assets/audio/music/ending.mp3',
};

type TrackId = keyof typeof MUSIC_TRACKS;

export function useMusic() {
  const { audioState } = useAudio();
  const currentTrackRef = useRef<Howl | null>(null);
  const currentIdRef = useRef<string | null>(null);

  // Update volume when settings change
  useEffect(() => {
    Howler.volume(audioState.musicVolume * audioState.masterVolume);
  }, [audioState.musicVolume, audioState.masterVolume]);

  const play = useCallback((trackId: TrackId) => {
    if (!audioState.musicEnabled) return;
    if (currentIdRef.current === trackId) return; // Already playing

    // Fade out current
    if (currentTrackRef.current) {
      const oldTrack = currentTrackRef.current;
      oldTrack.fade(oldTrack.volume(), 0, 500);
      setTimeout(() => oldTrack.unload(), 500);
    }

    // Start new track
    const track = new Howl({
      src: [MUSIC_TRACKS[trackId]],
      loop: true,
      volume: 0,
      onloaderror: () => {
        console.warn(`Failed to load music: ${MUSIC_TRACKS[trackId]}`);
      }
    });

    track.play();
    track.fade(0, audioState.musicVolume * audioState.masterVolume, 500);

    currentTrackRef.current = track;
    currentIdRef.current = trackId;
  }, [audioState.musicEnabled, audioState.musicVolume, audioState.masterVolume]);

  const stop = useCallback(() => {
    if (currentTrackRef.current) {
      currentTrackRef.current.fade(currentTrackRef.current.volume(), 0, 500);
      setTimeout(() => {
        currentTrackRef.current?.unload();
        currentTrackRef.current = null;
        currentIdRef.current = null;
      }, 500);
    }
  }, []);

  return { play, stop };
}
