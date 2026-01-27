import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DialogueBox, TriviaCard, Button } from '../components';
import { useGame } from '../contexts';
import { getTrivia, npcs, GAME_CONSTANTS } from '../data';
import type { ScreenId, DialogueLine } from '../types';

interface GauntletScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

type GauntletPhase = 'intro' | 'question' | 'result' | 'passed' | 'failed';

export function GauntletScreen({ onNavigate }: GauntletScreenProps) {
  const { attemptGauntlet } = useGame();
  const sully = npcs.sully;

  const gauntletTrivia = getTrivia('gauntlet');
  const questions = gauntletTrivia?.questions || [];

  const [phase, setPhase] = useState<GauntletPhase>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [dialogueIndex, setDialogueIndex] = useState(0);

  const introDialogue: DialogueLine[] = [
    { speaker: 'narrator', text: "The bar falls silent. A spotlight illuminates the brass puzzle box on the counter." },
    { speaker: 'npc', speakerId: 'sully', text: "So. You made it this far." },
    { speaker: 'npc', speakerId: 'sully', text: "Ten questions. One from each neighborhood. Thirty seconds each." },
    { speaker: 'npc', speakerId: 'sully', text: "Get seven right, and the bar is yours." },
    { speaker: 'npc', speakerId: 'sully', text: "Let's see what you're made of, kid." },
  ];

  const handleIntroAdvance = useCallback(() => {
    if (dialogueIndex < introDialogue.length - 1) {
      setDialogueIndex(prev => prev + 1);
    } else {
      setPhase('question');
    }
  }, [dialogueIndex, introDialogue.length]);

  const handleAnswer = useCallback((correct: boolean) => {
    const newAnswers = [...answers, correct];
    setAnswers(newAnswers);

    const newCorrectCount = correct ? correctCount + 1 : correctCount;
    if (correct) {
      setCorrectCount(newCorrectCount);
    }

    setPhase('result');

    setTimeout(() => {
      if (questionIndex < questions.length - 1) {
        setQuestionIndex(prev => prev + 1);
        setPhase('question');
      } else {
        // End of gauntlet
        const finalCorrect = newCorrectCount;
        const passed = finalCorrect >= GAME_CONSTANTS.GAUNTLET_PASSING_THRESHOLD;
        const score = finalCorrect * 100; // Simplified scoring

        attemptGauntlet(passed, score);
        setPhase(passed ? 'passed' : 'failed');
      }
    }, 1500);
  }, [answers, correctCount, questionIndex, questions.length, attemptGauntlet]);

  const handleRetry = useCallback(() => {
    setPhase('intro');
    setQuestionIndex(0);
    setCorrectCount(0);
    setAnswers([]);
    setDialogueIndex(0);
  }, []);

  const currentQuestion = questions[questionIndex];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Atmospheric Header */}
      <div className="text-center py-4">
        <h1 className="font-display text-3xl text-boston-gold">THE GAUNTLET</h1>
        {phase === 'question' && (
          <p className="text-boston-cream/50">
            Question {questionIndex + 1} of {GAME_CONSTANTS.GAUNTLET_QUESTIONS} | {correctCount} correct
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {/* Intro */}
        {phase === 'intro' && (
          <DialogueBox
            text={introDialogue[dialogueIndex].text}
            speakerName={introDialogue[dialogueIndex].speaker === 'npc' ? sully.name : 'Narrator'}
            speakerPortrait={introDialogue[dialogueIndex].speaker === 'npc' ? sully.portrait : undefined}
            onComplete={handleIntroAdvance}
          />
        )}

        {/* Question */}
        {phase === 'question' && currentQuestion && (
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-2xl"
          >
            <TriviaCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              timeLimit={45}
              inGauntlet={true}
            />
          </motion.div>
        )}

        {/* Result flash */}
        {phase === 'result' && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className={`text-6xl ${answers[answers.length - 1] ? 'text-green-400' : 'text-red-400'}`}>
              {answers[answers.length - 1] ? '✓' : '✗'}
            </div>
          </motion.div>
        )}

        {/* Passed */}
        {phase === 'passed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="text-8xl mb-4">🏆</div>
            <h2 className="font-display text-4xl text-boston-gold mb-4">
              The Bar Is Yours
            </h2>
            <p className="text-boston-cream/70 mb-2">
              {correctCount}/{GAME_CONSTANTS.GAUNTLET_QUESTIONS} correct
            </p>
            <p className="text-boston-cream/50 mb-8">
              Sully would be proud.
            </p>
            <Button size="lg" onClick={() => onNavigate('ending')}>
              See Your Ending
            </Button>
          </motion.div>
        )}

        {/* Failed */}
        {phase === 'failed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="text-6xl mb-4 opacity-50">🔒</div>
            <h2 className="font-display text-3xl text-red-400 mb-4">
              Not Quite
            </h2>
            <p className="text-boston-cream/70 mb-2">
              {correctCount}/{GAME_CONSTANTS.GAUNTLET_QUESTIONS} correct (needed {GAME_CONSTANTS.GAUNTLET_PASSING_THRESHOLD})
            </p>
            <p className="text-boston-cream/50 mb-8">
              The puzzle box remains locked.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={handleRetry}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => onNavigate('map')}>
                Return to Map
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Progress Dots */}
      {(phase === 'question' || phase === 'result') && (
        <div className="flex justify-center gap-2 pb-8">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${i < answers.length
                ? answers[i] ? 'bg-green-400' : 'bg-red-400'
                : i === questionIndex
                  ? 'bg-boston-gold'
                  : 'bg-boston-cream/20'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
