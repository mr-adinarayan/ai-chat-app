import { useState, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Play, Code as CodeIcon } from 'lucide-react';
import { SandpackProvider, SandpackPreview } from '@codesandbox/sandpack-react';

const PREVIEWABLE = new Set(['html', 'jsx', 'tsx', 'react', 'javascript', 'js']);

function resolveTemplate(lang) {
  const l = (lang || '').toLowerCase();
  if (l === 'html') return 'static';
  if (l === 'jsx' || l === 'tsx' || l === 'react') return 'react';
  return null;
}

export default function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const lang = (language || '').toLowerCase();
  const template = useMemo(() => resolveTemplate(lang), [lang]);
  const canPreview =
    PREVIEWABLE.has(lang) && template !== null && value?.length < 20_000;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
  console.error(err);
}
  };

  const files = useMemo(() => {
    if (template === 'static') return { '/index.html': value };
    if (template === 'react') return { '/App.js': value };
    return {};
  }, [template, value]);

  return (
    <div className="relative my-3 rounded-lg overflow-hidden border border-border-subtle bg-[#0d0d14]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-bg-elev border-b border-border-subtle">
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
          {language || 'text'}
        </span>
        <div className="flex items-center gap-1">
          {canPreview && (
            <button
              onClick={() => setShowPreview((v) => !v)}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-violet-300 rounded-md hover:bg-bg-panel transition-colors"
              title={showPreview ? 'Show code' : 'Run preview'}
            >
              {showPreview ? (
                <>
                  <CodeIcon className="w-3.5 h-3.5" /> Code
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Preview
                </>
              )}
            </button>
          )}
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white rounded-md hover:bg-bg-panel transition-colors"
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
        </div>
      </div>

      {showPreview && canPreview ? (
        <div className="bg-white">
          <SandpackProvider
            template={template}
            files={files}
            theme="dark"
            options={{ recompileMode: 'delayed', recompileDelay: 400 }}
          >
            <SandpackPreview
              showNavigator={false}
              showOpenInCodeSandbox={false}
              showRefreshButton
              style={{ height: '360px' }}
            />
          </SandpackProvider>
        </div>
      ) : (
        <SyntaxHighlighter
          language={lang || 'text'}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: '0.9rem 1rem',
            background: 'transparent',
            fontSize: '13.5px',
            lineHeight: 1.6,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}
          codeTagProps={{ style: { fontFamily: 'inherit' } }}
          wrapLongLines
        >
          {value}
        </SyntaxHighlighter>
      )}
    </div>
  );
}