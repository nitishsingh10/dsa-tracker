export default function ProgressBar({ value, max, size = 'md', className = '', color = 'accent' }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colors = {
    accent: 'from-accent-500 to-neon-purple',
    green: 'from-emerald-500 to-teal-400',
    amber: 'from-amber-500 to-orange-400',
    pink: 'from-pink-500 to-rose-400',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-surface-700 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${sizes[size]} rounded-full bg-gradient-to-r ${colors[color]} transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
