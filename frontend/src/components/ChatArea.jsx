import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Sparkles, Zap, Code, Lightbulb, MessageCircle } from 'lucide-react';

const SUGGESTIONS = [
  { icon: Lightbulb, title: 'Explain a concept', prompt: 'Explain quantum entanglement in simple terms.' },
  { icon: Code, title: 'Write some code', prompt: 'Write a Python function to find prime numbers up to N.' },
  { icon: MessageCircle, title: 'Brainstorm ideas', prompt: 'Give me 5 creative startup ideas for 2025.' },
  { icon: Zap, title: 'Summarize text', prompt: 'Summarize the benefits of meditation in 3 bullet points.' },
];

export default function ChatArea({ messages, isStreaming }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isStreaming]);

  const isEmpty = messages.length === 0;

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      {isEmpty ? (
        <EmptyState />
      ) : (
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 space-y-6">
          {messages.map((m, i) => (
            <MessageBubble
              key={m.id}
              message={m}
              isStreaming={isStreaming && i === messages.length - 1 && m.role === 'assistant'}
            />
          ))}
          <div ref={bottomRef} className="h-1" />
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center px-4 py-12">
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
              onClick={() => {
                const ta = document.querySelector('textarea[data-chat-input]');
                if (ta) {
                  ta.value = s.prompt;
                  ta.focus();
                  ta.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }}
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