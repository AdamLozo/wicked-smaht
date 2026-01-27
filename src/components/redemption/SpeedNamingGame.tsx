import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

// Red Sox players from different eras
const RED_SOX_PLAYERS = [
  // Current/Recent
  'Rafael Devers', 'Xander Bogaerts', 'J.D. Martinez', 'Mookie Betts',
  'Chris Sale', 'Nathan Eovaldi', 'Alex Verdugo', 'Trevor Story',
  // Champions Era
  'David Ortiz', 'Manny Ramirez', 'Pedro Martinez', 'Curt Schilling',
  'Johnny Damon', 'Kevin Youkilis', 'Dustin Pedroia', 'Jason Varitek',
  'Jonathan Papelbon', 'Tim Wakefield', 'Jacoby Ellsbury', 'Mike Lowell',
  // Legends
  'Ted Williams', 'Carl Yastrzemski', 'Carlton Fisk', 'Jim Rice',
  'Wade Boggs', 'Roger Clemens', 'Nomar Garciaparra', 'Mo Vaughn',
  'Dwight Evans', 'Luis Tiant', 'Fred Lynn', 'Dennis Eckersley',
  // Classic
  'Babe Ruth', 'Cy Young', 'Bobby Doerr', 'Jimmie Foxx',
  'Joe Cronin', 'Tris Speaker', 'Lefty Grove', 'Harry Hooper',
];

interface SpeedNamingGameProps {
  onComplete: (passed: boolean, score: number) => void;
  requiredCount?: number;
  timeLimit?: number;
}

export function SpeedNamingGame({
  onComplete,
  requiredCount = 7,
  timeLimit = 30,
}: SpeedNamingGameProps) {
  const [input, setInput] = useState('');
  const [namedPlayers, setNamedPlayers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{ text: string; type: 'success' | 'error' | 'duplicate' } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize player name for matching
  const normalizeName = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Check if input matches a player
  const checkPlayer = useCallback((input: string): string | null => {
    const normalized = normalizeName(input);
    if (normalized.length < 3) return null;

    // Check for last name match or full name match
    for (const player of RED_SOX_PLAYERS) {
      const playerNormalized = normalizeName(player);
      const lastName = playerNormalized.split(' ').pop() || '';

      // Match full name, last name, or reasonable partial
      if (
        playerNormalized === normalized ||
        lastName === normalized ||
        (normalized.length >= 4 && playerNormalized.includes(normalized))
      ) {
        return player;
      }

      // Handle common nicknames/variations
      if (normalized === 'big papi' && player === 'David Ortiz') return player;
      if (normalized === 'papi' && player === 'David Ortiz') return player;
      if (normalized === 'yaz' && player === 'Carl Yastrzemski') return player;
      if (normalized === 'teddy ballgame' && player === 'Ted Williams') return player;
      if (normalized === 'tek' && player === 'Jason Varitek') return player;
      if (normalized === 'pap' && player === 'Jonathan Papelbon') return player;
      if (normalized === 'nomar' && player === 'Nomar Garciaparra') return player;
      if (normalized === 'youk' && player === 'Kevin Youkilis') return player;
      if (normalized === 'pedey' && player === 'Dustin Pedroia') return player;
    }

    return null;
  }, []);

  // Timer
  useEffect(() => {
    if (!gameStarted || gameOver || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          const passed = namedPlayers.length >= requiredCount;
          onComplete(passed, namedPlayers.length * 15);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver, timeLeft, namedPlayers.length, requiredCount, onComplete]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const matchedPlayer = checkPlayer(input);

    if (matchedPlayer) {
      if (namedPlayers.some(p => normalizeName(p) === normalizeName(matchedPlayer))) {
        // Already named
        setLastFeedback({ text: `Already got ${matchedPlayer}!`, type: 'duplicate' });
      } else {
        // New valid player
        setNamedPlayers(prev => [...prev, matchedPlayer]);
        setLastFeedback({ text: `${matchedPlayer}!`, type: 'success' });

        // Check for win
        if (namedPlayers.length + 1 >= requiredCount && !gameOver) {
          // Keep going - they can get bonus points
        }
      }
    } else {
      setLastFeedback({ text: `"${input}" - not recognized`, type: 'error' });
    }

    setInput('');
    setTimeout(() => setLastFeedback(null), 1500);
  }, [input, checkPlayer, namedPlayers, requiredCount, gameOver]);

  const handleStart = useCallback(() => {
    setGameStarted(true);
    inputRef.current?.focus();
  }, []);

  // Pre-game screen
  if (!gameStarted) {
    return (
      <div className="w-full max-w-lg mx-auto text-center">
        <h2 className="font-display text-2xl text-boston-gold mb-4">
          Red Sox Speed Round
        </h2>
        <p className="text-boston-cream/70 mb-6">
          Name {requiredCount} Red Sox players in {timeLimit} seconds.
          Current players, legends, anyone who wore the uniform.
        </p>
        <div className="bg-boston-navy/50 border border-boston-cream/20 rounded-lg p-4 mb-6">
          <p className="text-boston-cream/50 text-sm">
            Type last names or nicknames. "Big Papi" counts. "Yaz" counts. Just be fast.
          </p>
        </div>
        <Button size="lg" onClick={handleStart}>
          Start Timer
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="font-display text-2xl text-boston-gold mb-2">
          Red Sox Speed Round
        </h2>
        <p className="text-boston-cream/70">
          {namedPlayers.length} / {requiredCount} players
          {namedPlayers.length >= requiredCount && ' - Keep going for bonus!'}
        </p>
      </div>

      {/* Timer - Big and prominent */}
      <div className={`text-center mb-6 ${timeLeft <= 10 ? 'animate-pulse' : ''}`}>
        <span className={`font-mono text-6xl ${timeLeft <= 10 ? 'text-red-400' : 'text-boston-gold'}`}>
          {timeLeft}
        </span>
        <p className="text-boston-cream/50 text-sm">seconds</p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a player name..."
            autoComplete="off"
            autoFocus
            disabled={gameOver}
            className={`
              w-full p-4 text-xl
              bg-boston-navy/80 border-2 rounded-lg
              text-boston-cream placeholder-boston-cream/30
              focus:outline-none
              ${gameOver
                ? 'border-boston-cream/20 opacity-50'
                : 'border-boston-gold/50 focus:border-boston-gold'
              }
            `}
          />
          {!gameOver && (
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-boston-gold text-boston-navy rounded font-bold"
            >
              →
            </button>
          )}
        </div>
      </form>

      {/* Feedback */}
      <AnimatePresence>
        {lastFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-center mb-4 font-display text-lg ${
              lastFeedback.type === 'success' ? 'text-green-400' :
              lastFeedback.type === 'duplicate' ? 'text-yellow-400' :
              'text-red-400'
            }`}
          >
            {lastFeedback.type === 'success' && '✓ '}
            {lastFeedback.type === 'duplicate' && '↻ '}
            {lastFeedback.type === 'error' && '✗ '}
            {lastFeedback.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Named Players */}
      <div className="bg-boston-navy/50 border border-boston-cream/20 rounded-lg p-4">
        <p className="text-boston-cream/50 text-sm mb-2">Players named:</p>
        <div className="flex flex-wrap gap-2">
          {namedPlayers.map((player, i) => (
            <motion.span
              key={player}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`
                px-3 py-1 rounded-full text-sm
                ${i < requiredCount
                  ? 'bg-green-600/30 text-green-300 border border-green-500/50'
                  : 'bg-boston-gold/30 text-boston-gold border border-boston-gold/50'
                }
              `}
            >
              {player}
            </motion.span>
          ))}
          {namedPlayers.length === 0 && (
            <span className="text-boston-cream/30 italic">None yet...</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-2 bg-boston-cream/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${namedPlayers.length >= requiredCount ? 'bg-green-500' : 'bg-boston-gold'}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (namedPlayers.length / requiredCount) * 100)}%` }}
          />
        </div>
      </div>

      {/* Game Over Message */}
      {gameOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mt-6"
        >
          {namedPlayers.length >= requiredCount ? (
            <p className="text-green-400 font-display text-xl">
              Time! You got {namedPlayers.length} players!
            </p>
          ) : (
            <p className="text-red-400 font-display text-xl">
              Time! Only {namedPlayers.length} of {requiredCount} needed.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
