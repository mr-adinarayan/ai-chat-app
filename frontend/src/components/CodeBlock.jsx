import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

export default function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="relative my-3 rounded-lg overflow-hidden border border-border-subtle bg-[#0d0d14]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-bg-elev border-b border-border-subtle">
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
          {language || 'text'}
        </span>
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
      <SyntaxHighlighter
        language={language}
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
    </div>
  );
}