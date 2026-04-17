import { useState, useRef, useCallback } from 'react';

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const clear = useCallback(() => {
    stop();
    setMessages([]);
    setError(null);
  }, [stop]);

  const sendMessage = useCallback(
    async (content, model) => {
      if (!content.trim() || isStreaming) return;
      setError(null);

      const userMsg = { id: uid(), role: 'user', content: content.trim() };
      const assistantMsg = { id: uid(), role: 'assistant', content: '' };

      const nextMessages = [...messages, userMsg];
      setMessages([...nextMessages, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMessages.map(({ role, content }) => ({ role, content })),
            model,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => '');
          throw new Error(errText || `Request failed: ${res.status}`);
        }

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
            const lines = evt.split('\n');
            let eventName = 'message';
            let dataStr = '';
            for (const line of lines) {
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
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: m.content + data.text } : m
                )
              );
            } else if (eventName === 'error') {
              throw new Error(data.message || 'Stream error');
            } else if (eventName === 'done') {
              // finalized
            }
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          // user-cancelled
        } else {
          console.error(err);
          setError(err.message || 'Something went wrong');
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id && !m.content
                ? { ...m, content: `⚠️ **Error:** ${err.message || 'Failed to get response.'}` }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming]
  );

  return { messages, isStreaming, error, sendMessage, stop, clear };
}