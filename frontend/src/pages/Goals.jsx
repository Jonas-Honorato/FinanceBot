import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '../services/api.js';
import { useApi } from '../hooks/useApi.js';
import { currency, dateBR } from '../utils/format.js';

function nextMonthISO(months = 6) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

export function Goals() {
  const { data, loading, error, reload } = useApi('/api/goals', []);
  const [form, setForm] = useState({
    title: 'Reserva financeira',
    targetAmount: 3000,
    currentAmount: 0,
    deadline: nextMonthISO(6)
  });

  async function submit(event) {
    event.preventDefault();
    await api('/api/goals', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount || 0)
      })
    });
    setForm({ title: 'Reserva financeira', targetAmount: 3000, currentAmount: 0, deadline: nextMonthISO(6) });
    reload();
  }

  async function remove(id) {
    await api(`/api/goals/${id}`, { method: 'DELETE' });
    reload();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="rounded border border-line bg-panel p-4">
        <h2 className="mb-4 font-semibold">Nova meta financeira</h2>
        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-slate-300">Titulo</span>
          <input className="w-full rounded border border-line bg-ink px-3 py-2" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-slate-300">Valor alvo</span>
          <input type="number" min="1" step="0.01" className="w-full rounded border border-line bg-ink px-3 py-2" value={form.targetAmount} onChange={(event) => setForm({ ...form, targetAmount: event.target.value })} />
        </label>
        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-slate-300">Valor atual</span>
          <input type="number" min="0" step="0.01" className="w-full rounded border border-line bg-ink px-3 py-2" value={form.currentAmount} onChange={(event) => setForm({ ...form, currentAmount: event.target.value })} />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-slate-300">Prazo</span>
          <input type="date" className="w-full rounded border border-line bg-ink px-3 py-2" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />
        </label>
        <button className="flex w-full items-center justify-center gap-2 rounded bg-mint px-4 py-2 font-medium">
          <Plus size={18} />
          Criar meta
        </button>
      </form>

      <section className="space-y-3">
        {error ? <p className="rounded border border-line bg-panel p-4 text-red-200">{error}</p> : null}
        {loading ? <p className="rounded border border-line bg-panel p-4 text-slate-400">Carregando metas...</p> : null}
        {(data?.data || []).map((goal) => {
          const progress = Math.min(Number(goal.progress_percent || 0), 100);
          return (
            <div key={goal.id} className="rounded border border-line bg-panel p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{goal.title}</h3>
                  <p className="text-sm text-slate-400">
                    {currency(goal.current_amount)} de {currency(goal.target_amount)} ate {dateBR(goal.deadline)}
                  </p>
                </div>
                <button title="Excluir" className="grid h-8 w-8 place-items-center rounded border border-line text-red-300" onClick={() => remove(goal.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mb-3 h-3 overflow-hidden rounded bg-ink">
                <div className="h-full bg-mint" style={{ width: `${progress}%` }} />
              </div>
              <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                <span>Falta {currency(goal.remaining_amount)}</span>
                <span>{progress}% concluido</span>
                <span>Guardar {currency(goal.monthly_required_amount)}/mes</span>
              </div>
            </div>
          );
        })}
        {!loading && (data?.data || []).length === 0 ? (
          <p className="rounded border border-line bg-panel p-4 text-slate-400">Nenhuma meta financeira cadastrada.</p>
        ) : null}
      </section>
    </div>
  );
}
