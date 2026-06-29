import { useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../services/api.js';
import { useApi } from '../hooks/useApi.js';
import { currency } from '../utils/format.js';

const categories = ['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Moradia', 'Educação', 'Vestuário', 'Outros'];

export function Budgets() {
  const { data, reload } = useApi('/api/budgets', []);
  const [form, setForm] = useState({ category: 'Alimentação', limitAmount: 1000 });

  async function submit(event) {
    event.preventDefault();
    await api('/api/budgets', { method: 'POST', body: JSON.stringify({ ...form, limitAmount: Number(form.limitAmount) }) });
    reload();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="rounded border border-line bg-panel p-4">
        <h2 className="mb-4 font-semibold">Definir meta mensal</h2>
        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-slate-300">Categoria</span>
          <select className="w-full rounded border border-line bg-ink px-3 py-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-slate-300">Limite</span>
          <input type="number" className="w-full rounded border border-line bg-ink px-3 py-2" value={form.limitAmount} onChange={(e) => setForm({ ...form, limitAmount: e.target.value })} />
        </label>
        <button className="flex w-full items-center justify-center gap-2 rounded bg-mint px-4 py-2 font-medium">
          <Save size={18} />
          Salvar meta
        </button>
      </form>

      <section className="space-y-3">
        {(data?.data || []).map((budget) => {
          const percent = Math.min((Number(budget.spent) / Number(budget.limit_amount)) * 100, 100);
          const alert = percent >= 100 ? 'bg-danger' : percent >= 80 ? 'bg-amber-500' : 'bg-mint';
          return (
            <div key={budget.id} className="rounded border border-line bg-panel p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium">{budget.category}</h3>
                  <p className="text-sm text-slate-400">{currency(budget.spent)} de {currency(budget.limit_amount)}</p>
                </div>
                <span className="text-sm text-slate-300">{percent.toFixed(0)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded bg-ink">
                <div className={`h-full ${alert}`} style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
        {(data?.data || []).length === 0 ? <p className="rounded border border-line bg-panel p-4 text-slate-400">Nenhuma meta cadastrada para este mês.</p> : null}
      </section>
    </div>
  );
}
