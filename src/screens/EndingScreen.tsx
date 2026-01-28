import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Polaroid } from '../components';
import { useGame, useAudio } from '../contexts';
import { polaroids, locations } from '../data';
import type { ScreenId } from '../types';

interface EndingScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export function EndingScreen({ onNavigate }: EndingScreenProps) {
  const { state, endingType, resetGame } = useGame();
  const { playMusic } = useAudio();
  const [showMissedPolaroids, setShowMissedPolaroids] = useState(false);

  // Calculate missed polaroids
  const missedPolaroids = polaroids.filter(p => !state.collectedPolaroids.includes(p.id));
  const missedByLocation = missedPolaroids.reduce((acc, p) => {
    if (!acc[p.location]) acc[p.location] = [];
    acc[p.location].push(p);
    return acc;
  }, {} as Record<string, typeof polaroids>);

  // Play victory music on mount (all endings are victories)
  useEffect(() => {
    playMusic('victory');
  }, [playMusic]);

  const endings = {
    standard: {
      title: "The Southie Standard Lives On",
      description: "The puzzle box clicks open. Inside, the deed to The Southie Standard. The bar is yours now — a piece of Boston history, passed down through the O'Brien line.",
      epilogue: "Brendan sulks in the corner. Maeve has already left. The regulars raise a glass to Sully, and to you.",
      image: "/assets/images/endings/standard.png",
    },
    true: {
      title: "Sully's Final Letter",
      description: "Elena hands you an envelope she found in Sully's pocket the night he died. A letter he never sent — addressed to Mary Catherine.",
      epilogue: "You deliver it yourself. For the first time in twenty years, your aunt reads her brother's words. She cries. You sit with her until morning. Some wounds don't heal — but they can be acknowledged.",
      image: "/assets/images/endings/true.png",
    },
    perfect: {
      title: "One Year Later",
      description: "The Southie Standard is packed. Mary Catherine is behind the bar — she moved back to Boston six months ago. Jerome performs a poem about Sully to a standing ovation.",
      epilogue: "All ten key-holders are here tonight. They share stories you've never heard. Sully wasn't just a bar owner — he was the thread that connected a whole city. And now, that thread runs through you.",
      image: "/assets/images/endings/perfect.png",
    },
  };

  const ending = endings[endingType];

  const handleNewGame = () => {
    resetGame();
    onNavigate('title');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Ending Image */}
      <motion.div
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 2 }}
        className="absolute inset-0"
      >
        <img
          src={ending.image}
          alt={ending.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/50" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="max-w-2xl text-center relative z-10"
      >
        {/* Ending Type Badge */}
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`text-sm uppercase tracking-widest mb-4 ${endingType === 'perfect' ? 'text-boston-gold' :
            endingType === 'true' ? 'text-boston-cream' :
              'text-boston-cream/50'
            }`}
        >
          {endingType === 'perfect' ? 'Perfect Ending' :
            endingType === 'true' ? 'True Ending' :
              'Standard Ending'}
        </motion.p>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="font-display text-4xl md:text-5xl text-boston-gold mb-8"
        >
          {ending.title}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-boston-cream text-lg leading-relaxed mb-6"
        >
          {ending.description}
        </motion.p>

        {/* Epilogue */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-boston-cream/70 italic mb-12"
        >
          {ending.epilogue}
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="grid grid-cols-3 gap-4 mb-12 text-center"
        >
          <div>
            <p className="text-2xl text-boston-gold font-display">{state.score.toLocaleString()}</p>
            <p className="text-boston-cream/50 text-sm">Final Score</p>
          </div>
          <div>
            <p className="text-2xl text-boston-gold font-display">{state.collectedPolaroids.length}/30</p>
            <p className="text-boston-cream/50 text-sm">Polaroids</p>
          </div>
          <div>
            <p className="text-2xl text-boston-gold font-display">{state.gauntletAttempts}</p>
            <p className="text-boston-cream/50 text-sm">Gauntlet Attempts</p>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Button onClick={handleNewGame}>
            Play Again
          </Button>
          <Button variant="outline" onClick={() => onNavigate('collection')}>
            View Polaroids
          </Button>
          {missedPolaroids.length > 0 && (
            <Button variant="outline" onClick={() => setShowMissedPolaroids(true)}>
              Missed Memories ({missedPolaroids.length})
            </Button>
          )}
        </motion.div>

        {/* Credits hint */}
        {endingType !== 'perfect' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4 }}
            className="text-boston-cream/30 text-sm mt-12"
          >
            {endingType === 'standard'
              ? "Collect all 30 polaroids to unlock the True Ending..."
              : "Pass the gauntlet on your first try for the Perfect Ending..."
            }
          </motion.p>
        )}
      </motion.div>

      {/* Missed Polaroids Modal */}
      <AnimatePresence>
        {showMissedPolaroids && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 overflow-y-auto"
            onClick={() => setShowMissedPolaroids(false)}
          >
            <div
              className="min-h-screen p-4 md:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-8 sticky top-0 bg-black/80 backdrop-blur-sm py-4 -mx-4 px-4 md:-mx-8 md:px-8">
                <div>
                  <h2 className="font-display text-2xl md:text-3xl text-boston-gold">
                    Memories You Missed
                  </h2>
                  <p className="text-boston-cream/70">
                    {missedPolaroids.length} polaroid{missedPolaroids.length !== 1 ? 's' : ''} left to discover
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowMissedPolaroids(false)}>
                  Close
                </Button>
              </div>

              {/* Polaroids by Location */}
              {Object.entries(locations).map(([locationId, location]) => {
                const locationMissed = missedByLocation[locationId] || [];
                if (locationMissed.length === 0) return null;

                return (
                  <div key={locationId} className="mb-8">
                    <h3 className="font-display text-xl text-boston-cream mb-4">
                      {location.name}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {locationMissed.map((polaroid, index) => (
                        <motion.div
                          key={polaroid.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Polaroid
                            image={polaroid.image}
                            caption={polaroid.caption}
                            collected={true}
                          />
                          <p className="text-boston-cream/50 text-xs mt-2 text-center italic">
                            {polaroid.title}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
