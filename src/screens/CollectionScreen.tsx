import { motion } from 'framer-motion';
import { Polaroid, Button } from '../components';
import { useGame } from '../contexts';
import { polaroids, locations } from '../data';
import type { ScreenId, Polaroid as PolaroidType } from '../types';

interface CollectionScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export function CollectionScreen({ onNavigate }: CollectionScreenProps) {
  const { state } = useGame();

  // Group polaroids by location
  const polaroidsByLocation = polaroids.reduce((acc, polaroid) => {
    if (!acc[polaroid.location]) {
      acc[polaroid.location] = [];
    }
    acc[polaroid.location].push(polaroid);
    return acc;
  }, {} as Record<string, PolaroidType[]>);

  return (
    <div className="min-h-screen p-8 bg-boston-navy">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display text-3xl text-boston-gold">Sully's Memories</h1>
          <p className="text-boston-cream/70">
            {state.collectedPolaroids.length} of {polaroids.length} polaroids collected
          </p>
        </div>
        <Button variant="outline" onClick={() => onNavigate('map')}>
          &larr; Back to Map
        </Button>
      </div>

      {/* Polaroid Grid by Location */}
      {Object.entries(locations).map(([locationId, location]) => {
        const locationPolaroids = polaroidsByLocation[locationId] || [];

        if (locationPolaroids.length === 0) return null;

        return (
          <div key={locationId} className="mb-8">
            <h2 className="font-display text-xl text-boston-cream mb-4">
              {location.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {locationPolaroids.map((polaroid, index) => {
                const collected = state.collectedPolaroids.includes(polaroid.id);

                return (
                  <motion.div
                    key={polaroid.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Polaroid
                      image={polaroid.image}
                      caption={polaroid.caption}
                      collected={collected}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Empty state if no polaroids */}
      {polaroids.length === 0 && (
        <div className="text-center text-boston-cream/50 py-12">
          <p className="text-lg">No polaroids discovered yet.</p>
          <p className="text-sm mt-2">Explore Boston to find Sully's memories.</p>
        </div>
      )}
    </div>
  );
}
