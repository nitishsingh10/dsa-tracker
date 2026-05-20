import { useState, useMemo } from 'react';
import { useTracker } from '../contexts/TrackerContext';
import Filters from './Filters';
import NotesModal from './NotesModal';

export default function ProblemList() {
  const { problems, classNotes, updateProblem } = useTracker();
  const [filters, setFilters] = useState({ search: '', difficulty: 'All', platform: 'All', status: 'All' });
  const [expandedTopics, setExpandedTopics] = useState(() => {
    try {
      const saved = localStorage.getItem('dsa_expanded_topics');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [notesProblem, setNotesProblem] = useState(null);

  // Filter
  const filtered = useMemo(() => {
    return problems.filter(p => {
      if (filters.difficulty !== 'All' && p.difficulty !== filters.difficulty) return false;
      if (filters.platform !== 'All' && p.platform !== filters.platform) return false;
      if (filters.status !== 'All') {
        const statusMap = { 'Todo': 'todo', 'In Progress': 'in-progress', 'Done': 'done' };
        if (p.status !== statusMap[filters.status]) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!p.problemName.toLowerCase().includes(q) &&
            !p.contentCovered?.toLowerCase().includes(q) &&
            !p.className?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [problems, filters]);

  // Extract broad topic from className
  // "Class 39 : Hashing 2" → "Hashing"
  // "Class 1 : Intro to DataStructures Algorithms and optimisations" → "Intro to DataStructures Algorithms and optimisations"
  const extractTopic = (className) => {
    if (!className) return 'General';
    // Remove "Class N : " prefix
    let topic = className.replace(/^Class\s*\d+\s*:\s*/i, '').trim();
    // Remove trailing session number (e.g., " 2", " 3")
    topic = topic.replace(/\s+\d+$/, '').trim();
    return topic || 'General';
  };

  // Group by broad topic
  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of filtered) {
      const key = extractTopic(p.className);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // Get the global notes link (first one)
  const globalNotesLink = classNotes.length > 0 ? classNotes[0].link : null;

  const toggleCollapse = (name) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      try { localStorage.setItem('dsa_expanded_topics', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const cycleStatus = (id, current) => {
    const order = ['todo', 'in-progress', 'done'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    updateProblem(id, { status: next });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-300">
          Problems <span className="text-zinc-600 font-normal">({filtered.length})</span>
        </h2>
        {globalNotesLink && (
          <a
            href={globalNotesLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-accent-500/5 border-accent-500/20 text-accent-400 hover:bg-accent-500/10 hover:border-accent-500/30 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Class Notes
          </a>
        )}
      </div>

      {/* Filters */}
      <Filters problems={problems} filters={filters} setFilters={setFilters} />

      {/* Grouped by topic */}
      {grouped.length === 0 ? (
        <div className="text-center py-16 text-zinc-600 text-sm">No problems match your filters</div>
      ) : (
        <div className="space-y-2">
          {grouped.map(([topic, topicProblems]) => {
            const isCollapsed = !expandedTopics.has(topic);
            const doneCnt = topicProblems.filter(p => p.status === 'done').length;
            const allDone = doneCnt === topicProblems.length && doneCnt > 0;
            const pct = topicProblems.length > 0 ? Math.round((doneCnt / topicProblems.length) * 100) : 0;

            return (
              <div key={topic} className="bg-surface-800 rounded-xl border border-surface-700 overflow-hidden">
                {/* Topic header */}
                <div className="flex items-center">
                  <button
                    onClick={() => toggleCollapse(topic)}
                    className="flex-1 flex items-center gap-3 px-4 py-3 hover:bg-surface-700/40 transition-colors cursor-pointer min-w-0"
                  >
                    <svg
                      className={`w-3 h-3 text-zinc-600 shrink-0 transition-transform duration-150 ${isCollapsed ? '' : 'rotate-90'}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>

                    <span className={`text-sm font-medium text-left flex-1 truncate ${allDone ? 'text-status-done' : 'text-zinc-200'}`}>
                      {topic}
                    </span>

                    <div className="w-20 h-1.5 bg-surface-700 rounded-full overflow-hidden shrink-0 hidden sm:block">
                      <div className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-status-done' : 'bg-accent-500'}`}
                        style={{ width: `${pct}%` }} />
                    </div>

                    <span className={`text-xs shrink-0 ${allDone ? 'text-status-done' : 'text-zinc-500'}`}>
                      {doneCnt}/{topicProblems.length}
                    </span>
                  </button>

                  {/* Learn link — opens YouTube search for this DSA topic */}
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' DSA tutorial')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-3 py-1 mr-3 rounded-md text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors shrink-0"
                    title={`Learn about ${topic}`}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                    </svg>
                    Learn
                  </a>
                </div>

                {/* Problem cards */}
                {!isCollapsed && (
                  <div className="border-t border-surface-700 p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {topicProblems.map((p) => (
                      <div key={p.id}
                        className={`rounded-lg border p-3.5 transition-all hover:border-surface-500
                          ${p.status === 'done' ? 'bg-surface-900/50 border-surface-700/50' : 'bg-surface-900 border-surface-700'}`}>

                        {/* Top: name + star */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="min-w-0 flex-1">
                            {p.link ? (
                              <a href={p.link} target="_blank" rel="noopener noreferrer"
                                className={`text-sm font-medium leading-snug transition-colors block
                                  ${p.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-100 hover:text-accent-400'}`}>
                                {p.problemName}
                                <svg className="w-3 h-3 text-zinc-600 inline ml-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                </svg>
                              </a>
                            ) : (
                              <span className={`text-sm font-medium leading-snug block
                                ${p.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                                {p.problemName}
                              </span>
                            )}
                          </div>
                          <button onClick={() => updateProblem(p.id, { starred: !p.starred })}
                            className={`shrink-0 mt-0.5 cursor-pointer ${p.starred ? 'text-amber-400' : 'text-zinc-700 hover:text-zinc-500'}`}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill={p.starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                          </button>
                        </div>

                        {/* Tags row: platform + difficulty + CW/HW */}
                        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                          {p.platform && (
                            <span className="text-[11px] text-zinc-500 bg-surface-800 px-1.5 py-0.5 rounded">{p.platform}</span>
                          )}
                          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded
                            ${p.difficulty === 'Easy' ? 'text-diff-easy bg-diff-easy/10' :
                              p.difficulty === 'Medium' ? 'text-diff-medium bg-diff-medium/10' :
                              p.difficulty === 'Hard' ? 'text-diff-hard bg-diff-hard/10' :
                              'text-zinc-500 bg-surface-800'}`}>
                            {p.difficulty}
                          </span>
                          <span className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded
                            ${p.type === 'homework' ? 'text-amber-500/70 bg-amber-500/5' : 'text-zinc-600 bg-surface-800'}`}>
                            {p.type === 'homework' ? 'HW' : 'CW'}
                          </span>
                        </div>

                        {/* Bottom: status + notes */}
                        <div className="flex items-center justify-between">
                          <button onClick={() => cycleStatus(p.id, p.status)}
                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border cursor-pointer transition-colors
                              ${p.status === 'done' ? 'text-status-done border-status-done/20 bg-status-done/5 hover:bg-status-done/10' :
                                p.status === 'in-progress' ? 'text-status-progress border-status-progress/20 bg-status-progress/5 hover:bg-status-progress/10' :
                                'text-zinc-500 border-surface-600 bg-surface-800 hover:border-surface-500'}`}>
                            <div className={`w-2 h-2 rounded-full
                              ${p.status === 'done' ? 'bg-status-done' :
                                p.status === 'in-progress' ? 'bg-status-progress' :
                                'bg-zinc-600'}`} />
                            {p.status === 'done' ? 'Done' : p.status === 'in-progress' ? 'Solving' : 'Todo'}
                          </button>

                          <button onClick={() => setNotesProblem(p)}
                            className={`p-1.5 rounded-md cursor-pointer transition-colors
                              ${p.notes ? 'text-accent-400 bg-accent-500/10' : 'text-zinc-700 hover:text-zinc-500 hover:bg-surface-800'}`}
                            title={p.notes ? 'Edit notes' : 'Add notes'}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {notesProblem && <NotesModal problem={notesProblem} onClose={() => setNotesProblem(null)} />}
    </div>
  );
}
