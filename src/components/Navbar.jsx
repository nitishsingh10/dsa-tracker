import { useAuth } from '../contexts/AuthContext';
import { useTracker } from '../contexts/TrackerContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { sync, syncing, lastSynced } = useTracker();

  const formatSyncTime = (iso) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <nav className="sticky top-0 z-40 bg-surface-950/80 backdrop-blur-md border-b border-surface-700/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">DSA Tracker</span>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
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
