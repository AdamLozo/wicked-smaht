import { useEffect } from 'react';
import { useGame } from '../contexts';

// Rival progression based on game time and location difficulty
const RIVAL_SPEEDS = {
  brendan: {
    base: 1.2, // Faster early
    intellectualPenalty: ['cambridge', 'back_bay', 'beacon_hill'], // Slows here
  },
  maeve: {
    base: 1.0, // Steady
    authenticityPenalty: ['southie', 'dorchester', 'charlestown'], // Struggles here
  },
};

const LOCATION_SCORES: Record<string, number> = {
  southie: 400,
  north_end: 450,
  fenway: 420,
  beacon_hill: 500,
  charlestown: 380,
  back_bay: 520,
  cambridge: 550,
  dorchester: 480,
  downtown: 440,
  seaport: 600,
};

export function useRivalAI() {
  const { state, updateRivalScore } = useGame();

  useEffect(() => {
    // Update rival scores when player completes a location
    const playerProgress = state.completedLocations.length;

    if (playerProgress === 0) return;

    // Simulate rival progress
    // Brendan: rushes ahead, makes mistakes at intellectual locations
    const brendanLocations = Math.min(
      playerProgress + Math.floor(Math.random() * 2),
      10
    );
    let brendanScore = 0;
    Object.keys(LOCATION_SCORES).slice(0, brendanLocations).forEach(loc => {
      let score = LOCATION_SCORES[loc];
      if (RIVAL_SPEEDS.brendan.intellectualPenalty.includes(loc)) {
        score *= 0.6; // Performs worse
      }
      brendanScore += score * (0.7 + Math.random() * 0.3);
    });

    // Maeve: steady pace, struggles at authenticity locations
    const maeveLocations = Math.min(playerProgress, 10);
    let maeveScore = 0;
    Object.keys(LOCATION_SCORES).slice(0, maeveLocations).forEach(loc => {
      let score = LOCATION_SCORES[loc];
      if (RIVAL_SPEEDS.maeve.authenticityPenalty.includes(loc)) {
        score *= 0.7;
      }
      maeveScore += score * (0.8 + Math.random() * 0.2);
    });

    updateRivalScore('brendan', Math.round(brendanScore));
    updateRivalScore('maeve', Math.round(maeveScore));
  }, [state.completedLocations.length, updateRivalScore]);

  return {
    brendanScore: state.rivalScores.brendan,
    maeveScore: state.rivalScores.maeve,
  };
}
