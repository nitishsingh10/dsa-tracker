import { useState, useEffect } from 'react';
import { getDailyGoal, setDailyGoal } from '../utils/streakEngine';

export default function SettingsModal({ onClose }) {
  const [goal, setGoal] = useState(getDailyGoal());
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const handleSaveGoal = () => {
    setDailyGoal(goal);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('This will clear ALL your progress (statuses, notes, time, streaks). The problems will re-sync from your sheet. Are you sure?')) {
      localStorage.removeItem('dsa-tracker');
      localStorage.removeItem('dsa-activity');
      localStorage.removeItem('dsa_expanded_topics');
      window.location.reload();
    }
  };

  const shortcuts = [
    { key: '/', desc: 'Focus search bar' },
    { key: 'R', desc: 'Random unsolved problem' },
    { key: 'Esc', desc: 'Close modals / exit focus mode' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in" onClick={onClose}>
      <div className="bg-surface-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-surface-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {/* Daily Goal */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Daily Goal</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={10}
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
                className="flex-1 accent-accent-500"
              />
              <span className="text-sm font-bold text-white w-8 text-center">{goal}</span>
              <span className="text-xs text-zinc-500">problems/day</span>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 cursor-pointer hover:text-zinc-300"
            >
              Keyboard Shortcuts
              <svg className={`w-3 h-3 transition-transform ${showShortcuts ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            {showShortcuts && (
              <div className="space-y-1.5 bg-surface-900 rounded-xl p-3 border border-surface-700">
                {shortcuts.map(s => (
                  <div key={s.key} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">{s.desc}</span>
                    <kbd className="px-2 py-0.5 bg-surface-800 border border-surface-600 rounded text-[11px] font-mono text-zinc-300">{s.key}</kbd>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* App Info */}
          <div className="pt-3 border-t border-surface-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500">DSA Tracker</span>
              <span className="text-xs text-zinc-600">v2.0.0</span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              All data is stored locally in your browser. Syncs problem list from Google Sheets. Progress, notes, times, and streaks stay on this device.
            </p>
          </div>

          {/* Danger Zone */}
          <div className="pt-3 border-t border-red-900/30">
            <button
              onClick={handleReset}
              className="text-xs text-red-500/70 hover:text-red-400 cursor-pointer transition-colors"
            >
              ⚠ Reset all progress data
            </button>
          </div>
        </div>

        {/* Save/Close */}
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer">Cancel</button>
          <button onClick={handleSaveGoal} className="px-4 py-1.5 bg-accent-500 hover:bg-accent-600 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer">Save</button>
        </div>
      </div>
    </div>
  );
}
