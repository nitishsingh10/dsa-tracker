import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTracker } from '../contexts/TrackerContext';
import { calculateStreaks, getDailyGoal } from '../utils/streakEngine';
import { getTodaySolveCount } from '../services/activityLog';

export default function Navbar({ activeTab, setActiveTab, onOpenSettings }) {
  const { user, signOut } = useAuth();
  const { sync, syncing, lastSynced, setFocusProblem, getRandomProblem } = useTracker();

  const streaks = useMemo(() => calculateStreaks(), []);
  const todaySolved = getTodaySolveCount();
  const dailyGoal = getDailyGoal();

  const formatSyncTime = (iso) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleRandom = () => {
    const p = getRandomProblem();
    if (p) {
      setFocusProblem(p);
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-surface-950/80 backdrop-blur-md border-b border-surface-700/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand + Tabs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white hidden sm:block">DSA Tracker</span>
            </div>

            {/* Tab buttons */}
            <div className="flex items-center bg-surface-800 rounded-lg border border-surface-700 p-0.5">
              <button
                onClick={() => setActiveTab('problems')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer
                  ${activeTab === 'problems' ? 'bg-surface-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Problems
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer
                  ${activeTab === 'analytics' ? 'bg-surface-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Analytics
              </button>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Streak */}
            {streaks.currentStreak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500/5 border border-orange-500/15" title={`${streaks.currentStreak} day streak`}>
                <span className="text-sm">🔥</span>
                <span className="text-xs font-bold text-orange-400">{streaks.currentStreak}</span>
              </div>
            )}

            {/* Today's goal */}
            <div className="hidden sm:flex items-center gap-1.5">
              {Array.from({ length: Math.min(dailyGoal, 7) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i < todaySolved ? 'bg-status-done' : 'bg-surface-600'}`}
                  title={`${todaySolved}/${dailyGoal} today`}
                />
              ))}
            </div>

            {/* Random problem */}
            <button
              onClick={handleRandom}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-accent-400 hover:bg-accent-500/10 transition-colors cursor-pointer"
              title="Random unsolved problem"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
              </svg>
            </button>

            <span className="text-xs text-zinc-600 hidden sm:block">
              Synced {formatSyncTime(lastSynced)}
            </span>

            <button
              id="sync-now-button"
              onClick={() => sync()}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800 border border-surface-600
                text-xs font-medium text-zinc-400 hover:text-white hover:border-surface-500
                transition-colors disabled:opacity-50 cursor-pointer"
            >
              <svg className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              {syncing ? 'Syncing' : 'Sync'}
            </button>

            {user && (
              <div className="flex items-center gap-2.5">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-accent-500/20 flex items-center justify-center text-xs font-bold text-accent-400">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="text-xs text-zinc-400 hidden sm:block">{user.name}</span>
                <button
                  onClick={onOpenSettings}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                  title="Settings"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  id="sign-out-button"
                  onClick={signOut}
                  className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
