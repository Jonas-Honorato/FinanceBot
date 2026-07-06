import { Download, Pencil, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api, downloadUrl, getToken } from '../services/api.js';
import { useApi } from '../hooks/useApi.js';
import { currency, dateBR } from '../utils/format.js';

const typeLabels = { expense: 'Gasto', income: 'Receita' };
const categories = ['AlimentaÃ§Ã£o', 'SalÃ¡rio', 'Receita', 'Transporte', 'SaÃºde', 'Lazer', 'Moradia', 'EducaÃ§Ã£o', 'VestuÃ¡rio', 'Outros'];

function toDateInput(value) {
  return String(value || '').slice(0, 10);
}

export function Transactions() {
  const [filters, setFilters] = useState({ search: '', category: '', type: '' });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const query = useMemo(() => new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))).toString(), [filters]);
  const { data, loading, error, reload } = useApi(`/api/transactions?${query}`, [query]);

  function startEdit(item) {
    setEditing(item);
    setForm({
      type: item.type || 'expense',
      amount: Number(item.amount),
      category: item.category,
      description: item.description || '',
      date: toDateInput(item.date),
      createdVia: item.created_via || 'manual'
    });
    setEditError('');
  }

  function closeEdit() {
    setEditing(null);
    setForm(null);
    setSaving(false);
    setEditError('');
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (!editing || !form) return;
    setSaving(true);
    setEditError('');
    try {
      await api(`/api/transactions/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...form, amount: Number(form.amount) })
      });
      closeEdit();
      reload();
    } catch (err) {
      setEditError(err.message);
      setSaving(false);
    }
  }

  async function remove(id) {
    await api(`/api/transactions/${id}`, { method: 'DELETE' });
    reload();
  }

  function exportCsv() {
    const token = getToken();
    window.open(`${downloadUrl('/api/reports/export-csv')}?token=${token}`, '_blank');
  }

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 rounded border border-line bg-panel p-4 md:flex-row md:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-sm text-slate-300">Busca</span>
          <div className="flex items-center gap-2 rounded border border-line bg-ink px-3">
            <Search size={18} className="text-slate-500" />
            <input className="w-full bg-transparent py-2 outline-none" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Descrição" />
          </div>
        </label>
        <label className="md:w-56">
          <span className="mb-1 block text-sm text-slate-300">Tipo</span>
          <select className="w-full rounded border border-line bg-ink px-3 py-2" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">Todos</option>
            <option value="expense">Gastos</option>
            <option value="income">Receitas</option>
          </select>
        </label>
        <label className="md:w-56">
          <span className="mb-1 block text-sm text-slate-300">Categoria</span>
          <select className="w-full rounded border border-line bg-ink px-3 py-2" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">Todas</option>
            {['Alimentação', 'Salário', 'Receita', 'Transporte', 'Saúde', 'Lazer', 'Moradia', 'Educação', 'Vestuário', 'Outros'].map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <button title="Atualizar" className="grid h-10 w-10 place-items-center rounded border border-line" onClick={reload}><RefreshCw size={18} /></button>
        <button title="Exportar CSV" className="grid h-10 w-10 place-items-center rounded border border-line" onClick={exportCsv}><Download size={18} /></button>
      </section>

      <section className="overflow-hidden rounded border border-line bg-panel">
        {error ? <p className="p-4 text-red-200">{error}</p> : null}
        {loading ? <p className="p-4 text-slate-400">Carregando transações...</p> : null}
        {!loading && (data?.data || []).length === 0 ? <p className="p-4 text-slate-400">Nenhuma transação encontrada.</p> : null}
        {(data?.data || []).length > 0 ? (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-ink text-slate-400">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((item) => (
                <tr key={item.id} className="border-t border-line">
                  <td className="px-4 py-3">{dateBR(item.date)}</td>
                  <td className="px-4 py-3">{typeLabels[item.type] || 'Gasto'}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">{item.description}</td>
                  <td className={`px-4 py-3 font-medium ${item.type === 'income' ? 'text-mint' : 'text-red-200'}`}>{currency(item.amount)}</td>
                  <td className="px-4 py-3">{item.created_via}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button title="Editar" className="grid h-8 w-8 place-items-center rounded border border-line text-slate-300" onClick={() => startEdit(item)}>
                        <Pencil size={16} />
                      </button>
                      <button title="Excluir" className="grid h-8 w-8 place-items-center rounded border border-line text-red-300" onClick={() => remove(item.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      {editing && form ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/60 p-4">
          <form onSubmit={saveEdit} className="w-full max-w-xl rounded border border-line bg-panel p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Editar transaÃ§Ã£o</h2>
              <button type="button" title="Fechar" className="grid h-8 w-8 place-items-center rounded border border-line" onClick={closeEdit}>
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-sm text-slate-300">Tipo</span>
                <select className="w-full rounded border border-line bg-ink px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="expense">Gasto</option>
                  <option value="income">Receita</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-sm text-slate-300">Valor</span>
                <input type="number" min="0.01" step="0.01" className="w-full rounded border border-line bg-ink px-3 py-2" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </label>
              <label>
                <span className="mb-1 block text-sm text-slate-300">Categoria</span>
                <select className="w-full rounded border border-line bg-ink px-3 py-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-sm text-slate-300">Data</span>
                <input type="date" className="w-full rounded border border-line bg-ink px-3 py-2" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </label>
            </div>

            <label className="mt-3 block">
              <span className="mb-1 block text-sm text-slate-300">DescriÃ§Ã£o</span>
              <input className="w-full rounded border border-line bg-ink px-3 py-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>

            {editError ? <p className="mt-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{editError}</p> : null}

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded border border-line px-4 py-2 text-sm" onClick={closeEdit}>
                Cancelar
              </button>
              <button className="flex items-center gap-2 rounded bg-mint px-4 py-2 text-sm font-medium" disabled={saving}>
                <Save size={16} />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
