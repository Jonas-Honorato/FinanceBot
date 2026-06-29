import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartPanel } from '../components/ChartPanel.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { useApi } from '../hooks/useApi.js';
import { currency } from '../utils/format.js';

const colors = ['#16a34a', '#38bdf8', '#f97316', '#ef4444', '#a855f7', '#eab308', '#14b8a6', '#64748b'];
const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function Overview() {
  const summary = useApi('/api/summary/monthly', []);
  const byCategory = useApi('/api/summary/by-category', []);
  const daily = useApi('/api/summary/daily', []);
  const comparison = useApi('/api/summary/comparison', []);

  const dailyData = (daily.data?.data || []).map((item) => ({
    ...item,
    day: new Date(item.date).getUTCDate(),
    weekdayLabel: weekdays[item.weekday]
  }));

  const weekData = weekdays.map((day) => ({
    day,
    total: dailyData.filter((item) => item.weekdayLabel === day).reduce((sum, item) => sum + Number(item.total), 0)
  }));

  const weekTotal = weekData.reduce((sum, item) => sum + item.total, 0);
  const s = summary.data || {};

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total no mês" value={currency(s.total)} detail={`${s.count || 0} lançamento(s)`} tone="good" />
        <StatCard title="Total na semana" value={currency(weekTotal)} detail="Calculado pelos registros do mês" />
        <StatCard title="Maior gasto" value={currency(s.biggestTransaction?.amount || 0)} detail={s.biggestTransaction?.description || 'Sem lançamentos'} tone="danger" />
        <StatCard title="Categoria líder" value={s.topCategory?.category || 'Sem dados'} detail={currency(s.topCategory?.total || 0)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Distribuição por categoria">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={byCategory.data?.data || []} dataKey="total" nameKey="category" innerRadius={64} outerRadius={96} paddingAngle={3}>
                {(byCategory.data?.data || []).map((entry, index) => <Cell key={entry.category} fill={colors[index % colors.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => currency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Gastos por dia da semana">
          <ResponsiveContainer>
            <BarChart data={weekData}>
              <CartesianGrid stroke="#2a333b" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip formatter={(value) => currency(value)} />
              <Bar dataKey="total" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Evolução no mês">
          <ResponsiveContainer>
            <LineChart data={dailyData}>
              <CartesianGrid stroke="#2a333b" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip formatter={(value) => currency(value)} />
              <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Mês atual vs. anterior">
          <ResponsiveContainer>
            <BarChart data={comparison.data?.data || []}>
              <CartesianGrid stroke="#2a333b" />
              <XAxis dataKey="category" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip formatter={(value) => currency(value)} />
              <Legend />
              <Bar dataKey="current" name="Atual" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="previous" name="Anterior" fill="#64748b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>
    </div>
  );
}
