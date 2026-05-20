import { useMemo } from 'react';
import { useTracker } from '../contexts/TrackerContext';

export default function Dashboard() {
  const { problems } = useTracker();

  const stats = useMemo(() => {
    const total = problems.length;
    const done = problems.filter(p => p.status === 'done').length;
    const inProgress = problems.filter(p => p.status === 'in-progress').length;
    const todo = total - done - inProgress;
    return { total, done, inProgress, todo };
  }, [problems]);

  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <div className="bg-surface-800 rounded-xl border border-surface-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-zinc-400">Progress</span>
          <span className="text-sm text-white">
            <span className="font-bold">{stats.done}</span>
            <span className="text-zinc-500">/{stats.total}</span>
            <span className="text-zinc-600 ml-1.5 text-xs">({pct}%)</span>
          </span>
        </div>
        <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-accent-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-5 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-done" /> Done {stats.done}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-status-progress" /> Solving {stats.inProgress}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-600" /> Todo {stats.todo}
          </span>
        </div>
      </div>
    </div>
  );
}
