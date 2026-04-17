import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Square } from 'lucide-react';

export default function InputArea({ onSend, onStop, isStreaming }) {
  const [text, setText] = useState('');
  const taRef = useRef(null);

  // Auto-resize
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const max = 200;
    ta.style.height = Math.min(ta.scrollHeight, max) + 'px';
  }, [text]);

  // Listen for external input events (from suggestion clicks)
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const handler = () => setText(ta.value);
    ta.addEventListener('input', handler);
    return () => ta.removeEventListener('input', handler);
  }, []);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setText('');
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border-subtle bg-bg/80 backdrop-blur-md px-3 sm:px-6 py-3 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="max-w-3xl mx-auto">
        <div
          className={`
            relative flex items-end gap-2 p-2 rounded-2xl
            bg-bg-panel border transition-all
            ${text ? 'border-violet-500/50 shadow-lg shadow-violet-900/10' : 'border-border-subtle'}
          `}
        >
          <textarea
            ref={taRef}
            data-chat-input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message Nova…"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none px-3 py-2 text-[15px] text-white placeholder-gray-500 leading-relaxed max-h-[200px]"
          />

          {isStreaming ? (
            <button
              onClick={onStop}
              className="shrink-0 w-10 h-10 rounded-xl bg-bg-elev hover:bg-red-500/20 border border-border-subtle hover:border-red-500/50 text-gray-300 hover:text-red-400 flex items-center justify-center transition-all active:scale-95"
              title="Stop generating"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 disabled:from-bg-elev disabled:to-bg-elev disabled:text-gray-600 text-white flex items-center justify-center transition-all active:scale-95 disabled:cursor-not-allowed shadow-lg shadow-violet-900/20 disabled:shadow-none"
              title="Send message"
            >
              <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}
        </div>
        <div className="text-center text-xs text-gray-500 mt-2 px-2">
          <span className="hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 bg-bg-elev border border-border-subtle rounded text-[10px]">Enter</kbd> to send,{' '}
            <kbd className="px-1.5 py-0.5 bg-bg-elev border border-border-subtle rounded text-[10px]">Shift+Enter</kbd> for new line
          </span>
          <span className="sm:hidden">AI may produce inaccurate info. Verify important facts.</span>
        </div>
      </div>
    </div>
  );
}