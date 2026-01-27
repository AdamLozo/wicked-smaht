import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
              onClick={() => handleLocationClick(id)}
              disabled={status === 'locked'}
              className={`
                absolute w-12 h-12 -ml-6 -mt-6
                rounded-full border-2
                flex items-center justify-center
                transition-all
                ${status === 'completed'
                  ? 'bg-boston-green border-boston-green text-white'
                  : status === 'unlocked'
                    ? hasRival
                      ? 'bg-red-600 border-red-400 text-white cursor-pointer hover:shadow-lg hover:shadow-red-500/50 animate-pulse'
                      : 'bg-boston-gold border-boston-gold text-boston-navy cursor-pointer hover:shadow-lg hover:shadow-boston-gold/50'
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

        {/* Location Labels */}
        {Object.entries(locations).map(([id, location]) => {
          const pos = locationPositions[id];
          const status = getLocationStatus(id);

          // Position label to side if specified, otherwise below
          const labelStyle = pos.labelOffset === 'left'
            ? { left: `${pos.x - 12}%`, top: `${pos.y}%` }
            : pos.labelOffset === 'right'
              ? { left: `${pos.x + 8}%`, top: `${pos.y}%` }
              : { left: `${pos.x}%`, top: `${pos.y + 8}%` };

          return (
            <div
              key={`label-${id}`}
              className={`
                absolute text-xs font-body whitespace-nowrap
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
      <div className="flex flex-wrap justify-center gap-4 mt-6">
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
    </div>
  );
}
