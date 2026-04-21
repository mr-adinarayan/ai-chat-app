import { useCallback, useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import {
  ArrowDown,
  Sparkles,
  Zap,
  Code,
  Lightbulb,
  MessageCircle,
} from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: Lightbulb,
    title: 'Explain a concept',
    prompt: 'Explain quantum entanglement in simple terms.',
  },
  {
    icon: Code,
    title: 'Write some code',
    prompt: 'Write a Python function to find prime numbers up to N.',
  },
  {
    icon: MessageCircle,
    title: 'Brainstorm ideas',
    prompt: 'Give me 5 creative startup ideas for 2025.',
  },
  {
    icon: Zap,
    title: 'Summarize text',
    prompt: 'Summarize the benefits of meditation in 3 bullet points.',
  },
];

const NEAR_BOTTOM_THRESHOLD = 80;

export default function ChatArea({
  chatId,
  messages,
  isStreaming,
  onSuggestionClick,
  onRegenerate,
}) {
  const containerRef = useRef(null);
  const pinnedRef = useRef(true);
  const prevLengthRef = useRef(messages.length);
  const prevChatIdRef = useRef(chatId);
  const [showJumpButton, setShowJumpButton] = useState(false);

  const updatePinnedState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom < NEAR_BOTTOM_THRESHOLD;
    pinnedRef.current = atBottom;
    setShowJumpButton(!atBottom && messages.length > 0);
  }, [messages.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updatePinnedState, { passive: true });
    return () => el.removeEventListener('scroll', updatePinnedState);
  }, [updatePinnedState]);

  // Snap to bottom on chat switch
  useEffect(() => {
    if (prevChatIdRef.current === chatId) return;
    prevChatIdRef.current = chatId;
    prevLengthRef.current = messages.length;

    requestAnimationFrame(() => {
      const el = containerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
      pinnedRef.current = true;
      setShowJumpButton(false);
    });
  }, [chatId, messages.length]);

  // Smart auto-scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const lengthIncreased = messages.length > prevLengthRef.current;
    prevLengthRef.current = messages.length;

    if (lengthIncreased) {
      requestAnimationFrame(() => {
        const e = containerRef.current;
        if (!e) return;
        e.scrollTop = e.scrollHeight;
        pinnedRef.current = true;
        setShowJumpButton(false);
      });
      return;
    }

    if (pinnedRef.current) {
      requestAnimationFrame(() => {
        const e = containerRef.current;
        if (e && pinnedRef.current) e.scrollTop = e.scrollHeight;
      });
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    pinnedRef.current = true;
    setShowJumpButton(false);
  }, []);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 relative overflow-hidden">
      <div ref={containerRef} className="h-full overflow-y-auto">
        {isEmpty ? (
          <EmptyState onSuggestion={onSuggestionClick} />
        ) : (
          <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 space-y-6">
            {messages.map((m, i) => {
              const isLastAssistant =
              m.role === 'assistant' && i === messages.length - 1 && !isStreaming;
            return (
              <MessageBubble
               key={m.id}
               message={m}
               isStreaming={
                isStreaming && i === messages.length - 1 && m.role === 'assistant'
              }
              isLastAssistant={isLastAssistant}
              onRegenerate={onRegenerate}
            />
          );
        })}
            <div className="h-4" />
          </div>
        )}
      </div>

      {showJumpButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-bg-panel/80 border border-border-subtle text-gray-200 hover:text-white hover:bg-bg-elev shadow-xl shadow-black/40 rounded-full w-10 h-10 flex items-center justify-center transition-all animate-fade-in backdrop-blur-md"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function EmptyState({ onSuggestion }) {
  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center animate-fade-in">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 items-center justify-center mb-6 shadow-xl shadow-violet-900/30">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          How can I help you today?
        </h2>
        <p className="text-gray-400 mb-10">
          Ask me anything. I can explain concepts, write code, brainstorm ideas, and much more.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestion?.(s.prompt)}
              className="group p-4 rounded-xl bg-bg-panel border border-border-subtle hover:border-violet-500/50 hover:bg-bg-elev text-left transition-all active:scale-[0.98]"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-bg-elev group-hover:bg-violet-500/10 flex items-center justify-center shrink-0 transition-colors">
                  <s.icon className="w-4 h-4 text-violet-400" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-white mb-1">{s.title}</div>
                  <div className="text-sm text-gray-400 truncate">{s.prompt}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}