import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  User,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  FileText,
} from 'lucide-react';
import CodeBlock from './CodeBlock';

export default function MessageBubble({
  message,
  isStreaming,
  isLastAssistant,
  onRegenerate,
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error(err);
    }
  };

  const attachments = Array.isArray(message.attachments)
    ? message.attachments
    : [];
  const documents = Array.isArray(message.documents) ? message.documents : [];

  return (
    <>
      <div
        className={`flex gap-3 sm:gap-4 animate-slide-up ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
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

        <div className={`flex-1 min-w-0 ${isUser ? 'flex justify-end' : ''}`}>
          <div
            className={`
              group relative inline-block max-w-full
              ${
                isUser
                  ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-2xl rounded-tr-sm px-3 py-2.5 shadow-lg shadow-violet-900/20'
                  : 'text-gray-100 w-full'
              }
            `}
          >
            {isUser ? (
              <div className="space-y-2">
                {/* Image attachments */}
                {attachments.length > 0 && (
                  <div
                    className={`grid gap-1.5 ${
                      attachments.length === 1
                        ? 'grid-cols-1'
                        : 'grid-cols-2 max-w-[260px]'
                    }`}
                  >
                    {attachments.map((att) => (
                      <button
                        key={att.id}
                        onClick={() => setLightbox(att)}
                        className="relative block rounded-lg overflow-hidden bg-black/30 border border-white/10 hover:border-white/30 transition-all"
                      >
                        <img
                          src={att.dataUrl}
                          alt={att.name || 'attachment'}
                          className="w-full max-h-56 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Document chips */}
                {documents.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                    {documents.map((d) => (
                      <div
                        key={d.id || d.name}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/30 border border-white/10 text-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[140px]">
                          {d.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {message.content && (
                  <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed px-1">
                    {message.content}
                  </div>
                )}
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

            {/* Assistant toolbar */}
            {!isUser && message.content && !isStreaming && (
              <div className="mt-2 flex items-center gap-1">
                <button
                  onClick={copyAll}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-gray-200 hover:bg-bg-elev rounded-md transition-colors"
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
                {isLastAssistant && onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 hover:text-violet-300 hover:bg-bg-elev rounded-md transition-colors"
                    title="Regenerate response"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regenerate
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.dataUrl}
            alt={lightbox.name || ''}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </>
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