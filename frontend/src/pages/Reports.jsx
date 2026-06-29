import { Download } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { downloadUrl, getToken } from '../services/api.js';
import { currency, dateBR } from '../utils/format.js';

export function Reports() {
  const { data, loading } = useApi('/api/reports/monthly', []);
  const trend = data ? Number(data.total) > 0 ? 'Há gastos registrados neste mês para análise.' : 'Ainda não há dados suficientes.' : '';

  return (
    <div className="space-y-4">
      <section className="rounded border border-line bg-panel p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Relatório mensal</h2>
            <p className="text-sm text-slate-400">{loading ? 'Carregando...' : `Total de ${currency(data?.total || 0)} no período ${data?.month}/${data?.year}`}</p>
          </div>
          <a className="flex items-center justify-center gap-2 rounded border border-line px-4 py-2 text-sm" href={downloadUrl(`/api/reports/monthly?format=pdf&token=${getToken()}`)} target="_blank" rel="noreferrer">
            <Download size={18} />
            PDF
          </a>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded border border-line bg-panel p-4">
          <h3 className="mb-3 font-semibold">Top 5 maiores gastos</h3>
          <div className="space-y-2">
            {(data?.topFive || []).map((item, index) => (
              <div key={`${item.description}-${index}`} className="flex items-center justify-between gap-3 rounded bg-ink px-3 py-2">
                <div>
                  <p className="font-medium">{item.description || item.category}</p>
                  <p className="text-xs text-slate-400">{item.category} · {dateBR(item.date)}</p>
                </div>
                <span>{currency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded border border-line bg-panel p-4">
          <h3 className="mb-3 font-semibold">Análise de tendência</h3>
          <p className="text-slate-300">{trend}</p>
        </div>
      </section>
    </div>
  );
}
