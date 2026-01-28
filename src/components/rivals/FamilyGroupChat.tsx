import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRival } from '../../contexts';

interface FamilyGroupChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FamilyGroupChat({ isOpen, onClose }: FamilyGroupChatProps) {
  const { state } = useRival();
  // Use messages from context instead of local state
  const messages = state.familyChatMessages;
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive and chat is open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setLastSeenCount(messages.length);
      setUnreadCount(0);
    }
  }, [messages.length, isOpen, isMinimized]);

  // Track unread messages when chat is closed or minimized
  useEffect(() => {
    if (!isOpen || isMinimized) {
      const newMessages = messages.length - lastSeenCount;
      if (newMessages > 0) {
        setUnreadCount(newMessages);
      }
    }
  }, [messages.length, isOpen, isMinimized, lastSeenCount]);

  // Reset unread count when opening chat
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
      setLastSeenCount(messages.length);
    }
  }, [isOpen, isMinimized, messages.length]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getMessageStyle = (rivalId: string) => {
    switch (rivalId) {
      case 'brendan':
        return 'bg-blue-900/50 border-blue-500/30';
      case 'maeve':
        return 'bg-purple-900/50 border-purple-500/30';
      default:
        return 'bg-gray-800/50 border-gray-500/30';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className={`
          fixed z-40
          ${isMinimized
            ? 'bottom-4 right-4 w-auto'
            : 'inset-x-4 bottom-4 md:right-4 md:left-auto md:w-96'
          }
        `}
      >
        {isMinimized ? (
          /* Minimized view */
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMinimized(false)}
            className="relative flex items-center gap-2 px-4 py-3 bg-boston-navy border border-boston-cream/20 rounded-lg shadow-xl"
          >
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-boston-navy overflow-hidden">
                <img
                  src={state.rivals.brendan.portrait}
                  alt="Brendan"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-600 border-2 border-boston-navy overflow-hidden">
                <img
                  src={state.rivals.maeve.portrait}
                  alt="Maeve"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            </div>
            <span className="text-boston-gold font-display text-sm">Family Chat</span>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>
        ) : (
          /* Full view */
          <div className="bg-boston-navy border border-boston-cream/20 rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-3 border-b border-boston-cream/20 bg-boston-navy">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  <div className="w-6 h-6 rounded-full bg-blue-600 border border-boston-navy" />
                  <div className="w-6 h-6 rounded-full bg-purple-600 border border-boston-navy" />
                </div>
                <span className="font-display text-boston-gold">O'Brien Family Chat</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-boston-cream/50 hover:text-boston-cream"
                  aria-label="Minimize"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button
                  onClick={onClose}
                  className="p-1 text-boston-cream/50 hover:text-boston-cream"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Online status */}
            <div className="flex items-center gap-4 px-3 py-2 border-b border-boston-cream/10 bg-boston-navy/50">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-boston-cream/70">Brendan</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-boston-cream/70">Maeve</span>
              </div>
            </div>

            {/* Messages */}
            <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-center text-boston-cream/50 text-sm py-4">
                  No messages yet. Your cousins will check in as the race progresses!
                </p>
              ) : (
                messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: msg.rivalId === 'brendan' ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex gap-2 ${msg.rivalId === 'system' ? 'justify-center' : ''}`}
                  >
                    {msg.rivalId !== 'system' && (
                      <div className={`w-8 h-8 flex-shrink-0 rounded-full border-2 overflow-hidden ${
                        msg.rivalId === 'brendan'
                          ? 'bg-blue-600 border-blue-400'
                          : 'bg-purple-600 border-purple-400'
                      }`}>
                        <img
                          src={state.rivals[msg.rivalId].portrait}
                          alt={state.rivals[msg.rivalId].name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className={`flex-1 ${msg.rivalId === 'system' ? 'text-center' : ''}`}>
                      {msg.rivalId !== 'system' && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className={`text-xs font-medium ${
                            msg.rivalId === 'brendan' ? 'text-blue-400' : 'text-purple-400'
                          }`}>
                            {state.rivals[msg.rivalId].name}
                          </span>
                          <span className="text-xs text-boston-cream/30">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      )}
                      <div className={`
                        inline-block px-3 py-2 rounded-lg border text-sm
                        ${msg.rivalId === 'system'
                          ? 'bg-boston-cream/10 border-boston-cream/20 text-boston-cream/70'
                          : `${getMessageStyle(msg.rivalId)} text-boston-cream`
                        }
                      `}>
                        {msg.text}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            <div className="px-3 py-2 border-t border-boston-cream/10">
              <p className="text-xs text-boston-cream/30 italic">
                Family members may message during your trivia run...
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Pre-defined messages for various game events (can be used to add context-specific messages)
export const FAMILY_CHAT_MESSAGES = {
  gameStart: [
    { rivalId: 'brendan' as const, text: "Alright fam, let's do this! May the best O'Brien win!" },
    { rivalId: 'maeve' as const, text: "Good luck everyone. Remember, it's all in good fun... mostly." },
  ],
  playerAhead: [
    { rivalId: 'brendan' as const, text: "Yo, you're actually doing pretty good! Don't let it go to your head tho 😏" },
    { rivalId: 'maeve' as const, text: "I see you're in the lead. Impressive, but there's still time." },
  ],
  playerBehind: [
    { rivalId: 'brendan' as const, text: "Bro you're falling behind! Pick it up!" },
    { rivalId: 'maeve' as const, text: "Don't get discouraged. Slow and steady can still win this." },
  ],
  rivalComplete: [
    { rivalId: 'brendan' as const, text: "BOOM! Just got another key! Who's the man?!" },
    { rivalId: 'maeve' as const, text: "Another location complete. Staying focused." },
  ],
  rivalFail: [
    { rivalId: 'brendan' as const, text: "Ugh, I choked on that one. Don't judge me 😤" },
    { rivalId: 'maeve' as const, text: "That was... humbling. Moving on." },
  ],
  nearGauntlet: [
    { rivalId: 'brendan' as const, text: "Almost at the gauntlet! This is where it gets real!" },
    { rivalId: 'maeve' as const, text: "The gauntlet approaches. May we all do our family proud." },
  ],
};
