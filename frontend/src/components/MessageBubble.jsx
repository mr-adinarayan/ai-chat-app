import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Sparkles, Copy, Check } from 'lucide-react';
import CodeBlock from './CodeBlock';

export default function MessageBubble({ message, isStreaming }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div
      className={`flex gap-3 sm:gap-4 animate-slide-up ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isUser
              ? 'bg-bg-elev border border-border-subtle'
              : 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
          }`}
        >
          {isUser ? (
            <User className="w-4 h-4 text-gray-300" />
          ) : (
            <Sparkles className="w-4 h-4 text-white" />
          )}
        </div>
      </div>

      {/* Bubble */}
      <div className={`flex-1 min-w-0 ${isUser ? 'flex justify-end' : ''}`}>
        <div
          className={`
            group relative inline-block max-w-full
            ${
              isUser
                ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-lg shadow-violet-900/20'
                : 'text-gray-100 w-full'
            }
          `}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
              {message.content}
            </div>
          ) : (
            <div className="prose-chat break-words">
              {message.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      if (inline) {
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                      return (
                        <CodeBlock
                          language={match ? match[1] : 'text'}
                          value={String(children).replace(/\n$/, '')}
                        />
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <TypingIndicator />
              )}
              {isStreaming && message.content && (
                <span className="inline-block w-1.5 h-4 ml-0.5 align-[-2px] bg-violet-400 animate-pulse-soft" />
              )}
            </div>
          )}

          {/* Copy button for assistant */}
          {!isUser && message.content && !isStreaming && (
            <button
              onClick={copyAll}
              className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-200 hover:bg-bg-elev rounded-md transition-colors"
              title="Copy message"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center py-1">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}