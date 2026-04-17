import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import InputArea from './InputArea';
import ModelSwitcher from './ModelSwitcher';
import { useChat } from '../hooks/useChat';
import { Menu, Sparkles, Trash2 } from 'lucide-react';

const MODELS = [
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', desc: 'Fastest · Great for everyday tasks' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', desc: 'Balanced · Smart & capable' },
  { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', desc: 'Most powerful · Deep reasoning' },
];

export default function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [model, setModel] = useState(MODELS[1].id);
  const { messages, isStreaming, sendMessage, stop, clear } = useChat();

  // Close sidebar on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="flex h-[100dvh] w-full bg-bg text-gray-200 overflow-hidden">
      {/* Sidebar — desktop persistent, mobile drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={clear}
        messages={messages}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <header className="glass border-b border-border-subtle px-3 sm:px-6 py-3 flex items-center justify-between gap-3 z-20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-bg-elev transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-base font-semibold text-white truncate">Nova Chat</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ModelSwitcher models={MODELS} value={model} onChange={setModel} />
            {messages.length > 0 && (
              <button
                onClick={clear}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-bg-elev rounded-lg transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">Clear</span>
              </button>
            )}
          </div>
        </header>

        {/* Chat area */}
        <ChatArea messages={messages} isStreaming={isStreaming} />

        {/* Input */}
        <InputArea
          onSend={(text) => sendMessage(text, model)}
          onStop={stop}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}