import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  X,
  Plus,
  MessageSquare,
  Sparkles,
  Settings as SettingsIcon,
  Zap,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  onNewChat,
  onOpenSettings,
  chats = [],
  activeChatId,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
}) {
  const { user } = useUser();
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');

  const startEdit = (chat, e) => {
    e.stopPropagation();
    setEditingId(chat.chatId);
    setDraftTitle(chat.title || '');
  };

  const commitEdit = (chatId) => {
    const t = draftTitle.trim();
    if (t) onRenameChat?.(chatId, t);
    setEditingId(null);
  };

  return (
    <>
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30 animate-fade-in"
          onClick={onClose}
        />
      )}

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

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <div className="px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Recent
          </div>

          {chats.length > 0 ? (
            <div className="space-y-0.5">
              {chats.map((chat) => {
                const isActive = chat.chatId === activeChatId;
                const isEditing = editingId === chat.chatId;
                return (
                  <div
                    key={chat.chatId}
                    onClick={() => !isEditing && onSelectChat?.(chat.chatId)}
                    className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer border transition-colors ${
                      isActive
                        ? 'bg-violet-500/15 border-violet-500/30'
                        : 'border-transparent hover:bg-bg-elev'
                    }`}
                  >
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-violet-400' : 'text-gray-500'
                      }`}
                    />
                    {isEditing ? (
                      <input
                        autoFocus
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit(chat.chatId);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onBlur={() => commitEdit(chat.chatId)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-0 bg-bg border border-border-subtle rounded px-2 py-0.5 text-sm text-white outline-none focus:border-violet-500"
                      />
                    ) : (
                      <span
                        className={`flex-1 text-sm truncate ${
                          isActive ? 'text-white' : 'text-gray-300'
                        }`}
                      >
                        {chat.title || 'Untitled'}
                      </span>
                    )}

                    <div
                      className={`flex items-center shrink-0 ${
                        isEditing
                          ? ''
                          : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
                      } transition-opacity`}
                    >
                      {!isEditing && (
                        <button
                          onClick={(e) => startEdit(chat, e)}
                          title="Rename"
                          className="p-1 rounded text-gray-400 hover:text-white hover:bg-bg-panel"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat?.(chat.chatId);
                        }}
                        title="Delete"
                        className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-bg-panel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-6 text-center text-sm text-gray-500">
              No conversations yet
            </div>
          )}
        </div>

        {/* Footer — user tile opens Settings (no Clerk popover anymore) */}
        <div className="p-3 border-t border-border-subtle space-y-1">
          <button
            onClick={() => {
              onOpenSettings?.();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-bg-elev transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center overflow-hidden shrink-0">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-white">
                  {(
                    user?.firstName?.[0] ||
                    user?.username?.[0] ||
                    user?.primaryEmailAddress?.emailAddress?.[0] ||
                    'U'
                  ).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user?.fullName ||
                  user?.username ||
                  user?.primaryEmailAddress?.emailAddress ||
                  'Account'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                Settings & account
              </div>
            </div>
            <SettingsIcon className="w-4 h-4 text-gray-400 shrink-0" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500">
            <Zap className="w-3.5 h-3.5" />
            Powered by Anthropic
          </div>
        </div>
      </aside>
    </>
  );
}