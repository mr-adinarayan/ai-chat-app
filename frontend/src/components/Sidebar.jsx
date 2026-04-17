import { X, Plus, MessageSquare, Sparkles, Zap } from 'lucide-react';

export default function Sidebar({ isOpen, onClose, onNewChat, messages }) {
  const preview =
    messages.find((m) => m.role === 'user')?.content?.slice(0, 40) || 'New conversation';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-72 bg-bg-soft border-r border-border-subtle
          flex flex-col
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">Nova Chat</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md hover:bg-bg-elev text-gray-400"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium transition-all shadow-lg shadow-violet-900/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            New chat
          </button>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <div className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Recent
          </div>
          {messages.length > 0 ? (
            <div className="px-1 py-2 rounded-lg bg-bg-elev/60 border border-border-subtle">
              <div className="flex items-start gap-2 px-2">
                <MessageSquare className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-200 truncate">{preview}</span>
              </div>
            </div>
          ) : (
            <div className="px-3 py-6 text-center text-sm text-gray-500">
              No conversations yet
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border-subtle space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
            <Zap className="w-3.5 h-3.5" />
            Powered by Anthropic
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-bg-elev rounded-lg transition-colors"
          >
            View source
          </a>
        </div>
      </aside>
    </>
  );
}