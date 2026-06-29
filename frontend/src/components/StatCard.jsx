export function StatCard({ title, value, detail, tone = 'info' }) {
  const tones = {
    info: 'border-info/40',
    good: 'border-mint/40',
    danger: 'border-danger/40'
  };

  return (
    <div className={`rounded border ${tones[tone]} bg-panel p-4`}>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {detail ? <p className="mt-1 text-xs text-slate-400">{detail}</p> : null}
    </div>
  );
}
