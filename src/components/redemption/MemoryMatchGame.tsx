import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PastaCard {
  id: string;
  name: string;
  emoji: string;
}

const PASTA_TYPES: PastaCard[] = [
  { id: 'orecchiette', name: 'Orecchiette', emoji: '👂' },
  { id: 'farfalle', name: 'Farfalle', emoji: '🦋' },
  { id: 'penne', name: 'Penne', emoji: '✏️' },
  { id: 'rigatoni', name: 'Rigatoni', emoji: '🔧' },
  { id: 'fusilli', name: 'Fusilli', emoji: '🌀' },
  { id: 'conchiglie', name: 'Conchiglie', emoji: '🐚' },
  { id: 'linguine', name: 'Linguine', emoji: '〰️' },
  { id: 'tortellini', name: 'Tortellini', emoji: '🥟' },
];

interface CardState {
  id: string;
  pastaId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryMatchGameProps {
  onComplete: (passed: boolean, score: number) => void;
  requiredMatches?: number;
  timeLimit?: number;
}

export function MemoryMatchGame({
  onComplete,
  requiredMatches = 4,
  timeLimit = 60,
}: MemoryMatchGameProps) {
  const [cards, setCards] = useState<CardState[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameStarted, setGameStarted] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Initialize cards
  useEffect(() => {
    const selectedPastas = [...PASTA_TYPES]
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);

    const cardPairs = selectedPastas.flatMap((pasta) => [
      { id: `${pasta.id}-a`, pastaId: pasta.id, isFlipped: false, isMatched: false },
      { id: `${pasta.id}-b`, pastaId: pasta.id, isFlipped: false, isMatched: false },
    ]);

    setCards(cardPairs.sort(() => Math.random() - 0.5));
  }, []);

  // Timer
  useEffect(() => {
    if (!gameStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Time's up
          const passed = matchedCount >= requiredMatches;
          onComplete(passed, matchedCount * 25);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, timeLeft, matchedCount, requiredMatches, onComplete]);

  // Check for match
  useEffect(() => {
    if (flippedCards.length !== 2) return;

    setIsChecking(true);
    const [firstId, secondId] = flippedCards;
    const firstCard = cards.find(c => c.id === firstId);
    const secondCard = cards.find(c => c.id === secondId);

    if (firstCard?.pastaId === secondCard?.pastaId) {
      // Match found
      setTimeout(() => {
        setCards(prev => prev.map(card =>
          card.id === firstId || card.id === secondId
            ? { ...card, isMatched: true }
            : card
        ));
        setMatchedCount(prev => {
          const newCount = prev + 1;
          // Check win condition
          if (newCount >= 6) {
            const passed = true;
            onComplete(passed, newCount * 25 + Math.max(0, timeLeft * 2));
          }
          return newCount;
        });
        setFlippedCards([]);
        setIsChecking(false);
      }, 500);
    } else {
      // No match - flip back
      setTimeout(() => {
        setCards(prev => prev.map(card =>
          card.id === firstId || card.id === secondId
            ? { ...card, isFlipped: false }
            : card
        ));
        setFlippedCards([]);
        setIsChecking(false);
      }, 1000);
    }
  }, [flippedCards, cards, timeLeft, onComplete]);

  const handleCardClick = useCallback((cardId: string) => {
    if (!gameStarted) {
      setGameStarted(true);
    }

    if (isChecking || flippedCards.length >= 2) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    setCards(prev => prev.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));
    setFlippedCards(prev => [...prev, cardId]);
    setMoves(prev => prev + 1);
  }, [gameStarted, isChecking, flippedCards, cards]);

  const getPastaInfo = (pastaId: string) => {
    return PASTA_TYPES.find(p => p.id === pastaId);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl text-boston-gold mb-2">
          Pasta Memory
        </h2>
        <p className="text-boston-cream/70">
          Match the pasta shapes! Find {requiredMatches} pairs to pass.
        </p>
      </div>

      {/* Stats */}
      <div className="flex justify-between mb-4 px-4">
        <div className="text-boston-cream/70">
          Matches: <span className="text-boston-gold">{matchedCount}/6</span>
        </div>
        <div className={`font-mono ${timeLeft <= 10 ? 'text-red-400' : 'text-boston-cream/70'}`}>
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
        <div className="text-boston-cream/70">
          Moves: <span className="text-boston-gold">{moves}</span>
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-4 gap-3 p-4">
        {cards.map((card) => {
          const pasta = getPastaInfo(card.pastaId);

          return (
            <motion.button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              whileHover={!card.isFlipped && !card.isMatched ? { scale: 1.05 } : {}}
              whileTap={!card.isFlipped && !card.isMatched ? { scale: 0.95 } : {}}
              className={`
                aspect-square rounded-lg
                flex items-center justify-center
                text-3xl
                transition-all duration-300
                ${card.isMatched
                  ? 'bg-green-600/50 border-2 border-green-400'
                  : card.isFlipped
                    ? 'bg-boston-cream/20 border-2 border-boston-gold'
                    : 'bg-boston-navy/80 border-2 border-boston-cream/30 hover:border-boston-gold/50 cursor-pointer'
                }
              `}
            >
              <AnimatePresence mode="wait">
                {(card.isFlipped || card.isMatched) ? (
                  <motion.div
                    key="front"
                    initial={{ rotateY: -90 }}
                    animate={{ rotateY: 0 }}
                    exit={{ rotateY: 90 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-3xl">{pasta?.emoji}</span>
                    <span className="text-[10px] text-boston-cream/70 mt-1">
                      {pasta?.name}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="back"
                    initial={{ rotateY: 90 }}
                    animate={{ rotateY: 0 }}
                    exit={{ rotateY: -90 }}
                    transition={{ duration: 0.2 }}
                    className="text-boston-cream/30"
                  >
                    🍝
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Instructions */}
      {!gameStarted && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-boston-cream/50 mt-4"
        >
          Click a card to start the timer
        </motion.p>
      )}

      {/* NPC Commentary */}
      <AnimatePresence>
        {matchedCount > 0 && matchedCount < 6 && (
          <motion.p
            key={matchedCount}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-boston-cream/70 mt-4 italic"
          >
            {matchedCount === 1 && "Not bad. You know your orecchiette from your rigatoni."}
            {matchedCount === 2 && "My nonna would approve. Keep going."}
            {matchedCount === 3 && "Halfway there. You might actually pass."}
            {matchedCount === 4 && "Okay, I'm impressed. One more for the record."}
            {matchedCount === 5 && "Last pair. Don't blow it now."}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
