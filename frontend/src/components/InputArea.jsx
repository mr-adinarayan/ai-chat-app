import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  X,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  fileToBase64DataUrl,
  formatBytes,
} from '../utils/imageUtils';
import {
  extractTextFromFile,
  isDocFile,
  validateDocFile,
  ACCEPTED_DOC_MIMES,
} from '../utils/documentUtils';

const uid = () => Math.random().toString(36).slice(2);
const ACCEPT_ATTR = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  ...ACCEPTED_DOC_MIMES,
  '.pdf',
  '.txt',
].join(',');

export default function InputArea({ onSend, onStop, isStreaming }) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]); // images
  const [documents, setDocuments] = useState([]);     // pdf/txt
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  const taRef = useRef(null);
  const fileRef = useRef(null);
  const errorTimerRef = useRef(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [text]);

  const showError = (msg) => {
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(null), 4500);
  };

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setProcessing(true);
    const failures = [];
    const images = [];
    const docs = [];

    for (const file of files) {
      try {
        if (file.type.startsWith('image/')) {
          const dataUrl = await fileToBase64DataUrl(file);
          images.push({
            kind: 'image',
            id: uid(),
            type: 'image',
            name: file.name,
            size: file.size,
            mediaType: file.type,
            dataUrl,
          });
        } else if (isDocFile(file)) {
          const err = validateDocFile(file);
          if (err) throw new Error(err);
          const text = await extractTextFromFile(file);
          docs.push({
            kind: 'document',
            id: uid(),
            name: file.name,
            size: file.size,
            mediaType: file.type || 'text/plain',
            text,
          });
        } else {
          failures.push(`"${file.name}": unsupported type.`);
        }
      } catch (err) {
        failures.push(err.message);
      }
    }

    if (images.length) setAttachments((p) => [...p, ...images]);
    if (docs.length) setDocuments((p) => [...p, ...docs]);
    if (failures.length) showError(failures.join(' '));
    setProcessing(false);
  };

  const onFilePick = async (e) => {
    await addFiles(e.target.files);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const list = Array.from(e.dataTransfer?.files || []);
    if (list.length) await addFiles(list);
  };

  const onPaste = async (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const files = items
      .filter((i) => i.kind === 'file' && i.type.startsWith('image/'))
      .map((i) => i.getAsFile())
      .filter(Boolean);
    if (files.length) {
      e.preventDefault();
      await addFiles(files);
    }
  };

  const removeAttachment = (id) =>
    setAttachments((prev) => prev.filter((a) => a.id !== id));

  const removeDocument = (id) =>
    setDocuments((prev) => prev.filter((d) => d.id !== id));

  const canSubmit =
    (text.trim() || attachments.length > 0 || documents.length > 0) &&
    !isStreaming &&
    !processing;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const trimmed = text.trim();

    onSend({
      text: trimmed,
      images: attachments,
      documents,
    });

    setText('');
    setAttachments([]);
    setDocuments([]);
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
        {error && (
          <div className="mb-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300 animate-slide-up">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-300/70 hover:text-red-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`
            relative rounded-2xl bg-bg-panel border transition-all
            ${
              isDragging
                ? 'border-violet-500 bg-violet-500/5 shadow-lg shadow-violet-900/20'
                : text || attachments.length || documents.length
                ? 'border-violet-500/50 shadow-lg shadow-violet-900/10'
                : 'border-border-subtle'
            }
          `}
        >
          {(attachments.length > 0 || documents.length > 0) && (
            <div className="flex flex-wrap gap-2 p-2.5 border-b border-border-subtle">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="group relative w-16 h-16 rounded-lg overflow-hidden border border-border-subtle bg-bg-elev animate-fade-in"
                >
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3 h-3" strokeWidth={2.5} />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 px-1 py-0.5 text-[10px] font-medium text-white/90 truncate bg-gradient-to-t from-black/70 to-transparent">
                    {formatBytes(att.size)}
                  </div>
                </div>
              ))}
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="group relative flex items-center gap-2 pl-2 pr-7 py-2 rounded-lg border border-border-subtle bg-bg-elev animate-fade-in max-w-[220px]"
                >
                  <div className="w-8 h-8 rounded-md bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate">
                      {doc.name}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {formatBytes(doc.size)} · {Math.round(doc.text.length / 4)} tok est.
                    </div>
                  </div>
                  <button
                    onClick={() => removeDocument(doc.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/40 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-1 p-2">
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT_ATTR}
              multiple
              onChange={onFilePick}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isStreaming || processing}
              className="shrink-0 w-10 h-10 rounded-xl text-gray-400 hover:text-violet-400 hover:bg-bg-elev disabled:text-gray-700 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-95"
              title="Attach image, PDF or TXT"
              aria-label="Attach file"
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5" />
              )}
            </button>

            <textarea
              ref={taRef}
              data-chat-input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              placeholder={
                attachments.length || documents.length
                  ? 'Describe the file or ask a question…'
                  : 'Message Nova…'
              }
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none px-2 py-2 text-[15px] text-white placeholder-gray-500 leading-relaxed max-h-[200px]"
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
                disabled={!canSubmit}
                className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 disabled:from-bg-elev disabled:to-bg-elev disabled:text-gray-600 text-white flex items-center justify-center transition-all active:scale-95 disabled:cursor-not-allowed shadow-lg shadow-violet-900/20 disabled:shadow-none"
                title="Send message"
              >
                <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
              </button>
            )}
          </div>

          {isDragging && (
            <div className="absolute inset-0 rounded-2xl bg-violet-500/5 border-2 border-dashed border-violet-500 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-2 text-violet-300 font-medium">
                <ImageIcon className="w-5 h-5" />
                Drop images, PDFs or TXT files
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-500 mt-2 px-2">
          <span className="hidden sm:inline">
            <kbd className="px-1.5 py-0.5 bg-bg-elev border border-border-subtle rounded text-[10px]">
              Enter
            </kbd>{' '}
            to send ·{' '}
            <kbd className="px-1.5 py-0.5 bg-bg-elev border border-border-subtle rounded text-[10px]">
              Shift+Enter
            </kbd>{' '}
            for new line · Attach images, PDFs, or TXT
          </span>
          <span className="sm:hidden">
            Tap 📎 to attach images, PDFs, or TXT files
          </span>
        </div>
      </div>
    </div>
  );
}