import { useTracker } from '../contexts/TrackerContext';
import Badge from './ui/Badge';
import StatusToggle from './ui/Toggle';

export default function ProblemRow({ problem, onOpenNotes }) {
  const { updateProblem } = useTracker();

  const platformVariant = problem.platform?.toLowerCase().replace(/\s+/g, '') || 'platform';
  const knownPlatforms = ['leetcode', 'geeksforgeeks', 'hackerrank', 'codechef', 'codeforces'];
  const pVariant = knownPlatforms.includes(platformVariant) ? platformVariant : 'platform';

  const diffVariant = problem.difficulty?.toLowerCase() || 'unknown';

  return (
    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-800/40 border border-surface-600/30 hover:border-accent-500/20 hover:bg-surface-700/40 transition-all duration-200">
      {/* Problem name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{problem.problemName}</p>
        {problem.contentCovered && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{problem.contentCovered}</p>
        )}
      </div>

      {/* Platform badge */}
      {problem.platform && (
        <Badge variant={pVariant} className="hidden sm:inline-flex shrink-0">
          {problem.platform}
        </Badge>
      )}

      {/* Difficulty badge */}
      <Badge variant={diffVariant} className="shrink-0">
        {problem.difficulty}
      </Badge>

      {/* Status toggle */}
      <StatusToggle
        status={problem.status}
        onChange={(newStatus) => updateProblem(problem.id, { status: newStatus })}
      />

      {/* Star */}
      <button
        onClick={() => updateProblem(problem.id, { starred: !problem.starred })}
        className={`shrink-0 transition-all duration-200 cursor-pointer hover:scale-110 ${problem.starred ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'}`}
        title={problem.starred ? 'Unstar' : 'Star'}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill={problem.starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      </button>

      {/* Notes */}
      <button
        onClick={() => onOpenNotes(problem)}
        className={`shrink-0 transition-all duration-200 cursor-pointer hover:scale-110 ${problem.notes ? 'text-accent-400' : 'text-gray-600 hover:text-gray-400'}`}
        title="Notes"
      >
        <svg className="w-5 h-5" fill={problem.notes ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      </button>

      {/* Link */}
      {problem.link && (
        <a
          href={problem.link}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-gray-600 hover:text-accent-400 transition-all duration-200 hover:scale-110"
          title="Open problem"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      )}
    </div>
  );
}
