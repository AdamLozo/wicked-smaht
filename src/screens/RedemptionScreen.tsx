import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Button,
  PronunciationGame,
  MemoryMatchGame,
  SpeedNamingGame,
  UnscrambleGame,
  TimelineGame,
  SpotErrorsGame,
  MatchGame,
  QuoteCompletionGame,
  PhotoIdGame,
  RapidFireGame,
} from '../components';
import { useGame } from '../contexts';
import { useSFX } from '../hooks';
import { locations, npcs } from '../data';
import type { ScreenId, RedemptionType } from '../types';

interface RedemptionScreenProps {
  onNavigate: (screen: ScreenId, data?: Record<string, unknown>) => void;
  data: Record<string, unknown>;
}

export function RedemptionScreen({ onNavigate, data }: RedemptionScreenProps) {
  const locationId = data.locationId as string;
  const location = locations[locationId];
  const npc = npcs[location.npc];
  const { completeLocation, addScore } = useGame();
  const { play: playSFX } = useSFX();

  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [passed, setPassed] = useState<boolean | null>(null);
  const [earnedScore, setEarnedScore] = useState(0);

  const handleGameComplete = useCallback((success: boolean, score: number) => {
    setPassed(success);
    setEarnedScore(score);
    setPhase('result');

    // Play appropriate SFX
    playSFX(success ? 'key_get' : 'wrong');

    if (success) {
      addScore(score);
      setTimeout(() => {
        completeLocation(locationId, true);
        onNavigate('map');
      }, 3000);
    }
  }, [addScore, completeLocation, locationId, onNavigate, playSFX]);

  const redemptionInfo: Record<RedemptionType, { title: string; description: string }> = {
    pronunciation: {
      title: "Say It Like a Local",
      description: "Prove you can pronounce Boston street names without embarrassing yourself."
    },
    memory_match: {
      title: "Pasta Memory",
      description: "Match the pasta shapes. Enzo's testing your North End credentials."
    },
    speed_naming: {
      title: "Red Sox Speed Round",
      description: "Name 7 Red Sox players in 30 seconds. Any era counts."
    },
    unscramble: {
      title: "Governor Scramble",
      description: "Unscramble these Massachusetts governors' names."
    },
    timeline: {
      title: "Revolutionary Timeline",
      description: "Put these Revolutionary War events in chronological order."
    },
    spot_errors: {
      title: "Architectural Eye",
      description: "Find the mistakes in these building descriptions."
    },
    match_game: {
      title: "Harvard or MIT?",
      description: "Match these discoveries and inventions to the right school."
    },
    quote_completion: {
      title: "Kennedy Quotes",
      description: "Complete these famous JFK quotes."
    },
    photo_id: {
      title: "Freedom Trail Photo ID",
      description: "Name these Freedom Trail landmarks from photos."
    },
    rapid_fire: {
      title: "Boston Rapid Fire",
      description: "Mixed questions from all neighborhoods. No mercy."
    },
  };

  const info = redemptionInfo[location.redemptionType];

  // Render the appropriate game based on redemption type
  const renderGame = () => {
    switch (location.redemptionType) {
      case 'pronunciation':
        return (
          <PronunciationGame
            onComplete={handleGameComplete}
            requiredCorrect={4}
            totalRounds={5}
          />
        );
      case 'memory_match':
        return (
          <MemoryMatchGame
            onComplete={handleGameComplete}
            requiredMatches={4}
            timeLimit={60}
          />
        );
      case 'speed_naming':
        return (
          <SpeedNamingGame
            onComplete={handleGameComplete}
            requiredCount={7}
            timeLimit={30}
          />
        );
      case 'unscramble':
        return (
          <UnscrambleGame
            onComplete={handleGameComplete}
            requiredCorrect={4}
            totalRounds={5}
          />
        );
      case 'timeline':
        return (
          <TimelineGame
            onComplete={handleGameComplete}
            requiredCorrect={2}
          />
        );
      case 'spot_errors':
        return (
          <SpotErrorsGame
            onComplete={handleGameComplete}
            requiredCorrect={3}
          />
        );
      case 'match_game':
        return (
          <MatchGame
            onComplete={handleGameComplete}
            requiredCorrect={5}
          />
        );
      case 'quote_completion':
        return (
          <QuoteCompletionGame
            onComplete={handleGameComplete}
            requiredCorrect={4}
            totalRounds={6}
          />
        );
      case 'photo_id':
        return (
          <PhotoIdGame
            onComplete={handleGameComplete}
            requiredCorrect={5}
            totalRounds={7}
          />
        );
      case 'rapid_fire':
        return (
          <RapidFireGame
            onComplete={handleGameComplete}
            requiredCorrect={8}
            timeLimit={60}
          />
        );
      default:
        return null;
    }
  };

  // Intro phase
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-boston-navy">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <h1 className="font-display text-3xl text-boston-gold mb-2">
            Redemption Challenge
          </h1>
          <p className="text-boston-cream/50 mb-6">{location.name}</p>

          <div className="bg-boston-navy/50 border border-boston-cream/20 rounded-lg p-6 mb-6">
            <h2 className="font-display text-xl text-boston-cream mb-2">
              {info.title}
            </h2>
            <p className="text-boston-cream/70 mb-4">
              {info.description}
            </p>
            <p className="text-boston-cream/50 text-sm italic">
              "{npc.name}: One more chance, kid. Don't waste it."
            </p>
          </div>

          <Button size="lg" onClick={() => setPhase('playing')}>
            Begin Challenge
          </Button>
        </motion.div>

        <button
          onClick={() => onNavigate('map')}
          className="absolute top-4 left-4 text-boston-cream/50 hover:text-boston-cream"
        >
          &larr; Back to Map
        </button>
      </div>
    );
  }

  // Playing phase
  if (phase === 'playing') {
    return (
      <div className="min-h-screen flex flex-col p-8 bg-boston-navy">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl text-boston-gold">{info.title}</h1>
          <p className="text-boston-cream/50">{location.name} Redemption</p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          {renderGame()}
        </div>

        <button
          onClick={() => onNavigate('map')}
          className="absolute top-4 left-4 text-boston-cream/50 hover:text-boston-cream"
        >
          &larr; Forfeit
        </button>
      </div>
    );
  }

  // Result phase
  return (
    <div className="min-h-screen flex items-center justify-center bg-boston-navy">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-md"
      >
        {passed ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-8xl mb-4"
            >
              🔑
            </motion.div>
            <h2 className="font-display text-3xl text-green-400 mb-2">
              Redemption Earned!
            </h2>
            <p className="text-boston-cream/70 mb-2">
              +{earnedScore} points
            </p>
            <p className="text-boston-cream/50 italic">
              "{npc.name}: Alright, you earned it. Here's your key."
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4 opacity-50">✗</div>
            <h2 className="font-display text-2xl text-red-400 mb-2">
              Not This Time
            </h2>
            <p className="text-boston-cream/50 italic mb-6">
              "{npc.name}: Maybe next time, kid."
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => {
                setPhase('intro');
                setPassed(null);
                setEarnedScore(0);
              }}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => onNavigate('map')}>
                Return to Map
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
