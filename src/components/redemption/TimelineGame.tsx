import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';

interface HistoricalEvent {
  id: string;
  name: string;
  year: number;
  description: string;
}

const REVOLUTIONARY_EVENTS: HistoricalEvent[] = [
  { id: 'stamp', name: 'Stamp Act', year: 1765, description: 'British tax on printed materials sparked colonial outrage' },
  { id: 'massacre', name: 'Boston Massacre', year: 1770, description: 'British soldiers killed five colonists on King Street' },
  { id: 'tea', name: 'Boston Tea Party', year: 1773, description: 'Sons of Liberty dumped 342 chests of tea into the harbor' },
  { id: 'intolerable', name: 'Intolerable Acts', year: 1774, description: 'British punishment that closed Boston Harbor' },
  { id: 'revere', name: "Paul Revere's Ride", year: 1775, description: '"The British are coming!" warned the militia' },
  { id: 'lexington', name: 'Battles of Lexington & Concord', year: 1775, description: '"Shot heard round the world" started the war' },
  { id: 'bunker', name: 'Battle of Bunker Hill', year: 1775, description: '"Don\'t fire until you see the whites of their eyes"' },
  { id: 'evacuation', name: 'Evacuation Day', year: 1776, description: 'British forces withdrew from Boston' },
  { id: 'declaration', name: 'Declaration of Independence', year: 1776, description: 'Read from the State House balcony in Boston' },
  { id: 'constitution', name: 'MA Constitution Ratified', year: 1780, description: 'Oldest functioning written constitution in the world' },
];

interface TimelineGameProps {
  onComplete: (passed: boolean, score: number) => void;
  requiredCorrect?: number;
}

export function TimelineGame({
  onComplete,
  requiredCorrect = 3,
}: TimelineGameProps) {
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [userOrder, setUserOrder] = useState<HistoricalEvent[]>([]);
  const [availableEvents, setAvailableEvents] = useState<HistoricalEvent[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [round, setRound] = useState(0);
  const totalRounds = 3;

  // Initialize round with 4 events to order
  useEffect(() => {
    startNewRound();
  }, []);

  const startNewRound = () => {
    const shuffled = [...REVOLUTIONARY_EVENTS].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);
    setEvents(selected.sort((a, b) => a.year - b.year)); // Correct order
    setAvailableEvents([...selected].sort(() => Math.random() - 0.5)); // Randomized for player
    setUserOrder([]);
    setShowResult(false);
  };

  const handleSelectEvent = useCallback((event: HistoricalEvent) => {
    if (showResult) return;
    setAvailableEvents(prev => prev.filter(e => e.id !== event.id));
    setUserOrder(prev => [...prev, event]);
  }, [showResult]);

  const handleRemoveEvent = useCallback((event: HistoricalEvent) => {
    if (showResult) return;
    setUserOrder(prev => prev.filter(e => e.id !== event.id));
    setAvailableEvents(prev => [...prev, event]);
  }, [showResult]);

  const handleSubmit = useCallback(() => {
    if (userOrder.length !== 4) return;

    // Count how many are in correct position
    let correct = 0;
    for (let i = 0; i < 4; i++) {
      if (userOrder[i].id === events[i].id) {
        correct++;
      }
    }

    const roundPassed = correct >= 3; // Need 3 of 4 in correct position
    setShowResult(true);

    const newCorrectCount = roundPassed ? correctCount + 1 : correctCount;
    setCorrectCount(newCorrectCount);

    setTimeout(() => {
      if (round < totalRounds - 1) {
        setRound(prev => prev + 1);
        startNewRound();
      } else {
        const passed = newCorrectCount >= requiredCorrect;
        onComplete(passed, newCorrectCount * 35);
      }
    }, 3000);
  }, [userOrder, events, round, correctCount, requiredCorrect, onComplete]);

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl text-boston-gold mb-2">
          Revolutionary Timeline
        </h2>
        <p className="text-boston-cream/70">
          Round {round + 1} of {totalRounds} | Put events in chronological order
        </p>
      </div>

      {/* User's Timeline */}
      <div className="mb-6">
        <p className="text-boston-cream/50 text-sm mb-2">Your timeline (earliest to latest):</p>
        <div className="bg-boston-navy/50 border border-boston-cream/20 rounded-lg p-4 min-h-[180px]">
          {userOrder.length === 0 ? (
            <p className="text-boston-cream/30 text-center italic">Click events below to add them...</p>
          ) : (
            <div className="space-y-2">
              {userOrder.map((event, index) => {
                const isCorrect = showResult && events[index]?.id === event.id;
                const isWrong = showResult && events[index]?.id !== event.id;
                return (
                  <motion.button
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleRemoveEvent(event)}
                    disabled={showResult}
                    className={`
                      w-full p-3 rounded-lg border text-left flex justify-between items-center
                      ${isCorrect ? 'bg-green-600/30 border-green-400' : ''}
                      ${isWrong ? 'bg-red-600/30 border-red-400' : ''}
                      ${!showResult ? 'bg-boston-gold/20 border-boston-gold/50 hover:bg-boston-gold/30' : ''}
                    `}
                  >
                    <span className="text-boston-cream">
                      {index + 1}. {event.name}
                    </span>
                    {showResult && (
                      <span className="text-boston-cream/70 text-sm">{event.year}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Available Events */}
      {!showResult && availableEvents.length > 0 && (
        <div className="mb-6">
          <p className="text-boston-cream/50 text-sm mb-2">Available events:</p>
          <div className="grid grid-cols-2 gap-2">
            {availableEvents.map(event => (
              <motion.button
                key={event.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectEvent(event)}
                className="p-3 bg-boston-navy/80 border border-boston-cream/30 rounded-lg text-left hover:border-boston-gold/50"
              >
                <p className="text-boston-cream text-sm font-medium">{event.name}</p>
                <p className="text-boston-cream/50 text-xs">{event.description}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      {!showResult && userOrder.length === 4 && (
        <div className="text-center mb-4">
          <Button onClick={handleSubmit}>Lock In Order</Button>
        </div>
      )}

      {/* Result */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          {userOrder.filter((e, i) => e.id === events[i].id).length >= 3 ? (
            <p className="text-green-400 font-display text-lg">
              Good enough! You know your history.
            </p>
          ) : (
            <p className="text-red-400 font-display text-lg">
              Not quite. Study up on the Revolution!
            </p>
          )}
        </motion.div>
      )}

      {/* Progress */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < round ? 'bg-green-400' : i === round ? 'bg-boston-gold' : 'bg-boston-cream/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
