import { motion, AnimatePresence } from 'framer-motion';
import { useRival } from '../../contexts';

interface RivalIndicatorProps {
  locationId: string;
  position: { x: number; y: number };
}

export function RivalIndicator({ locationId, position }: RivalIndicatorProps) {
  const { state } = useRival();

  const brendanHere = state.rivals.brendan.currentLocation === locationId;
  const maeveHere = state.rivals.maeve.currentLocation === locationId;

  if (!brendanHere && !maeveHere) return null;

  // Offset indicators from the main location marker
  const baseOffset = 16; // pixels

  return (
    <AnimatePresence>
      {brendanHere && (
        <motion.div
          key="brendan-indicator"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute w-8 h-8 -ml-4 -mt-4"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: `translate(${baseOffset}px, ${-baseOffset}px)`,
          }}
        >
          <div className="relative w-full h-full">
            {/* Pulse animation */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 rounded-full bg-blue-500"
            />
            {/* Avatar */}
            <div className="relative w-full h-full rounded-full bg-blue-600 border-2 border-blue-400 overflow-hidden shadow-lg shadow-blue-500/50">
              <img
                src={state.rivals.brendan.portrait}
                alt="Brendan"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                B
              </span>
            </div>
            {/* Status indicator */}
            {state.rivals.brendan.status === 'racing' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 border border-yellow-300 flex items-center justify-center"
              >
                <span className="text-[8px]">!</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {maeveHere && (
        <motion.div
          key="maeve-indicator"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute w-8 h-8 -ml-4 -mt-4"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            transform: `translate(${brendanHere ? baseOffset + 20 : baseOffset}px, ${-baseOffset}px)`,
          }}
        >
          <div className="relative w-full h-full">
            {/* Pulse animation */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
              className="absolute inset-0 rounded-full bg-purple-500"
            />
            {/* Avatar */}
            <div className="relative w-full h-full rounded-full bg-purple-600 border-2 border-purple-400 overflow-hidden shadow-lg shadow-purple-500/50">
              <img
                src={state.rivals.maeve.portrait}
                alt="Maeve"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                M
              </span>
            </div>
            {/* Status indicator */}
            {state.rivals.maeve.status === 'racing' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 border border-yellow-300 flex items-center justify-center"
              >
                <span className="text-[8px]">!</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact panel showing rival progress
interface RivalProgressPanelProps {
  className?: string;
}

export function RivalProgressPanel({ className = '' }: RivalProgressPanelProps) {
  const { state, getLeadingRival, isRivalAhead } = useRival();

  const leadingRival = getLeadingRival();
  const brendanAhead = isRivalAhead('brendan');
  const maeveAhead = isRivalAhead('maeve');

  return (
    <div className={`bg-boston-navy/80 backdrop-blur border border-boston-cream/20 rounded-lg p-3 ${className}`}>
      <h3 className="text-xs font-display text-boston-gold mb-2 uppercase tracking-wider">
        Rival Progress
      </h3>

      <div className="space-y-2">
        {/* Brendan */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 border border-blue-400 flex items-center justify-center">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-boston-cream text-xs">Brendan</span>
              {brendanAhead && (
                <span className="text-red-400 text-[10px]">AHEAD</span>
              )}
              {leadingRival === 'brendan' && (
                <span className="text-yellow-400 text-[10px]">LEAD</span>
              )}
            </div>
            <div className="flex gap-0.5 mt-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-sm ${
                    i < state.rivals.brendan.keysCollected
                      ? 'bg-blue-500'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-boston-cream/70 text-xs">
            {state.rivals.brendan.keysCollected}/10
          </span>
        </div>

        {/* Maeve */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-600 border border-purple-400 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-boston-cream text-xs">Maeve</span>
              {maeveAhead && (
                <span className="text-red-400 text-[10px]">AHEAD</span>
              )}
              {leadingRival === 'maeve' && (
                <span className="text-yellow-400 text-[10px]">LEAD</span>
              )}
            </div>
            <div className="flex gap-0.5 mt-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-sm ${
                    i < state.rivals.maeve.keysCollected
                      ? 'bg-purple-500'
                      : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-boston-cream/70 text-xs">
            {state.rivals.maeve.keysCollected}/10
          </span>
        </div>
      </div>
    </div>
  );
}

// Badge showing steal opportunities
interface StealBadgeProps {
  onClick?: () => void;
}

export function StealOpportunityBadge({ onClick }: StealBadgeProps) {
  const { getAvailableSteals } = useRival();
  const steals = getAvailableSteals();

  if (steals.length === 0) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40"
    >
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-0 rounded-full bg-red-500/50"
        />
        <div className="relative bg-red-600 text-white px-4 py-2 rounded-full border-2 border-red-400 shadow-lg shadow-red-500/30">
          <div className="flex items-center gap-2">
            <span className="text-lg">!</span>
            <div className="text-left">
              <div className="text-xs font-bold uppercase">Steal Available</div>
              <div className="text-[10px] opacity-80">
                {steals.length} {steals.length === 1 ? 'opportunity' : 'opportunities'}
              </div>
            </div>
          </div>
        </div>
        {/* Countdown for nearest expiring */}
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
          {Math.floor(steals[0].timeRemaining / 60)}m
        </div>
      </div>
    </motion.button>
  );
}
