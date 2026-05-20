import { useState, useMemo } from 'react';
import { useTracker } from '../contexts/TrackerContext';
import Filters from './Filters';
import NotesModal from './NotesModal';
import { formatTimeCompact } from '../utils/streakEngine';

export default function ProblemList() {
  const { problems, classNotes, updateProblem, setFocusProblem } = useTracker();
  const [filters, setFilters] = useState({ search: '', difficulty: 'All', platform: 'All', status: 'All', tag: 'All', starred: false });
  const [tagInput, setTagInput] = useState(null);
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
      if (filters.tag && filters.tag !== 'All') {
        if (!p.tags?.includes(filters.tag)) return false;
      }
      if (filters.starred && !p.starred) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!p.problemName.toLowerCase().includes(q) &&
            !p.contentCovered?.toLowerCase().includes(q) &&
            !p.className?.toLowerCase().includes(q) &&
            !(p.tags || []).some(t => t.toLowerCase().includes(q))) return false;
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

  const levelConfig = (level) => {
    const levels = {
      chill:    { emoji: '😌', label: 'Chill',    style: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10' },
      moderate: { emoji: '🤔', label: 'Moderate', style: 'text-amber-400 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10' },
      tough:    { emoji: '😤', label: 'Tough',    style: 'text-orange-400 border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10' },
      brutal:   { emoji: '🤯', label: 'Brutal',   style: 'text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10' },
    };
    return levels[level] || { emoji: '🎯', label: 'Rate', style: 'text-zinc-600 border-surface-600 bg-transparent hover:border-surface-500 hover:text-zinc-400' };
  };

  const cycleLevel = (id, current) => {
    const order = [null, 'chill', 'moderate', 'tough', 'brutal'];
    const next = order[(order.indexOf(current) + 1) % order.length];
    updateProblem(id, { userLevel: next });
  };

  const addTag = (problemId, tag) => {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    const problem = problems.find(p => p.id === problemId);
    if (!problem) return;
    const existing = problem.tags || [];
    if (existing.includes(t)) return;
    updateProblem(problemId, { tags: [...existing, t] });
    setTagInput(null);
  };

  const removeTag = (problemId, tag) => {
    const problem = problems.find(p => p.id === problemId);
    if (!problem) return;
    updateProblem(problemId, { tags: (problem.tags || []).filter(t => t !== tag) });
  };

  const TAG_PRESETS = ['revision', 'pattern', 'tricky', 'interview', 'important', 'revisit'];

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
                {/* Problem list — compact rows */}
                {!isCollapsed && (
                  <div className="border-t border-surface-700 divide-y divide-surface-700/50">
                    {topicProblems.map((p) => (
                      <div key={p.id}
                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-700/20 group
                          ${p.status === 'done' ? 'opacity-60' : ''}`}>

                        {/* Status dot */}
                        <button onClick={() => cycleStatus(p.id, p.status)}
                          className="shrink-0 cursor-pointer" title="Cycle status">
                          <div className={`w-3 h-3 rounded-full border-2 transition-colors
                            ${p.status === 'done' ? 'bg-status-done border-status-done' :
                              p.status === 'in-progress' ? 'bg-status-progress/30 border-status-progress' :
                              'border-zinc-600 hover:border-zinc-400'}`} />
                        </button>

                        {/* Problem name */}
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          {p.link ? (
                            <a href={p.link} target="_blank" rel="noopener noreferrer"
                              className={`text-[13px] font-medium truncate transition-colors
                                ${p.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-200 hover:text-accent-400'}`}>
                              {p.problemName}
                            </a>
                          ) : (
                            <span className={`text-[13px] font-medium truncate
                              ${p.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                              {p.problemName}
                            </span>
                          )}

                          {/* User tags inline */}
                          {(p.tags || []).map(tag => (
                            <span key={tag} className="hidden sm:inline-flex items-center gap-0.5 text-[9px] text-violet-400/70 bg-violet-500/8 px-1.5 py-0.5 rounded shrink-0">
                              #{tag}
                              <button onClick={() => removeTag(p.id, tag)} className="hover:text-red-400 cursor-pointer text-[8px] leading-none">×</button>
                            </span>
                          ))}
                        </div>

                        {/* Tags: platform + difficulty + type */}
                        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                          {p.platform && (
                            <span className="text-[10px] text-zinc-600 bg-surface-800 px-1.5 py-0.5 rounded">{p.platform}</span>
                          )}
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded
                            ${p.difficulty === 'Easy' ? 'text-diff-easy bg-diff-easy/10' :
                              p.difficulty === 'Medium' ? 'text-diff-medium bg-diff-medium/10' :
                              p.difficulty === 'Hard' ? 'text-diff-hard bg-diff-hard/10' :
                              'text-zinc-500 bg-surface-800'}`}>
                            {p.difficulty}
                          </span>
                          <span className={`text-[9px] uppercase tracking-wider font-semibold px-1 py-0.5 rounded
                            ${p.type === 'homework' ? 'text-amber-500/60 bg-amber-500/5' : 'text-zinc-700 bg-surface-800'}`}>
                            {p.type === 'homework' ? 'HW' : 'CW'}
                          </span>
                        </div>

                        {/* Time badge */}
                        {(p.timeSpent || 0) > 0 && (
                          <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-cyan-500/60 shrink-0">
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatTimeCompact(p.timeSpent)}
                          </span>
                        )}

                        {/* Level */}
                        <button onClick={() => cycleLevel(p.id, p.userLevel)}
                          className={`shrink-0 text-sm leading-none cursor-pointer transition-all ${p.userLevel ? '' : 'opacity-50 hover:opacity-80'}`}
                          title={levelConfig(p.userLevel).label}>
                          {levelConfig(p.userLevel).emoji}
                        </button>

                        {/* Star */}
                        <button onClick={() => updateProblem(p.id, { starred: !p.starred })}
                          className={`shrink-0 cursor-pointer transition-colors ${p.starred ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'}`}>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={p.starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                        </button>

                        {/* Actions: solve + notes + tag */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={() => setFocusProblem(p)}
                            className="p-1 rounded cursor-pointer text-zinc-600 hover:text-accent-400 transition-colors"
                            title="Focus Mode">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                            </svg>
                          </button>
                          <button onClick={() => setNotesProblem(p)}
                            className={`p-1 rounded cursor-pointer transition-colors
                              ${p.notes ? 'text-accent-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                            title={p.notes ? 'Edit notes' : 'Add notes'}>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                            </svg>
                          </button>
                          {tagInput === p.id ? (
                            <input
                              autoFocus
                              type="text"
                              placeholder="tag"
                              className="w-14 text-[10px] bg-surface-800 border border-surface-600 rounded px-1 py-0.5 text-zinc-300 focus:outline-none focus:border-accent-500/50"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') addTag(p.id, e.target.value);
                                if (e.key === 'Escape') setTagInput(null);
                              }}
                              onBlur={(e) => { if (e.target.value) addTag(p.id, e.target.value); else setTagInput(null); }}
                              list={`tags-${p.id}`}
                            />
                          ) : (
                            <button
                              onClick={() => setTagInput(p.id)}
                              className="p-1 rounded cursor-pointer text-zinc-800 group-hover:text-zinc-600 hover:!text-zinc-400 transition-colors"
                              title="Add tag">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                              </svg>
                            </button>
                          )}
                          <datalist id={`tags-${p.id}`}>
                            {TAG_PRESETS.map(t => <option key={t} value={t} />)}
                          </datalist>
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
