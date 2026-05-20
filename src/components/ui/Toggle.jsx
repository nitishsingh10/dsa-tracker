const statusConfig = {
  todo: {
    label: 'Todo',
    bg: 'bg-status-todo/15',
    text: 'text-status-todo',
    border: 'border-status-todo/30',
    ring: 'ring-status-todo/20',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  'in-progress': {
    label: 'In Progress',
    bg: 'bg-status-progress/15',
    text: 'text-status-progress',
    border: 'border-status-progress/30',
    ring: 'ring-status-progress/20',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M12 6v6l4 2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  done: {
    label: 'Done',
    bg: 'bg-status-done/15',
    text: 'text-status-done',
    border: 'border-status-done/30',
    ring: 'ring-status-done/20',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
};

const cycleOrder = ['todo', 'in-progress', 'done'];

export default function StatusToggle({ status, onChange }) {
  const config = statusConfig[status] || statusConfig.todo;

  const handleClick = () => {
    const currentIndex = cycleOrder.indexOf(status);
    const nextIndex = (currentIndex + 1) % cycleOrder.length;
    onChange(cycleOrder[nextIndex]);
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200
        ${config.bg} ${config.text} ${config.border}
        hover:ring-2 ${config.ring} hover:scale-105 active:scale-95 cursor-pointer`}
      title={`Click to change status (current: ${config.label})`}
    >
      {config.icon}
      {config.label}
    </button>
  );
}
