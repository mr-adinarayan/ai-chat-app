import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

export function useChat({
  initialMessages = [],
  onMessagesChange,
  onNeedApiKey,
} = {}) {
  const [messages, setMessages] = useState(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const { getToken } = useAuth();

  const syncExternal = useCallback(
    (updater) => {
      setMessages((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        onMessagesChange?.(next);
        return next;
      });
    },
    [onMessagesChange]
  );

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const clear = useCallback(() => {
    stop();
    syncExternal([]);
    setError(null);
  }, [stop, syncExternal]);

  const setAllMessages = useCallback(
    (next) => syncExternal(next),
    [syncExternal]
  );

  // ── core streaming routine (used by send + regenerate) ──
  const streamInto = useCallback(
    async (historyForApi, assistantMsgId, options = {}) => {
      setError(null);
      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const token = await getToken();
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: historyForApi.map(
              ({ role, content, attachments, documents }) => ({
                role,
                content,
                attachments,
                documents,
              })
            ),
            model: options.model,
            system: options.system,
            chatId: options.chatId,
            title: options.title,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          let code = '';
          let msg = `Request failed: ${res.status}`;
          try {
            const j = await res.json();
            code = j.error || '';
            msg = j.message || j.error || msg;
          } catch (err) {
  console.error(err);
}
          if (code === 'NO_API_KEY') {
            onNeedApiKey?.();
            throw new Error(msg);
          }
          throw new Error(msg);
        }
        if (!res.body) throw new Error('Empty response body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const evt of events) {
            if (!evt.trim()) continue;
            let eventName = 'message';
            let dataStr = '';
            for (const line of evt.split('\n')) {
              if (line.startsWith('event:')) eventName = line.slice(6).trim();
              else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
            }
            if (!dataStr) continue;

            let data;
            try {
              data = JSON.parse(dataStr);
            } catch {
              continue;
            }

            if (eventName === 'delta' && data.text) {
              syncExternal((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + data.text }
                    : m
                )
              );
            } else if (eventName === 'error') {
              throw new Error(data.message || 'Stream error');
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[streamInto]', err);
        setError(err.message);
        syncExternal((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId && !m.content
              ? {
                  ...m,
                  content: `⚠️ **Error:** ${err.message || 'Failed'}`,
                  error: true,
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [getToken, syncExternal, onNeedApiKey]
  );

  const sendMessage = useCallback(
    async (payload, options = {}) => {
      // payload can be a string (back-compat) OR { text, images, documents }
      const isObj = payload && typeof payload === 'object' && !Array.isArray(payload);
      const text = (isObj ? payload.text : payload) || '';
      const images = isObj ? payload.images || [] : options.attachments || [];
      const documents = isObj ? payload.documents || [] : [];

      const trimmed = text.trim();
      if (
        (!trimmed && images.length === 0 && documents.length === 0) ||
        isStreaming
      )
        return;

      const userMsg = {
        id: uid(),
        role: 'user',
        content: trimmed,
        attachments: images.length ? images : undefined,
        documents: documents.length ? documents : undefined,
        createdAt: Date.now(),
      };
      const assistantMsg = {
        id: uid(),
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      };

      let apiHistory;
      syncExternal((prev) => {
        apiHistory = [...prev, userMsg];
        return [...apiHistory, assistantMsg];
      });

      await streamInto(apiHistory, assistantMsg.id, options);
    },
    [isStreaming, syncExternal, streamInto]
  );

  const regenerate = useCallback(
    async (options = {}) => {
      if (isStreaming) return;
      const current = messages;

      // find last assistant
      let lastAssistantIdx = -1;
      for (let i = current.length - 1; i >= 0; i--) {
        if (current[i].role === 'assistant') {
          lastAssistantIdx = i;
          break;
        }
      }
      if (lastAssistantIdx === -1) return;

      const truncated = current.slice(0, lastAssistantIdx);
      if (
        truncated.length === 0 ||
        truncated[truncated.length - 1].role !== 'user'
      )
        return;

      const assistantMsg = {
        id: uid(),
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      };

      syncExternal([...truncated, assistantMsg]);
      await streamInto(truncated, assistantMsg.id, options);
    },
    [messages, isStreaming, syncExternal, streamInto]
  );

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    regenerate,
    stop,
    clear,
    setAllMessages,
  };
}