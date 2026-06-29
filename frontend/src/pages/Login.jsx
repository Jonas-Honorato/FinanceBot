import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { api, setToken } from '../services/api.js';

export function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'demo@financebot.dev', password: 'password123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setToken(payload.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded border border-line bg-panel p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded bg-mint text-white">
            <BarChart3 />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">FinanceBot</h1>
            <p className="text-sm text-slate-400">Entrar na dashboard</p>
          </div>
        </div>
        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-slate-300">E-mail</span>
          <input className="w-full rounded border border-line bg-ink px-3 py-2 text-white" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-slate-300">Senha</span>
          <input type="password" className="w-full rounded border border-line bg-ink px-3 py-2 text-white" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error ? <p className="mb-3 rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        <button className="w-full rounded bg-mint px-4 py-2 font-medium text-white disabled:opacity-70" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
