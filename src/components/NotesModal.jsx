import { useState, useEffect, useRef } from 'react';
import { useTracker } from '../contexts/TrackerContext';

export default function NotesModal({ problem, onClose }) {
  const { updateProblem } = useTracker();
  const [notes, setNotes] = useState(problem?.notes || '');
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const handleSave = () => { updateProblem(problem.id, { notes }); onClose(); };

  if (!problem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in" onClick={onClose}>
      <div className="bg-surface-800 rounded-2xl p-5 max-w-md w-full mx-4 border border-surface-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white truncate">{problem.problemName}</h3>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400 cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <textarea
          ref={ref}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Your notes..."
          className="w-full h-32 px-3 py-2.5 bg-surface-900 border border-surface-600 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-accent-500/50 transition-colors"
        />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer">Cancel</button>
          <button onClick={handleSave} className="px-4 py-1.5 bg-accent-500 hover:bg-accent-600 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer">Save</button>
        </div>
      </div>
    </div>
  );
}
