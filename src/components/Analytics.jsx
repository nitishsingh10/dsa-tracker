import { useMemo, useCallback } from 'react';
import { useTracker } from '../contexts/TrackerContext';
import { getActivityRange } from '../services/activityLog';
import { calculateStreaks, getTotalStats, formatTime, getDailyGoal, formatTimeCompact } from '../utils/streakEngine';
import { getRevisionQueue } from '../utils/revisionEngine';
import { exportCSV, exportJSON, generateStatsSummary } from '../utils/exportUtils';

export default function Analytics() {
  const { problems } = useTracker();

  const streaks = useMemo(() => calculateStreaks(), [problems]);
  const totalStats = useMemo(() => getTotalStats(problems), [problems]);
  const activityData = useMemo(() => getActivityRange(91), [problems]);
  const revisionQueue = useMemo(() => getRevisionQueue(problems), [problems]);
  const dailyGoal = getDailyGoal();

  // Topic mastery data
  const topicStats = useMemo(() => {
    const map = new Map();
    for (const p of problems) {
      let topic = (p.className || 'General').replace(/^Class\s*\d+\s*:\s*/i, '').replace(/\s+\d+$/, '').trim() || 'General';
      if (!map.has(topic)) map.set(topic, { total: 0, done: 0, time: 0 });
      const s = map.get(topic);
      s.total++;
      if (p.status === 'done') s.done++;
      s.time += p.timeSpent || 0;
    }
    return Array.from(map.entries())
      .map(([name, s]) => ({ name, ...s, pct: s.total > 0 ? Math.round((s.done / s.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [problems]);

  // Difficulty breakdown
  const diffStats = useMemo(() => {
    const stats = { Easy: { total: 0, done: 0 }, Medium: { total: 0, done: 0 }, Hard: { total: 0, done: 0 } };
    for (const p of problems) {
      const d = stats[p.difficulty];
      if (d) { d.total++; if (p.status === 'done') d.done++; }
    }
    return stats;
  }, [problems]);

  // Weekly trend (last 8 weeks)
  const weeklyTrend = useMemo(() => {
    const weeks = [];
    const data = getActivityRange(56);
    for (let i = 0; i < 8; i++) {
      const weekData = data.slice(i * 7, (i + 1) * 7);
      const solved = weekData.reduce((s, d) => s + d.solved, 0);
      weeks.push({ week: i + 1, solved });
    }
    return weeks;
  }, [problems]);

  const maxWeeklySolved = Math.max(...weeklyTrend.map(w => w.solved), 1);

  // Heatmap color
  const heatColor = (solved) => {
    if (solved === 0) return 'bg-surface-800';
    if (solved === 1) return 'bg-accent-500/30';
    if (solved <= 3) return 'bg-accent-500/50';
    if (solved <= 5) return 'bg-accent-500/70';
    return 'bg-accent-500';
  };

  // Donut chart segments
  const donutSegments = useMemo(() => {
    const total = problems.filter(p => p.status === 'done').length || 1;
    const e = diffStats.Easy.done;
    const m = diffStats.Medium.done;
    const h = diffStats.Hard.done;
    const eAngle = (e / total) * 360;
    const mAngle = (m / total) * 360;
    // hAngle is the remainder
    return { easy: eAngle, medium: mAngle, hard: 360 - eAngle - mAngle, total: e + m + h };
  }, [problems, diffStats]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatCard
          label="Solved"
          value={totalStats.totalSolved}
          sub={`of ${problems.length}`}
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
          color="text-status-done"
        />
        <StatCard
          label="Streak"
          value={streaks.currentStreak}
          sub={`best: ${streaks.longestStreak}d`}
          icon={<span className="text-base">🔥</span>}
          color="text-orange-400"
        />
        <StatCard
          label="Time"
          value={formatTime(totalStats.totalTime)}
          sub={`${totalStats.activeDays} active days`}
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="text-accent-400"
        />
        <StatCard
          label="Today"
          value={`${activityData[activityData.length - 1]?.solved || 0}/${dailyGoal}`}
          sub={streaks.hasSolvedToday ? 'On track!' : 'Get started!'}
          icon={<span className="text-base">🎯</span>}
          color={(activityData[activityData.length - 1]?.solved || 0) >= dailyGoal ? 'text-status-done' : 'text-amber-400'}
        />
      </div>

      {/* Revision queue (if any) */}
      {revisionQueue.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">📋</span>
            <span className="text-xs font-semibold text-amber-400">Revision Due</span>
            <span className="text-[11px] text-amber-500/60 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded">{revisionQueue.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {revisionQueue.slice(0, 5).map(p => (
              <span key={p.id} className="text-[11px] text-amber-300/80 bg-amber-500/10 px-2 py-1 rounded-md truncate max-w-[180px]">
                {p.problemName}
              </span>
            ))}
            {revisionQueue.length > 5 && (
              <span className="text-[11px] text-amber-500/50 px-2 py-1">+{revisionQueue.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {/* Two-column layout for charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* Activity Heatmap */}
        <div className="bg-surface-800 rounded-xl border border-surface-700 p-4">
          <h3 className="text-xs font-semibold text-zinc-400 mb-3">Activity — Last 13 Weeks</h3>
          <div className="flex gap-[3px] flex-wrap">
            {/* Add day-of-week padding for first week */}
            {activityData.length > 0 && activityData[0].day > 0 && (
              Array.from({ length: activityData[0].day }).map((_, i) => (
                <div key={`pad-${i}`} className="w-[11px] h-[11px]" />
              ))
            )}
            {activityData.map((d, i) => (
              <div
                key={d.date}
                className={`w-[11px] h-[11px] rounded-[2px] transition-colors ${heatColor(d.solved)}`}
                title={`${d.date}: ${d.solved} solved`}
              />
            ))}
          </div>
          <div className="flex items-center justify-end gap-1 mt-2">
            <span className="text-[10px] text-zinc-600">Less</span>
            {[0, 1, 2, 4, 6].map(n => (
              <div key={n} className={`w-[10px] h-[10px] rounded-[2px] ${heatColor(n)}`} />
            ))}
            <span className="text-[10px] text-zinc-600">More</span>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="bg-surface-800 rounded-xl border border-surface-700 p-4">
          <h3 className="text-xs font-semibold text-zinc-400 mb-3">Difficulty Breakdown</h3>
          <div className="space-y-2.5">
            {[
              { label: 'Easy', color: 'bg-diff-easy', text: 'text-diff-easy', ...diffStats.Easy },
              { label: 'Medium', color: 'bg-diff-medium', text: 'text-diff-medium', ...diffStats.Medium },
              { label: 'Hard', color: 'bg-diff-hard', text: 'text-diff-hard', ...diffStats.Hard },
            ].map(d => (
              <div key={d.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${d.text}`}>{d.label}</span>
                  <span className="text-[11px] text-zinc-500">{d.done}/{d.total}</span>
                </div>
                <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${d.color}`}
                    style={{ width: `${d.total > 0 ? (d.done / d.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second row of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* Weekly Trend */}
        <div className="bg-surface-800 rounded-xl border border-surface-700 p-4">
          <h3 className="text-xs font-semibold text-zinc-400 mb-3">Weekly Trend</h3>
          <div className="flex items-end gap-1.5 h-24">
            {weeklyTrend.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-zinc-500">{w.solved || ''}</span>
                <div
                  className="w-full rounded-t-md bg-accent-500/60 hover:bg-accent-500 transition-colors min-h-[2px]"
                  style={{ height: `${Math.max((w.solved / maxWeeklySolved) * 100, 3)}%` }}
                  title={`Week ${i + 1}: ${w.solved} solved`}
                />
                <span className="text-[9px] text-zinc-600">W{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Topic Mastery */}
        <div className="bg-surface-800 rounded-xl border border-surface-700 p-4">
          <h3 className="text-xs font-semibold text-zinc-400 mb-3">Topic Mastery</h3>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {topicStats.slice(0, 10).map(t => (
              <div key={t.name} className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400 truncate w-28 shrink-0">{t.name}</span>
                <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${t.pct === 100 ? 'bg-status-done' : 'bg-accent-500/60'}`}
                    style={{ width: `${t.pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-600 shrink-0 w-8 text-right">{t.pct}%</span>
              </div>
            ))}
          </div>
          {topicStats.length === 0 && (
            <p className="text-xs text-zinc-600 text-center py-4">No data yet</p>
          )}
        </div>
      </div>

      {/* Time per topic */}
      {topicStats.some(t => t.time > 0) && (
        <div className="bg-surface-800 rounded-xl border border-surface-700 p-4">
          <h3 className="text-xs font-semibold text-zinc-400 mb-3">Time per Topic</h3>
          <div className="space-y-1.5">
            {topicStats.filter(t => t.time > 0).slice(0, 8).map(t => {
              const maxTime = Math.max(...topicStats.map(x => x.time), 1);
              return (
                <div key={t.name} className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400 truncate w-28 shrink-0">{t.name}</span>
                  <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan-500/50 transition-all duration-500"
                      style={{ width: `${(t.time / maxTime) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-600 shrink-0 w-12 text-right">{formatTimeCompact(t.time)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Export actions */}
      <div className="bg-surface-800 rounded-xl border border-surface-700 p-4">
        <h3 className="text-xs font-semibold text-zinc-400 mb-3">Export & Share</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportCSV(problems)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-900 border border-surface-600 rounded-lg text-xs text-zinc-400 hover:text-white hover:border-surface-500 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => exportJSON(problems)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-900 border border-surface-600 rounded-lg text-xs text-zinc-400 hover:text-white hover:border-surface-500 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25" />
            </svg>
            Export JSON
          </button>
          <button
            onClick={() => {
              const text = generateStatsSummary(problems);
              navigator.clipboard.writeText(text).then(() => alert('Stats copied to clipboard!'));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-900 border border-surface-600 rounded-lg text-xs text-zinc-400 hover:text-white hover:border-surface-500 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            Copy Stats
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="bg-surface-800 rounded-xl border border-surface-700 p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <span className={color}>{icon}</span>
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-[11px] text-zinc-600 mt-0.5">{sub}</div>
    </div>
  );
}
