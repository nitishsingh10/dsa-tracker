export default function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm
        ${isError ? 'bg-red-950 border-red-800 text-red-300' : 'bg-surface-800 border-surface-600 text-zinc-300'}`}>
        <span>{toast.message}</span>
        <button onClick={onDismiss} className="text-zinc-600 hover:text-zinc-400 cursor-pointer ml-1">✕</button>
      </div>
    </div>
  );
}
