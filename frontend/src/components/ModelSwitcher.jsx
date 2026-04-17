import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Cpu } from 'lucide-react';

export default function ModelSwitcher({ models, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const current = models.find((m) => m.id === value) || models[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-elev hover:bg-bg-panel border border-border-subtle text-sm font-medium text-white transition-all active:scale-[0.98]"
      >
        <Cpu className="w-4 h-4 text-violet-400" />
        <span className="hidden sm:inline truncate max-w-[140px]">{current.name}</span>
        <span className="sm:hidden">{current.name.split(' ')[1]}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-bg-panel border border-border-subtle shadow-2xl shadow-black/50 overflow-hidden z-50 animate-slide-up">
          <div className="p-1">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  onChange(m.id);
                  setOpen(false);
                }}
                className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-elev transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{m.name}</span>
                    {m.id === value && <Check className="w-4 h-4 text-violet-400" />}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}