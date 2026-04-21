import { useCallback, useEffect, useState } from 'react';
import {
  X,
  Settings,
  RotateCcw,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  UserCircle2,
  Check,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useAuth, useClerk, SignOutButton } from '@clerk/clerk-react';
import { DEFAULT_SETTINGS } from '../utils/constants';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  onKeySaved,    // notify parent that API key state changed
}) {
  const { getToken } = useAuth();
  const { openUserProfile } = useClerk();

  const [local, setLocal] = useState(settings);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyPreview, setKeyPreview] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState('idle'); // idle | saving | saved | error
  const [keyError, setKeyError] = useState('');
  const [loadingKey, setLoadingKey] = useState(true); // Start as true

  const fetchKeyStatus = useCallback(async () => {
    try {
      // The 'await' here is what makes this safe for the linter
      const token = await getToken();
      const res = await fetch('/api/user/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setHasKey(!!data.hasApiKey);
        setKeyPreview(data.keyPreview || '');
      }
    } catch (err) {
      console.error("Fetch key status failed:", err);
    } finally {
      // This happens after the network request, so it's asynchronous
      setLoadingKey(false);
    }
  }, [getToken]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
  if (!isOpen) return;
  const run = async () => {
    await fetchKeyStatus();
  };

  run();
}, [isOpen, fetchKeyStatus]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);



  const saveKey = async () => {
    try {
      setKeyStatus('saving');
      setKeyError('');
      const token = await getToken();
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ anthropicApiKey: apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setHasKey(!!data.hasApiKey);
      setKeyPreview(data.keyPreview || '');
      setApiKey('');
      setKeyStatus('saved');
      onKeySaved?.(!!data.hasApiKey);
      setTimeout(() => setKeyStatus('idle'), 1800);
    } catch (err) {
      setKeyError(err.message);
      setKeyStatus('error');
    }
  };

  const removeKey = async () => {
    try {
      setKeyStatus('saving');
      const token = await getToken();
      await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ anthropicApiKey: '' }),
      });
      setHasKey(false);
      setKeyPreview('');
      setKeyStatus('idle');
      onKeySaved?.(false);
    } catch (err) {
      setKeyError(err.message);
      setKeyStatus('error');
    }
  };

  const savePrefs = () => {
    onSave({
      systemPrompt: local.systemPrompt.trim() || DEFAULT_SETTINGS.systemPrompt,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-bg-panel border border-border-subtle rounded-2xl shadow-2xl shadow-black/50 animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-elev transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-7">
          {/* API Key */}
          <section>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Key className="w-3.5 h-3.5 text-violet-400" />
              <label className="text-sm font-medium text-white">
                Anthropic API Key
              </label>
            </div>
            <p className="text-xs text-gray-400 mb-2.5 leading-relaxed flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Encrypted at rest. Get one at{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noreferrer"
                className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-0.5 ml-0.5"
              >
                console.anthropic.com <ExternalLink className="w-3 h-3" />
              </a>
            </p>

            {loadingKey ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking saved key…
              </div>
            ) : hasKey ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mb-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="flex-1 text-sm text-emerald-200 font-mono">
                  {keyPreview || 'Key saved'}
                </span>
                <button
                  onClick={removeKey}
                  className="text-xs text-red-300 hover:text-red-200 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : null}

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasKey ? 'Replace existing key (optional)…' : 'sk-ant-…'}
                className="w-full bg-bg border border-border-subtle rounded-lg px-3 py-2.5 pr-12 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white rounded transition-colors"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {keyError && (
              <p className="text-xs text-red-400 mt-2">{keyError}</p>
            )}

            <button
              onClick={saveKey}
              disabled={!apiKey.trim() || keyStatus === 'saving'}
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:bg-bg-elev disabled:text-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {keyStatus === 'saving' && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {keyStatus === 'saved' && <Check className="w-4 h-4" />}
              {keyStatus === 'saved' ? 'Saved!' : 'Save API Key'}
            </button>
          </section>

          <hr className="border-border-subtle" />

          {/* System Prompt */}
          <section>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <label className="text-sm font-medium text-white">System Prompt</label>
            </div>
            <p className="text-xs text-gray-400 mb-2.5 leading-relaxed">
              Defines the assistant's personality and behavior.
            </p>
            <textarea
              value={local.systemPrompt}
              onChange={(e) =>
                setLocal((s) => ({ ...s, systemPrompt: e.target.value }))
              }
              rows={4}
              placeholder="You are a helpful assistant…"
              className="w-full bg-bg border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all resize-none font-mono"
            />
            <div className="flex items-center justify-between mt-1.5">
              <div className="text-xs text-gray-500">
                {local.systemPrompt.length} characters
              </div>
              <button
                onClick={() => setLocal(DEFAULT_SETTINGS)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to default
              </button>
            </div>
          </section>

          <hr className="border-border-subtle" />

          {/* Account */}
          <section>
            <div className="flex items-center gap-1.5 mb-3">
              <UserCircle2 className="w-3.5 h-3.5 text-violet-400" />
              <label className="text-sm font-medium text-white">Account</label>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => openUserProfile()}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm bg-bg-elev hover:bg-bg-soft border border-border-subtle text-gray-200 hover:text-white rounded-lg transition-colors"
              >
                <UserCircle2 className="w-4 h-4 text-violet-400" />
                <span className="flex-1 text-left">Manage Account</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
              </button>

              <SignOutButton>
                <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" />
                  <span className="flex-1 text-left">Sign Out</span>
                </button>
              </SignOutButton>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border-subtle">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-300 hover:bg-bg-elev rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={savePrefs}
            className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-lg transition-all shadow-lg shadow-violet-900/30 active:scale-[0.98]"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}