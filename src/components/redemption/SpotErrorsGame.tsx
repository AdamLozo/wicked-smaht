import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface BuildingDescription {
  id: string;
  building: string;
  description: string;
  errors: { text: string; correction: string }[];
}

const BUILDING_DESCRIPTIONS: BuildingDescription[] = [
  {
    id: 'trinity',
    building: 'Trinity Church',
    description: 'Trinity Church in Copley Square was designed by H.H. Richardson and completed in 1877. The Romanesque Revival building features a 211-foot tall steeple and sits on over 4,500 wooden pilings. The interior murals were painted by John Singer Sargent.',
    errors: [
      { text: '211-foot tall steeple', correction: 'The tower is actually 211 feet, but it\'s not a steeple - it\'s a central tower' },
      { text: 'John Singer Sargent', correction: 'The murals were painted by John La Farge, not Sargent' },
    ]
  },
  {
    id: 'state_house',
    building: 'Massachusetts State House',
    description: 'The Massachusetts State House was designed by Charles Bulfinch and completed in 1798. The iconic golden dome was originally made of copper and gilded with 23-karat gold leaf in 1874. Paul Revere provided the original wooden shingles for the dome.',
    errors: [
      { text: 'wooden shingles', correction: 'Revere provided copper sheathing, not wooden shingles' },
      { text: '23-karat gold leaf', correction: 'The dome is covered with 23-karat gold leaf - this is actually correct!' },
    ]
  },
  {
    id: 'hancock',
    building: 'John Hancock Tower',
    description: 'The John Hancock Tower, designed by I.M. Pei, is Boston\'s tallest building at 790 feet. The 60-story rhomboid tower was completed in 1976 and initially had problems with its glass panels blowing out. The building contains 10,344 windows.',
    errors: [
      { text: 'designed by I.M. Pei', correction: 'Designed by Henry Cobb of I.M. Pei\'s firm, not Pei himself' },
      { text: '790 feet', correction: 'The tower is actually 790 feet tall - this is correct!' },
    ]
  },
  {
    id: 'faneuil',
    building: 'Faneuil Hall',
    description: 'Faneuil Hall was built in 1742 and donated by wealthy merchant Peter Faneuil. The building was expanded by Charles Bulfinch in 1806. The famous grasshopper weathervane on top was made by Paul Revere and weighs over 80 pounds.',
    errors: [
      { text: 'made by Paul Revere', correction: 'The grasshopper was made by Shem Drowne, not Paul Revere' },
      { text: 'donated by wealthy merchant Peter Faneuil', correction: 'Peter Faneuil did donate it - this is correct!' },
    ]
  },
  {
    id: 'custom',
    building: 'Custom House Tower',
    description: 'The Custom House Tower was Boston\'s first skyscraper, completed in 1915. At 496 feet, it was the tallest building in Boston until 1964. The original Greek Revival base was built in 1847, with the tower added later. The clock faces are 22 feet in diameter.',
    errors: [
      { text: '22 feet in diameter', correction: 'The clock faces are actually about 17 feet in diameter' },
      { text: '496 feet', correction: 'The building is 496 feet tall - this is correct!' },
    ]
  },
];

interface SpotErrorsGameProps {
  onComplete: (passed: boolean, score: number) => void;
  requiredCorrect?: number;
}

export function SpotErrorsGame({
  onComplete,
  requiredCorrect = 3,
}: SpotErrorsGameProps) {
  const [buildings, setBuildings] = useState<BuildingDescription[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const totalRounds = 4;

  useEffect(() => {
    const shuffled = [...BUILDING_DESCRIPTIONS].sort(() => Math.random() - 0.5);
    setBuildings(shuffled.slice(0, totalRounds));
  }, []);

  const currentBuilding = buildings[currentIndex];

  // Split description into clickable segments
  const getSegments = useCallback(() => {
    if (!currentBuilding) return [];

    let text = currentBuilding.description;
    const segments: { text: string; isError: boolean; errorIndex: number }[] = [];

    // Find all error positions
    const errorPositions = currentBuilding.errors.map((error, idx) => ({
      start: text.indexOf(error.text),
      end: text.indexOf(error.text) + error.text.length,
      index: idx,
    })).filter(p => p.start !== -1).sort((a, b) => a.start - b.start);

    let lastEnd = 0;
    for (const pos of errorPositions) {
      if (pos.start > lastEnd) {
        segments.push({ text: text.slice(lastEnd, pos.start), isError: false, errorIndex: -1 });
      }
      segments.push({ text: text.slice(pos.start, pos.end), isError: true, errorIndex: pos.index });
      lastEnd = pos.end;
    }
    if (lastEnd < text.length) {
      segments.push({ text: text.slice(lastEnd), isError: false, errorIndex: -1 });
    }

    return segments;
  }, [currentBuilding]);

  const handleSelectSegment = useCallback((errorIndex: number) => {
    if (showResult || errorIndex === -1) return;

    const errorText = currentBuilding.errors[errorIndex].text;
    if (selectedErrors.includes(errorText)) {
      setSelectedErrors(prev => prev.filter(e => e !== errorText));
    } else {
      setSelectedErrors(prev => [...prev, errorText]);
    }
  }, [showResult, currentBuilding, selectedErrors]);

  const handleSubmit = useCallback(() => {
    if (!currentBuilding) return;
    setShowResult(true);

    // Check how many actual errors were found (errors that have "actually" or similar in correction)
    const actualErrors = currentBuilding.errors.filter(e => !e.correction.includes('correct'));
    const foundActualErrors = selectedErrors.filter(sel =>
      actualErrors.some(e => e.text === sel)
    ).length;

    // Did they find at least one real error without selecting too many false positives?
    const passed = foundActualErrors >= 1 && selectedErrors.length <= actualErrors.length + 1;

    if (passed) {
      setCorrectCount(prev => prev + 1);
    }

    setTimeout(() => {
      if (currentIndex < totalRounds - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedErrors([]);
        setShowResult(false);
      } else {
        const finalCorrect = passed ? correctCount + 1 : correctCount;
        const gamePassed = finalCorrect >= requiredCorrect;
        onComplete(gamePassed, finalCorrect * 30);
      }
    }, 3000);
  }, [currentBuilding, selectedErrors, currentIndex, correctCount, requiredCorrect, onComplete]);

  if (buildings.length === 0 || !currentBuilding) {
    return <div className="text-center text-boston-cream">Loading...</div>;
  }

  const segments = getSegments();

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-display text-2xl text-boston-gold mb-2">
          Architectural Eye
        </h2>
        <p className="text-boston-cream/70">
          Find the error in this description. Click the <span className="text-boston-gold underline">underlined text</span> to select.
        </p>
      </div>

      {/* Building Name */}
      <div className="text-center mb-4">
        <h3 className="font-display text-xl text-boston-cream">
          {currentBuilding.building}
        </h3>
        <p className="text-boston-cream/50 text-sm">
          Round {currentIndex + 1} of {totalRounds}
        </p>
      </div>

      {/* Description with selectable segments */}
      <div className="bg-boston-navy/80 border border-boston-cream/20 rounded-lg p-6 mb-6">
        <p className="text-boston-cream leading-relaxed">
          {segments.map((segment, i) => (
            <span
              key={i}
              onClick={() => handleSelectSegment(segment.errorIndex)}
              className={`
                ${segment.isError ? 'cursor-pointer hover:bg-boston-gold/30 rounded px-1 underline decoration-boston-gold/50 decoration-dotted underline-offset-2' : ''}
                ${segment.isError && selectedErrors.includes(currentBuilding.errors[segment.errorIndex]?.text)
                  ? 'bg-red-500/30 text-red-200'
                  : ''}
                ${showResult && segment.isError && !currentBuilding.errors[segment.errorIndex]?.correction.includes('correct')
                  ? 'bg-red-500/50 underline'
                  : ''}
                ${showResult && segment.isError && currentBuilding.errors[segment.errorIndex]?.correction.includes('correct')
                  ? 'bg-green-500/30'
                  : ''}
              `}
            >
              {segment.text}
            </span>
          ))}
        </p>
      </div>

      {/* Selection count */}
      {!showResult && (
        <p className="text-center text-boston-cream/50 text-sm mb-4">
          {selectedErrors.length} item{selectedErrors.length !== 1 ? 's' : ''} selected
        </p>
      )}

      {/* Submit */}
      {!showResult && (
        <div className="text-center mb-4">
          <Button onClick={handleSubmit} disabled={selectedErrors.length === 0}>
            Submit Answer
          </Button>
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {currentBuilding.errors.map((error, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${
                  error.correction.includes('correct')
                    ? 'bg-green-600/20 border border-green-500/50'
                    : 'bg-red-600/20 border border-red-500/50'
                }`}
              >
                <p className="text-boston-cream text-sm">
                  "{error.text}" — {error.correction}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalRounds }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < currentIndex ? 'bg-green-400' : i === currentIndex ? 'bg-boston-gold' : 'bg-boston-cream/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
