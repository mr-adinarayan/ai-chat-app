import { useCallback, useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApi } from './useApi';

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const makeEmptyChat = () => ({
  chatId: uid(),
  title: 'New chat',
  messages: [],
  isLocalOnly: true, // not yet in Mongo
});

/**
 * Manages the user's chat list + active chat.
 * Source of truth = MongoDB (via the backend API).
 */
export function useChats() {
  const api = useApi();
  const { isLoaded, isSignedIn } = useUser();

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [loading, setLoading] = useState(true);

  const initRan = useRef(false);
  const chatsRef = useRef(chats);
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  // ─────────── Initial load ───────────
  useEffect(() => {
    if (!isLoaded || !isSignedIn || initRan.current) return;
    initRan.current = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api('/api/chats');
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const { chats: dbChats } = await res.json();
        if (!dbChats?.length) {
          const blank = makeEmptyChat();
          setChats([blank]);
          setActiveChatId(blank.chatId);
        } else {
          // metadata-only; messages will be lazily fetched
          setChats(dbChats.map((c) => ({ ...c, messages: undefined })));
          setActiveChatId(dbChats[0].chatId);
        }
      } catch (err) {
        console.error('[useChats] load failed', err);
        const blank = makeEmptyChat();
        setChats([blank]);
        setActiveChatId(blank.chatId);
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, isSignedIn, api]);

  // ─────────── Lazy hydrate messages ───────────
  const hydrateChat = useCallback(
    async (chatId) => {
      const existing = chatsRef.current.find((c) => c.chatId === chatId);
      if (!existing || existing.isLocalOnly) return;
      if (Array.isArray(existing.messages)) return;

      try {
        const res = await api(`/api/chats/${encodeURIComponent(chatId)}`);
        if (!res.ok) throw new Error('Failed to load chat');
        const { chat } = await res.json();
        setChats((prev) =>
          prev.map((c) =>
            c.chatId === chatId ? { ...c, messages: chat.messages || [] } : c
          )
        );
      } catch (err) {
        console.error('[useChats] hydrate failed', err);
      }
    },
    [api]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeChatId) hydrateChat(activeChatId);
  }, [activeChatId, hydrateChat]);

  // ─────────── Actions ───────────
  const createNewChat = useCallback(() => {
    setChats((prev) => {
      // reuse a blank chat if one's already active
      const active = prev.find((c) => c.chatId === activeChatId);
      if (
        active &&
        active.isLocalOnly &&
        (!active.messages || active.messages.length === 0)
      ) {
        return prev;
      }
      const fresh = makeEmptyChat();
      setActiveChatId(fresh.chatId);
      return [fresh, ...prev];
    });
  }, [activeChatId]);

  const selectChat = useCallback((chatId) => {
    setActiveChatId(chatId);
  }, []);

  const deleteChat = useCallback(
    async (chatId) => {
      const target = chatsRef.current.find((c) => c.chatId === chatId);
      if (!target) return;

      setChats((prev) => prev.filter((c) => c.chatId !== chatId));

      if (!target.isLocalOnly) {
        try {
          await api(`/api/chats/${encodeURIComponent(chatId)}`, {
            method: 'DELETE',
          });
        } catch (err) {
          console.error('[useChats] delete failed', err);
        }
      }

      // If we deleted the active chat, pick a sibling or spawn a new one
      if (activeChatId === chatId) {
        const remaining = chatsRef.current.filter((c) => c.chatId !== chatId);
        if (remaining.length) {
          setActiveChatId(remaining[0].chatId);
        } else {
          const blank = makeEmptyChat();
          setChats([blank]);
          setActiveChatId(blank.chatId);
        }
      }
    },
    [api, activeChatId]
  );

  const renameChat = useCallback(
    async (chatId, newTitle) => {
      const title = (newTitle || '').trim();
      if (!title) return;

      setChats((prev) =>
        prev.map((c) => (c.chatId === chatId ? { ...c, title } : c))
      );

      const target = chatsRef.current.find((c) => c.chatId === chatId);
      if (target && !target.isLocalOnly) {
        try {
          await api(`/api/chats/${encodeURIComponent(chatId)}`, {
            method: 'PATCH',
            body: JSON.stringify({ title }),
          });
        } catch (err) {
          console.error('[useChats] rename failed', err);
        }
      }
    },
    [api]
  );

  // Takes (chatId, updater) so streaming can safely target a specific chat
  // even if the user has switched away mid-stream.
  const updateChatMessages = useCallback((chatId, updater) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.chatId !== chatId) return c;
        const current = Array.isArray(c.messages) ? c.messages : [];
        const next = typeof updater === 'function' ? updater(current) : updater;
        return { ...c, messages: next };
      })
    );
  }, []);

  const markChatPersisted = useCallback((chatId, patch = {}) => {
    setChats((prev) =>
      prev.map((c) =>
        c.chatId === chatId ? { ...c, ...patch, isLocalOnly: false } : c
      )
    );
  }, []);

  const activeChat = chats.find((c) => c.chatId === activeChatId) || null;
  const activeMessages = Array.isArray(activeChat?.messages)
    ? activeChat.messages
    : [];

  return {
    chats,
    activeChatId,
    activeChat,
    activeMessages,
    loading,
    createNewChat,
    selectChat,
    deleteChat,
    renameChat,
    updateChatMessages,
    markChatPersisted,
  };
}