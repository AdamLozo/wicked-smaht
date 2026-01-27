import { motion, AnimatePresence } from 'framer-motion';
import { useLifeline } from '../../contexts';
import { LIFELINE_COSTS } from '../../types';

interface LifelinePanelProps {
  inGauntlet?: boolean;
  inRedemption?: boolean;
  onLifelineSelect?: (lifeline: 'fifty_fifty' | 'ask_the_bar' | 'phone_a_local' | 'skip_and_replace') => void;
  isPaused?: boolean;
}

interface LifelineButtonProps {
  id: 'fifty_fifty' | 'ask_the_bar' | 'phone_a_local' | 'skip_and_replace';
  label: string;
  shortLabel: string;
  cost: number | 'FREE';
  remaining: number | boolean;
  maxUses?: number;
  available: boolean;
  locked: boolean;
  onClick: () => void;
}

function LifelineButton({
  label,
  shortLabel,
  cost,
  remaining,
  maxUses,
  available,
  locked,
  onClick,
}: LifelineButtonProps) {
  const isDisabled = !available || locked;
  const displayRemaining = typeof remaining === 'boolean' ? (remaining ? 0 : 1) : remaining;
  const displayMax = maxUses || (typeof remaining === 'boolean' ? 1 : 3);

  // Generate dots for remaining uses
  const dots = [];
  for (let i = 0; i < displayMax; i++) {
    dots.push(
      <span
        key={i}
        className={`inline-block w-2 h-2 rounded-full ${
          i < displayRemaining ? 'bg-boston-gold' : 'bg-boston-cream/30'
        }`}
        aria-hidden="true"
      />
    );
  }

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative flex flex-col items-center gap-1 p-3 rounded-lg
        transition-all duration-200 min-w-[80px]
        ${isDisabled
          ? 'bg-boston-navy/50 cursor-not-allowed opacity-50'
          : 'bg-southie-blue hover:bg-southie-blue/80 cursor-pointer'
        }
        ${available ? 'ring-1 ring-boston-gold/30' : ''}
      `}
      aria-label={`${label}. ${cost === 'FREE' ? 'Free' : `${cost} points`}. ${
        typeof remaining === 'number' ? `${remaining} remaining` : remaining ? 'Available' : 'Used'
      }`}
      aria-disabled={isDisabled}
    >
      {locked && (
        <div className="absolute -top-1 -right-1 bg-boston-brick rounded-full p-1" aria-label="Locked">
          <svg className="w-3 h-3 text-boston-cream" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      <span className="text-xs font-medium text-boston-cream uppercase tracking-wide">
        {shortLabel}
      </span>

      <div className="flex gap-1" aria-label={`${displayRemaining} of ${displayMax} uses remaining`}>
        {dots}
      </div>

      <span className={`text-xs ${cost === 'FREE' ? 'text-boston-green' : 'text-boston-gold/70'}`}>
        {cost === 'FREE' ? 'FREE' : `${cost} pts`}
      </span>
    </motion.button>
  );
}

export function LifelinePanel({
  inGauntlet = false,
  inRedemption = false,
  onLifelineSelect,
  isPaused = false,
}: LifelinePanelProps) {
  const {
    state,
    config,
    canUseFiftyFifty,
    canUseAskTheBar,
    canUsePhoneLocal,
    canUseSkipReplace,
    getSkipReplaceCost,
  } = useLifeline();

  const handleLifelineClick = (lifeline: 'fifty_fifty' | 'ask_the_bar' | 'phone_a_local' | 'skip_and_replace') => {
    if (onLifelineSelect) {
      onLifelineSelect(lifeline);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isPaused ? 0.5 : 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-boston-navy/80 backdrop-blur-sm rounded-xl p-4 border border-boston-cream/20"
      >
        <h3 className="text-xs font-display uppercase tracking-wider text-boston-cream/70 mb-3 text-center">
          Lifelines
        </h3>

        <div className="flex flex-wrap justify-center gap-2">
          <LifelineButton
            id="fifty_fifty"
            label="50/50 - Eliminate Two"
            shortLabel="50/50"
            cost={LIFELINE_COSTS.fifty_fifty}
            remaining={state.fiftyFifty.remaining}
            maxUses={config.fiftyFiftyMax}
            available={canUseFiftyFifty(inGauntlet, inRedemption)}
            locked={inGauntlet && state.fiftyFifty.usedInGauntlet}
            onClick={() => handleLifelineClick('fifty_fifty')}
          />

          <LifelineButton
            id="ask_the_bar"
            label="Ask the Bar - NPC Clue"
            shortLabel="Ask Bar"
            cost="FREE"
            remaining={!state.askTheBar.usedThisLocation}
            maxUses={config.askTheBarPerLocation}
            available={canUseAskTheBar(inGauntlet, inRedemption)}
            locked={inGauntlet}
            onClick={() => handleLifelineClick('ask_the_bar')}
          />

          <LifelineButton
            id="phone_a_local"
            label="Phone a Local - Detailed Context"
            shortLabel="Phone"
            cost={LIFELINE_COSTS.phone_a_local}
            remaining={state.phoneLocal.remaining}
            maxUses={config.phoneLocalMax}
            available={canUsePhoneLocal(inGauntlet, inRedemption)}
            locked={inGauntlet && state.phoneLocal.usedInGauntlet}
            onClick={() => handleLifelineClick('phone_a_local')}
          />

          <LifelineButton
            id="skip_and_replace"
            label="Skip and Replace - New Question"
            shortLabel="Skip"
            cost={getSkipReplaceCost()}
            remaining={state.skipReplace.remaining}
            maxUses={config.skipReplaceMax}
            available={canUseSkipReplace(inGauntlet, inRedemption)}
            locked={inGauntlet}
            onClick={() => handleLifelineClick('skip_and_replace')}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
