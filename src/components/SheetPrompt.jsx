import { useState } from 'react';
import { useTracker } from '../contexts/TrackerContext';

export default function SheetPrompt() {
  const { setSheetUrl, syncing } = useTracker();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!url.trim()) { setError('Paste a Google Sheet URL'); return; }
    if (!url.includes('spreadsheets/d/')) { setError('Not a valid Google Sheet URL'); return; }
    const success = await setSheetUrl(url.trim());
    if (!success) setError('Could not extract Sheet ID');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
      <div className="bg-surface-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-surface-700">
        <h2 className="text-lg font-semibold text-white mb-1">Connect Sheet</h2>
        <p className="text-xs text-zinc-500 mb-5">
          Paste the URL of your Google Sheet (must have a tab named <code className="text-accent-400">25B</code>)
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            id="sheet-url-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full px-3 py-2.5 bg-surface-900 border border-surface-600 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accent-500/50 transition-colors"
            autoFocus
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            id="connect-sheet-button"
            type="submit"
            disabled={syncing}
            className="w-full py-2.5 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            {syncing ? 'Syncing...' : 'Connect & Sync'}
          </button>
        </form>
      </div>
    </div>
  );
}
