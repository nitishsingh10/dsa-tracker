import { useMemo } from 'react';

export default function Filters({ problems, filters, setFilters }) {
  const platforms = useMemo(() => {
    const s = new Set(problems.map(p => p.platform).filter(Boolean));
    return Array.from(s).sort();
  }, [problems]);

  // Collect all user tags across problems
  const allTags = useMemo(() => {
    const s = new Set();
    for (const p of problems) {
      if (p.tags) p.tags.forEach(t => s.add(t));
    }
    return Array.from(s).sort();
  }, [problems]);

  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const activeFilterCount = [
    filters.difficulty !== 'All',
    filters.platform !== 'All',
    filters.status !== 'All',
    filters.tag !== 'All',
    filters.starred,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          id="search-input"
          type="text"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Search problems, topics..."
          className="w-full pl-9 pr-3 py-1.5 bg-surface-800 border border-surface-700 rounded-lg text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-surface-500 transition-colors"
        />
      </div>

      {/* Difficulty */}
      {['All', 'Easy', 'Medium', 'Hard'].map(d => (
        <button
          key={d}
          onClick={() => updateFilter('difficulty', d)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border
            ${filters.difficulty === d
              ? d === 'Easy' ? 'text-diff-easy border-diff-easy/30 bg-diff-easy/10'
              : d === 'Medium' ? 'text-diff-medium border-diff-medium/30 bg-diff-medium/10'
              : d === 'Hard' ? 'text-diff-hard border-diff-hard/30 bg-diff-hard/10'
              : 'text-accent-400 border-accent-500/30 bg-accent-500/10'
              : 'text-zinc-600 border-surface-700 hover:text-zinc-400'}`}
        >
          {d}
        </button>
      ))}

      {/* Platform */}
      <select
        id="platform-filter"
        value={filters.platform}
        onChange={(e) => updateFilter('platform', e.target.value)}
        className="px-2.5 py-1.5 bg-surface-800 border border-surface-700 rounded-lg text-xs text-zinc-400 focus:outline-none cursor-pointer"
      >
        <option value="All">Platform</option>
        {platforms.map(p => <option key={p} value={p}>{p}</option>)}
      </select>

      {/* Status */}
      <select
        id="status-filter"
        value={filters.status}
        onChange={(e) => updateFilter('status', e.target.value)}
        className="px-2.5 py-1.5 bg-surface-800 border border-surface-700 rounded-lg text-xs text-zinc-400 focus:outline-none cursor-pointer"
      >
        <option value="All">Status</option>
        <option value="Todo">Todo</option>
        <option value="In Progress">In Progress</option>
        <option value="Done">Done</option>
      </select>

      {/* Tags filter */}
      {allTags.length > 0 && (
        <select
          id="tag-filter"
          value={filters.tag || 'All'}
          onChange={(e) => updateFilter('tag', e.target.value)}
          className="px-2.5 py-1.5 bg-surface-800 border border-surface-700 rounded-lg text-xs text-zinc-400 focus:outline-none cursor-pointer"
        >
          <option value="All">Tags</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      )}

      {/* Starred filter */}
      <button
        onClick={() => updateFilter('starred', !filters.starred)}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border
          ${filters.starred
            ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
            : 'text-zinc-600 border-surface-700 hover:text-zinc-400'}`}
        title="Show starred only"
      >
        ★
      </button>

      {/* Clear filters */}
      {activeFilterCount > 0 && (
        <button
          onClick={() => setFilters({ search: filters.search, difficulty: 'All', platform: 'All', status: 'All', tag: 'All', starred: false })}
          className="px-2 py-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 cursor-pointer transition-colors"
        >
          Clear ({activeFilterCount})
        </button>
      )}
    </div>
  );
}
