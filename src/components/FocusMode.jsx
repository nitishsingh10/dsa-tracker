import { useState, useEffect, useCallback, useRef } from 'react';
import { useTracker } from '../contexts/TrackerContext';
import useTimer from '../hooks/useTimer';
import { formatTime, formatTimeCompact } from '../utils/streakEngine';

/**
 * Build the proxied URL for embedding via our Vercel serverless function.
 * In dev, falls back to opening in new tab.
 */
function getProxyUrl(originalUrl) {
  if (!originalUrl) return null;
  // Use our serverless proxy
  return `/api/proxy?url=${encodeURIComponent(originalUrl)}`;
}

export default function FocusMode() {
  const { focusProblem, setFocusProblem, updateProblem, recordSession } = useTracker();
  const { seconds, isRunning, start, pause, stop, reset } = useTimer(0);
  const [notes, setNotes] = useState('');
  const [proxyFailed, setProxyFailed] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (focusProblem) {
      setNotes(focusProblem.notes || '');
      setProxyFailed(false);
      reset(0);
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusProblem]);

  // Keyboard: Esc to exit
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') handleExit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusProblem, seconds]);

  const handleExit = useCallback(() => {
    const elapsed = stop();
    if (focusProblem && elapsed > 0) {
      recordSession(focusProblem.id, elapsed);
    }
    if (focusProblem && notes !== (focusProblem.notes || '')) {
      updateProblem(focusProblem.id, { notes });
    }
    setFocusProblem(null);
  }, [focusProblem, stop, recordSession, updateProblem, notes, setFocusProblem]);

  const handleMarkDone = useCallback(() => {
    if (!focusProblem) return;
    updateProblem(focusProblem.id, { status: 'done' });
    handleExit();
  }, [focusProblem, updateProblem, handleExit]);

  const cycleStatus = useCallback(() => {
    if (!focusProblem) return;
    const order = ['todo', 'in-progress', 'done'];
    const next = order[(order.indexOf(focusProblem.status) + 1) % order.length];
    updateProblem(focusProblem.id, { status: next });
  }, [focusProblem, updateProblem]);

  const openInNewTab = useCallback(() => {
    if (focusProblem?.link) {
      window.open(focusProblem.link, '_blank');
    }
  }, [focusProblem]);

  if (!focusProblem) return null;

  const timerDisplay = formatTime(seconds);
  const previousTime = focusProblem.timeSpent ? formatTimeCompact(focusProblem.timeSpent) : null;
  const proxyUrl = getProxyUrl(focusProblem.link);

  const diffColors = {
    Easy: 'text-diff-easy',
    Medium: 'text-diff-medium',
    Hard: 'text-diff-hard',
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-950 flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-surface-900 border-b border-surface-700">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleExit}
            className="shrink-0 p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-surface-700 transition-colors cursor-pointer"
            title="Exit Focus Mode (Esc)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">{focusProblem.problemName}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[11px] font-medium ${diffColors[focusProblem.difficulty] || 'text-zinc-500'}`}>
                {focusProblem.difficulty}
              </span>
              {focusProblem.platform && (
                <span className="text-[11px] text-zinc-600">{focusProblem.platform}</span>
              )}
              {previousTime && (
                <span className="text-[11px] text-zinc-600">⏱ {previousTime} total</span>
              )}
            </div>
          </div>
        </div>

        {/* Timer + Actions */}
        <div className="flex items-center gap-3">
          {/* Timer display */}
          <div className="flex items-center gap-2.5 px-4 py-2 bg-surface-800 rounded-xl border border-surface-700">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-lg font-mono font-bold text-white tracking-wider">{timerDisplay}</span>
            <button
              onClick={isRunning ? pause : start}
              className="p-1 rounded-md hover:bg-surface-700 transition-colors cursor-pointer text-zinc-400 hover:text-white"
              title={isRunning ? 'Pause' : 'Resume'}
            >
              {isRunning ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Open in new tab */}
          {focusProblem.link && (
            <button
              onClick={openInNewTab}
              className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-surface-700 transition-colors cursor-pointer"
              title="Open in new tab"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </button>
          )}

          {/* Status cycle */}
          <button
            onClick={cycleStatus}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors
              ${focusProblem.status === 'done' ? 'text-status-done border-status-done/20 bg-status-done/5' :
                focusProblem.status === 'in-progress' ? 'text-status-progress border-status-progress/20 bg-status-progress/5' :
                'text-zinc-500 border-surface-600 bg-surface-800'}`}
          >
            <div className={`w-2 h-2 rounded-full
              ${focusProblem.status === 'done' ? 'bg-status-done' :
                focusProblem.status === 'in-progress' ? 'bg-status-progress' : 'bg-zinc-600'}`} />
            {focusProblem.status === 'done' ? 'Done' : focusProblem.status === 'in-progress' ? 'Solving' : 'Todo'}
          </button>

          {/* Mark Done */}
          <button
            onClick={handleMarkDone}
            className="flex items-center gap-1.5 px-4 py-2 bg-status-done/10 border border-status-done/20 text-status-done text-xs font-semibold rounded-lg hover:bg-status-done/20 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Done & Exit
          </button>
        </div>
      </div>

      {/* Main content — split panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem embedded via proxy */}
        <div className="flex-1 flex flex-col bg-surface-950">
          {focusProblem.link && !proxyFailed ? (
            <iframe
              ref={iframeRef}
              src={proxyUrl}
              className="flex-1 w-full border-none bg-white"
              title={focusProblem.problemName}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onError={() => setProxyFailed(true)}
            />
          ) : focusProblem.link && proxyFailed ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-400 mb-1">Could not embed this page</p>
                <p className="text-xs text-zinc-600 mb-5">
                  Your timer keeps running — solve in a new tab
                </p>
                <button
                  onClick={openInNewTab}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Open in New Tab
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
              No problem link available
            </div>
          )}
        </div>

        {/* Right: Notes panel */}
        <div className="w-80 lg:w-96 flex flex-col border-l border-surface-700 bg-surface-900">
          <div className="px-4 py-3 border-b border-surface-700">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Notes</h3>
          </div>
          <div className="flex-1 p-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your approach, observations, key patterns..."
              className="w-full h-full bg-surface-800 border border-surface-700 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-accent-500/50 transition-colors"
            />
          </div>

          {/* Problem info */}
          <div className="px-4 py-3 border-t border-surface-700 space-y-2">
            {focusProblem.contentCovered && (
              <div className="text-xs text-zinc-500">
                <span className="text-zinc-600">Topic:</span> {focusProblem.contentCovered}
              </div>
            )}
            {focusProblem.className && (
              <div className="text-xs text-zinc-500">
                <span className="text-zinc-600">Class:</span> {focusProblem.className}
              </div>
            )}
            {(focusProblem.sessions?.length || 0) > 0 && (
              <div className="text-xs text-zinc-500">
                <span className="text-zinc-600">Sessions:</span> {focusProblem.sessions.length} previous
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
