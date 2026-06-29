import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, FileText, LogOut, Moon, PieChart, ReceiptText, Target } from 'lucide-react';
import { clearToken } from '../services/api.js';

const nav = [
  { to: '/', label: 'Overview', icon: PieChart },
  { to: '/transactions', label: 'Transações', icon: ReceiptText },
  { to: '/budgets', label: 'Metas', icon: Target },
  { to: '/reports', label: 'Relatórios', icon: FileText }
];

export function Layout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-panel px-4 py-5 lg:block">
        <div className="flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded bg-mint text-white">
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="text-lg font-semibold">FinanceBot</p>
            <p className="text-xs text-slate-400">WhatsApp + Dashboard</p>
          </div>
        </div>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded px-3 py-2 text-sm transition ${isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-ink/95 px-4 backdrop-blur md:px-8">
          <div>
            <p className="text-sm text-slate-400">Organização financeira pessoal</p>
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button title="Tema" className="grid h-9 w-9 place-items-center rounded border border-line text-slate-300">
              <Moon size={18} />
            </button>
            <button
              title="Sair"
              className="grid h-9 w-9 place-items-center rounded border border-line text-slate-300"
              onClick={() => {
                clearToken();
                navigate('/login');
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
