export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-surface-600 text-gray-300',
    easy: 'bg-diff-easy/15 text-diff-easy border border-diff-easy/30',
    medium: 'bg-diff-medium/15 text-diff-medium border border-diff-medium/30',
    hard: 'bg-diff-hard/15 text-diff-hard border border-diff-hard/30',
    unknown: 'bg-surface-600 text-gray-400',
    // Platform badges
    leetcode: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    geeksforgeeks: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    hackerrank: 'bg-green-500/15 text-green-400 border border-green-500/30',
    codechef: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    codeforces: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    platform: 'bg-accent-500/15 text-accent-400 border border-accent-500/30',
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${variantClass} ${className}`}>
      {children}
    </span>
  );
}
