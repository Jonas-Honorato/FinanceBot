import { Download, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api, downloadUrl, getToken } from '../services/api.js';
import { useApi } from '../hooks/useApi.js';
import { currency, dateBR } from '../utils/format.js';

export function Transactions() {
  const [filters, setFilters] = useState({ search: '', category: '' });
  const query = useMemo(() => new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))).toString(), [filters]);
  const { data, loading, error, reload } = useApi(`/api/transactions?${query}`, [query]);

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
          <span className="mb-1 block text-sm text-slate-300">Categoria</span>
          <select className="w-full rounded border border-line bg-ink px-3 py-2" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">Todas</option>
            {['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Moradia', 'Educação', 'Vestuário', 'Outros'].map((category) => <option key={category}>{category}</option>)}
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
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3 font-medium">{currency(item.amount)}</td>
                  <td className="px-4 py-3">{item.created_via}</td>
                  <td className="px-4 py-3 text-right">
                    <button title="Excluir" className="grid h-8 w-8 place-items-center rounded border border-line text-red-300" onClick={() => remove(item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
