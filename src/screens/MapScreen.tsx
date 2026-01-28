import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, ScoreDisplay, RivalIndicator, RivalProgressPanel, StealOpportunityBadge } from '../components';
import { StealSelectionModal } from '../components/rivals/StealChallengeScreen';
import { FamilyGroupChat } from '../components/rivals/FamilyGroupChat';
import { useGame, useRival, useAudio } from '../contexts';
import { locations, getUnlockedLocations } from '../data';
import type { ScreenId } from '../types';

interface MapScreenProps {
  onNavigate: (screen: ScreenId, data?: Record<string, unknown>) => void;
}

// Location positions on map (percentage-based)
// Adjusted to match the vintage Boston map image
// x: 0 = left edge, 100 = right edge
// y: 0 = top edge, 100 = bottom edge
const locationPositions: Record<string, { x: number; y: number; labelOffset?: 'left' | 'right' }> = {
  cambridge: { x: 38, y: 18 },           // North of Charles River, Harvard/MIT area
  charlestown: { x: 52, y: 22 },         // Northeast, across Inner Harbor
  north_end: { x: 55, y: 35 },           // The peninsula jutting into harbor
  beacon_hill: { x: 45, y: 38, labelOffset: 'left' },  // West of downtown, near State House
  downtown: { x: 50, y: 42, labelOffset: 'right' },    // Central Boston
  back_bay: { x: 38, y: 45 },            // West of downtown, grid pattern area
  fenway: { x: 28, y: 42 },              // Far west - the green park area visible
  seaport: { x: 58, y: 55 },             // Southeast waterfront
  southie: { x: 68, y: 62 },             // South Boston peninsula
  dorchester: { x: 58, y: 78 },          // South - large area at bottom
};

export function MapScreen({ onNavigate }: MapScreenProps) {
  const { state, canAttemptGauntlet, locationProgress } = useGame();
  const { checkForRace, getAvailableSteals } = useRival();
  const { playMusic, playSfx } = useAudio();

  const [showStealModal, setShowStealModal] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [showTutorialHint, setShowTutorialHint] = useState(false);

  // Show tutorial hint for first-time players
  useEffect(() => {
    if (state.completedLocations.length === 0) {
      // Small delay so the map loads first
      const timer = setTimeout(() => setShowTutorialHint(true), 800);
      return () => clearTimeout(timer);
    }
  }, [state.completedLocations.length]);

  // Play exploration music on mount
  useEffect(() => {
    playMusic('exploration');
  }, [playMusic]);

  const unlockedLocations = getUnlockedLocations(state.completedLocations);
  const availableSteals = getAvailableSteals();

  const getLocationStatus = (locationId: string) => {
    if (state.completedLocations.includes(locationId)) return 'completed';
    if (unlockedLocations.includes(locationId)) return 'unlocked';
    return 'locked';
  };

  const handleLocationClick = (locationId: string) => {
    const status = getLocationStatus(locationId);
    if (status === 'unlocked') {
      playSfx('click');
      // Check if there's a rival at this location for a race
      const rivalAtLocation = checkForRace(locationId);
      onNavigate('location', {
        locationId,
        raceOpponent: rivalAtLocation, // Will trigger race mode if not null
      });
    }
  };

  const handleStealSelect = (targetId: 'brendan' | 'maeve', locationId: string) => {
    setShowStealModal(false);
    onNavigate('location', {
      locationId,
      stealTarget: targetId,
      isStealChallenge: true,
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-display text-boston-gold">Boston</h1>
          <p className="text-boston-cream/70">{locationProgress}</p>
        </div>
        <ScoreDisplay score={state.score} keysCollected={state.keysCollected.length} />
      </div>

      {/* Rival Progress Panel */}
      <RivalProgressPanel className="mb-4 max-w-sm" />

      {/* Map Container */}
      <div className="relative w-full aspect-[4/3] max-w-4xl mx-auto bg-boston-navy/50 border border-boston-cream/20 rounded-lg overflow-hidden">
        {/* Map Background */}
        <img
          src="/assets/images/ui/boston-map.png"
          alt="Map of Boston"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />

        {/* Location Markers */}
        {Object.entries(locations).map(([id]) => {
          const pos = locationPositions[id];
          const status = getLocationStatus(id);
          const hasRival = checkForRace(id) !== null;

          return (
            <motion.button
              key={id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={status === 'unlocked' ? { scale: 1.1 } : {}}
              whileTap={status === 'unlocked' ? { scale: 0.95 } : {}}
              onClick={() => handleLocationClick(id)}
              disabled={status === 'locked'}
              className={`
                absolute w-8 h-8 -ml-4 -mt-4 md:w-12 md:h-12 md:-ml-6 md:-mt-6
                rounded-full border-2 text-sm md:text-base
                flex items-center justify-center
                transition-all touch-manipulation
                ${status === 'completed'
                  ? 'bg-boston-green border-boston-green text-white'
                  : status === 'unlocked'
                    ? hasRival
                      ? 'bg-red-600 border-red-400 text-white cursor-pointer active:shadow-lg active:shadow-red-500/50 md:hover:shadow-lg md:hover:shadow-red-500/50 animate-pulse'
                      : 'bg-boston-gold border-boston-gold text-boston-navy cursor-pointer active:shadow-lg active:shadow-boston-gold/50 md:hover:shadow-lg md:hover:shadow-boston-gold/50'
                    : 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed opacity-50'}
              `}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {status === 'completed' ? '✓' : status === 'locked' ? '🔒' : hasRival ? '!' : ''}
            </motion.button>
          );
        })}

        {/* Rival Indicators */}
        {Object.keys(locationPositions).map((id) => (
          <RivalIndicator
            key={`rival-${id}`}
            locationId={id}
            position={locationPositions[id]}
          />
        ))}

        {/* Location Labels - hidden on very small screens to reduce clutter */}
        {Object.entries(locations).map(([id, location]) => {
          const pos = locationPositions[id];
          const status = getLocationStatus(id);

          // Position label to side if specified, otherwise below
          const labelStyle = pos.labelOffset === 'left'
            ? { left: `${pos.x - 10}%`, top: `${pos.y}%` }
            : pos.labelOffset === 'right'
              ? { left: `${pos.x + 6}%`, top: `${pos.y}%` }
              : { left: `${pos.x}%`, top: `${pos.y + 6}%` };

          return (
            <div
              key={`label-${id}`}
              className={`
                absolute text-[10px] md:text-xs font-body whitespace-nowrap
                hidden sm:block
                ${pos.labelOffset ? '' : 'text-center transform -translate-x-1/2'}
                ${status === 'locked' ? 'text-gray-500' : 'text-boston-cream'}
              `}
              style={labelStyle}
            >
              {location.name}
            </div>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 sm:mt-6">
        {canAttemptGauntlet && (
          <Button
            size="lg"
            onClick={() => onNavigate('gauntlet')}
          >
            Enter The Gauntlet
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => onNavigate('collection')}
        >
          Polaroids ({state.collectedPolaroids.length}/30)
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowGroupChat(true)}
        >
          Family Chat
        </Button>

        <Button
          variant="outline"
          onClick={() => onNavigate('settings')}
        >
          Settings
        </Button>
      </div>

      {/* Steal Opportunity Badge */}
      {availableSteals.length > 0 && (
        <StealOpportunityBadge onClick={() => setShowStealModal(true)} />
      )}

      {/* Steal Selection Modal */}
      <StealSelectionModal
        isOpen={showStealModal}
        onClose={() => setShowStealModal(false)}
        onSelect={handleStealSelect}
      />

      {/* Family Group Chat */}
      <FamilyGroupChat
        isOpen={showGroupChat}
        onClose={() => setShowGroupChat(false)}
      />

      {/* Tutorial Hint for First-Time Players */}
      <AnimatePresence>
        {showTutorialHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowTutorialHint(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-boston-navy border-2 border-boston-gold rounded-lg p-6 max-w-sm text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-boston-gold rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                <span className="text-boston-navy text-2xl font-bold">!</span>
              </div>
              <h3 className="font-display text-xl text-boston-gold mb-2">
                Time to Explore!
              </h3>
              <p className="text-boston-cream/80 font-body mb-4">
                Tap on a <span className="text-boston-gold font-semibold">yellow dot</span> on
                the map to visit a neighborhood and answer trivia questions to earn keys.
              </p>
              <p className="text-boston-cream/60 text-sm font-body mb-4">
                Start with <span className="text-boston-gold">Southie</span> — it's already unlocked!
              </p>
              <Button
                onClick={() => setShowTutorialHint(false)}
                className="w-full"
              >
                Got It!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
