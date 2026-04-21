import { useCallback, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import InputArea from './InputArea';
import ModelSwitcher from './ModelSwitcher';
import SettingsModal from './SettingsModal';
import { DEFAULT_SETTINGS } from '../utils/constants';
import { useChat } from '../hooks/useChat';
import { useChats } from '../hooks/useChats';
import { Menu, Sparkles, Settings as SettingsIcon, Loader2 } from 'lucide-react';

const MODELS = [
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', desc: 'Fastest · Great for everyday tasks' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', desc: 'Balanced · Smart & capable' },
  { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', desc: 'Most powerful · Deep reasoning' },
];

const SETTINGS_KEY = 'nova-chat:settings';
const MODEL_KEY = 'nova-chat:model';

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
function loadModel() {
  try {
    const saved = localStorage.getItem(MODEL_KEY);
    if (saved && MODELS.find((m) => m.id === saved)) return saved;
  } catch (err) {
  console.error(err);
}
  return MODELS[1].id;
}

export default function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [model, setModel] = useState(loadModel);
  const [settings, setSettings] = useState(loadSettings);

  const {
    chats,
    activeChatId,
    activeMessages,
    loading,
    createNewChat,
    selectChat,
    deleteChat,
    renameChat,
    updateChatMessages,
    markChatPersisted,
  } = useChats();

  const handleFirstSend = useCallback(
    (chatId, title) => markChatPersisted(chatId, { title }),
    [markChatPersisted]
  );

  const { isStreaming, sendMessage, stop, regenerate, clear } = useChat({
  chatId: activeChatId,
  messages: activeMessages,
  updateMessages: updateChatMessages,
  onFirstSend: handleFirstSend,
  onNeedApiKey: () => setSettingsOpen(true), // Opens settings if API key is missing
});

  // Persist UI prefs (not chats — those live in Mongo)
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem(MODEL_KEY, model);
  }, [model]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

 const handleSend = (payload) => {
    sendMessage(payload, {
      model,
      system: settings.systemPrompt,
      chatId: activeChatId,
      title: currentTitle,
    });
  };

  const handleNewChat = () => {
    createNewChat();
    setSidebarOpen(false);
  };

  const handleSelectChat = (chatId) => {
    selectChat(chatId);
    setSidebarOpen(false);
  };

  // Find the title of the current active chat
  const currentChat = chats.find(c => c.id === activeChatId);
  const currentTitle = currentChat?.title || "New Chat";
  
  return (
    <div className="flex h-[100dvh] w-full bg-bg text-gray-200 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onOpenSettings={() => {
          setSettingsOpen(true);
          setSidebarOpen(false);
        }}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onRenameChat={renameChat}
        onDeleteChat={deleteChat}
        loading={loading}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
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
              <h1 className="text-base font-semibold text-white truncate">
                Nova Chat
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ModelSwitcher models={MODELS} value={model} onChange={setModel} />
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-elev transition-colors"
              title="Settings"
              aria-label="Settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </header>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading your chats…
          </div>
        ) : (
          <ChatArea
            chatId={activeChatId}
            messages={activeMessages}
            isStreaming={isStreaming}
            // Update this specific prop:
            onSuggestionClick={(prompt) => 
              sendMessage(
                { text: prompt, images: [], documents: [] },
                { model, system: settings.systemPrompt, chatId: activeChatId }
              )
            }
            onClear={clear}
            onRegenerate={() =>
              regenerate({
                model,
                system: settings.systemPrompt,
                chatId: activeChatId,
                title: currentTitle,
              })
            }
          />
        )}

        <InputArea
          onSend={handleSend}
          onStop={stop}
          isStreaming={isStreaming}
        />
      </div>

      <SettingsModal
        key={settingsOpen ? 'open' : 'closed'}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />
    </div>
  );
}