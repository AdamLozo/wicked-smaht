import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRival } from '../../contexts';
import { Button } from '../ui/Button';
import { BrendanTextOverlay, BRENDAN_LIFELINE_RESPONSES } from './BrendanTextOverlay';
import { MaeveMemoPlayer, MAEVE_LIFELINE_RESPONSES } from './MaeveMemoPlayer';
import type { CousinResponse } from '../../types';

interface AskCousinLifelineProps {
  isOpen: boolean;
  onClose: () => void;
  questionPrompt: string;
  choices: string[];
  correctIndex: number;
  onUseLifeline: (suggestedIndex: number) => void;
}

export function AskCousinLifeline({
  isOpen,
  onClose,
  questionPrompt,
  choices,
  correctIndex,
  onUseLifeline,
}: AskCousinLifelineProps) {
  const { canUseCousinCall, useCousinCall, getCousinResponse, state } = useRival();
  const [phase, setPhase] = useState<'select' | 'calling' | 'response' | 'callback'>('select');
  const [selectedCousin, setSelectedCousin] = useState<'brendan' | 'maeve' | null>(null);
  const [response, setResponse] = useState<CousinResponse | null>(null);
  const [showCallback, setShowCallback] = useState(false);

  const canCall = canUseCousinCall();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhase('select');
      setSelectedCousin(null);
      setResponse(null);
      setShowCallback(false);
    }
  }, [isOpen]);

  const handleSelectCousin = useCallback((cousinId: 'brendan' | 'maeve') => {
    if (!canCall) return;

    setSelectedCousin(cousinId);
    setPhase('calling');

    // Simulate calling delay
    setTimeout(() => {
      if (!useCousinCall()) {
        setPhase('select');
        return;
      }

      const cousinResponse = getCousinResponse(
        `question_${Date.now()}`,
        choices,
        correctIndex
      );
      setResponse(cousinResponse);
      setPhase('response');

      // Handle Maeve's potential callback
      if (cousinResponse.callback) {
        setTimeout(() => {
          setShowCallback(true);
          setPhase('callback');
        }, cousinResponse.callback.delay * 1000);
      }
    }, 2000);
  }, [canCall, useCousinCall, getCousinResponse, choices, correctIndex]);

  const handleUseAnswer = useCallback(() => {
    if (!response) return;

    // Use the callback correction if available, otherwise the initial suggestion
    const answerIndex = showCallback && response.callback?.correction !== undefined
      ? response.callback.correction
      : response.suggestedAnswer;

    onUseLifeline(answerIndex);
    onClose();
  }, [response, showCallback, onUseLifeline, onClose]);

  const getResponseText = (cousin: 'brendan' | 'maeve') => {
    const responses = cousin === 'brendan' ? BRENDAN_LIFELINE_RESPONSES : MAEVE_LIFELINE_RESPONSES;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const answerLetter = String.fromCharCode(65 + (response?.suggestedAnswer || 0));

    return `${randomResponse.intro} I'd go with ${answerLetter}. I'm ${randomResponse.confidence} about this one.`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          {/* Selection phase */}
          {phase === 'select' && (
            <div className="bg-boston-navy border border-boston-cream/20 rounded-lg p-6">
              <h2 className="text-2xl font-display text-boston-gold text-center mb-2">
                Ask Your Cousin
              </h2>
              <p className="text-boston-cream/70 text-sm text-center mb-6">
                {canCall
                  ? `You have ${state.cousinCallsRemaining} call${state.cousinCallsRemaining !== 1 ? 's' : ''} remaining`
                  : 'No calls remaining!'
                }
              </p>

              {canCall ? (
                <>
                  <p className="text-boston-cream text-sm mb-4 text-center">
                    Who do you want to ask for help?
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Brendan option */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectCousin('brendan')}
                      className="p-4 bg-blue-900/50 border-2 border-blue-500/50 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-blue-700 border-2 border-blue-400 overflow-hidden">
                        <img
                          src={state.rivals.brendan.portrait}
                          alt="Brendan"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      <p className="text-blue-400 font-display text-lg">Brendan</p>
                      <p className="text-blue-300/70 text-xs">Quick text</p>
                      <p className="text-blue-200/50 text-xs mt-1">~60% accurate</p>
                    </motion.button>

                    {/* Maeve option */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectCousin('maeve')}
                      className="p-4 bg-purple-900/50 border-2 border-purple-500/50 rounded-lg hover:border-purple-400 transition-colors"
                    >
                      <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-purple-700 border-2 border-purple-400 overflow-hidden">
                        <img
                          src={state.rivals.maeve.portrait}
                          alt="Maeve"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                      <p className="text-purple-400 font-display text-lg">Maeve</p>
                      <p className="text-purple-300/70 text-xs">Voice memo</p>
                      <p className="text-purple-200/50 text-xs mt-1">~80% accurate</p>
                    </motion.button>
                  </div>

                  <p className="text-boston-cream/50 text-xs text-center">
                    Note: Maeve may call back with a correction if she rethinks her answer
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-red-400">You've used all your cousin calls!</p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={onClose}
                className="w-full mt-4"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Calling phase */}
          {phase === 'calling' && selectedCousin && (
            <div className="bg-boston-navy border border-boston-cream/20 rounded-lg p-6 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className={`w-24 h-24 mx-auto mb-4 rounded-full border-4 overflow-hidden ${
                  selectedCousin === 'brendan'
                    ? 'bg-blue-700 border-blue-400'
                    : 'bg-purple-700 border-purple-400'
                }`}
              >
                <img
                  src={state.rivals[selectedCousin].portrait}
                  alt={selectedCousin === 'brendan' ? 'Brendan' : 'Maeve'}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </motion.div>

              <h3 className={`text-xl font-display mb-2 ${
                selectedCousin === 'brendan' ? 'text-blue-400' : 'text-purple-400'
              }`}>
                Contacting {selectedCousin === 'brendan' ? 'Brendan' : 'Maeve'}...
              </h3>

              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex justify-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-boston-cream" />
                <div className="w-3 h-3 rounded-full bg-boston-cream" />
                <div className="w-3 h-3 rounded-full bg-boston-cream" />
              </motion.div>
            </div>
          )}

          {/* Response phase */}
          {(phase === 'response' || phase === 'callback') && response && selectedCousin && (
            <div className="bg-boston-navy border border-boston-cream/20 rounded-lg p-6">
              <h3 className={`text-xl font-display text-center mb-4 ${
                selectedCousin === 'brendan' ? 'text-blue-400' : 'text-purple-400'
              }`}>
                {selectedCousin === 'brendan' ? 'Brendan says:' : 'Maeve says:'}
              </h3>

              {/* Response content */}
              <div className={`p-4 rounded-lg mb-4 ${
                selectedCousin === 'brendan' ? 'bg-blue-900/30' : 'bg-purple-900/30'
              }`}>
                <p className="text-boston-cream text-sm leading-relaxed">
                  "{getResponseText(selectedCousin)}"
                </p>
              </div>

              {/* Callback message from Maeve */}
              {showCallback && response.callback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-purple-800/30 border border-purple-400/50 rounded-lg mb-4"
                >
                  <p className="text-purple-300 text-xs uppercase tracking-wider mb-1">
                    Callback from Maeve:
                  </p>
                  <p className="text-boston-cream text-sm">
                    "{response.callback.text}"
                  </p>
                </motion.div>
              )}

              {/* Suggested answer highlight */}
              <div className="mb-4">
                <p className="text-boston-cream/70 text-xs mb-2">Their suggestion:</p>
                <div className={`p-3 rounded border ${
                  selectedCousin === 'brendan'
                    ? 'bg-blue-900/50 border-blue-500'
                    : 'bg-purple-900/50 border-purple-500'
                }`}>
                  <span className="text-boston-gold font-bold mr-2">
                    {String.fromCharCode(65 + (
                      showCallback && response.callback?.correction !== undefined
                        ? response.callback.correction
                        : response.suggestedAnswer
                    ))}.
                  </span>
                  <span className="text-boston-cream">
                    {choices[
                      showCallback && response.callback?.correction !== undefined
                        ? response.callback.correction
                        : response.suggestedAnswer
                    ]}
                  </span>
                </div>
              </div>

              {/* Confidence indicator */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-boston-cream/70 text-xs">Confidence:</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(showCallback ? 0.9 : response.confidence) * 100}%` }}
                    className={`h-full ${
                      selectedCousin === 'brendan' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}
                  />
                </div>
                <span className="text-boston-cream text-xs">
                  {Math.round((showCallback ? 0.9 : response.confidence) * 100)}%
                </span>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Ignore
                </Button>
                <Button
                  onClick={handleUseAnswer}
                  className="flex-1"
                >
                  Use Answer
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
