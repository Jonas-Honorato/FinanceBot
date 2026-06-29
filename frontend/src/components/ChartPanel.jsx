export function ChartPanel({ title, children }) {
  return (
    <section className="rounded border border-line bg-panel p-4">
      <h2 className="mb-4 text-base font-semibold text-white">{title}</h2>
      <div className="h-72">{children}</div>
    </section>
  );
}
