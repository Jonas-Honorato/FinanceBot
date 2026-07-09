import { AlertTriangle, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken, setToken } from '../services/api.js';
import { useApi } from '../hooks/useApi.js';

export function Account() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi('/api/account', []);
  const [form, setForm] = useState({ name: '', email: '', whatsappNumber: '' });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [deleteForm, setDeleteForm] = useState({ currentPassword: '', confirmation: '' });
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!data?.data) return;
    setForm({
      name: data.data.name || '',
      email: data.data.email || '',
      whatsappNumber: data.data.whatsapp_number || ''
    });
  }, [data]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      const payload = await api('/api/account', {
        method: 'PUT',
        body: JSON.stringify(form)
      });
      if (payload.token) setToken(payload.token);
      setSaveMessage('Conta atualizada com sucesso.');
      reload();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeAccount(event) {
    event.preventDefault();
    setDeleteError('');

    if (deleteForm.confirmation !== 'EXCLUIR') {
      setDeleteError('Digite EXCLUIR para confirmar.');
      return;
    }

    setDeleting(true);
    try {
      await api('/api/account', {
        method: 'DELETE',
        body: JSON.stringify({ currentPassword: deleteForm.currentPassword })
      });
      clearToken();
      navigate('/login');
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <section className="rounded border border-line bg-panel p-4">
        <div className="mb-4">
          <h2 className="font-semibold">Configuracoes da conta</h2>
          <p className="mt-1 text-sm text-slate-400">Atualize os dados usados para acessar o painel e vincular mensagens do WhatsApp.</p>
        </div>

        {error ? <p className="mb-3 rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        {loading ? <p className="rounded border border-line bg-ink p-3 text-sm text-slate-400">Carregando conta...</p> : null}

        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Nome</span>
            <input className="w-full rounded border border-line bg-ink px-3 py-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">E-mail</span>
            <input type="email" className="w-full rounded border border-line bg-ink px-3 py-2" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm text-slate-300">WhatsApp</span>
            <input className="w-full rounded border border-line bg-ink px-3 py-2" placeholder="+5511999999999" value={form.whatsappNumber} onChange={(event) => setForm({ ...form, whatsappNumber: event.target.value })} />
          </label>
          <div className="md:col-span-2">
            {saveError ? <p className="mb-3 rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-red-200">{saveError}</p> : null}
            {saveMessage ? <p className="mb-3 rounded border border-mint/40 bg-mint/10 px-3 py-2 text-sm text-green-200">{saveMessage}</p> : null}
            <button className="inline-flex items-center gap-2 rounded bg-mint px-4 py-2 font-medium text-white disabled:opacity-70" disabled={saving || loading}>
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar alteracoes'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded border border-danger/40 bg-panel p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-danger/15 text-red-200">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-red-100">Excluir conta</h2>
            <p className="mt-1 text-sm text-slate-400">Remove sua conta e apaga transacoes, limites e metas vinculadas.</p>
          </div>
        </div>

        <form onSubmit={removeAccount} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Senha atual</span>
            <input type="password" className="w-full rounded border border-line bg-ink px-3 py-2" value={deleteForm.currentPassword} onChange={(event) => setDeleteForm({ ...deleteForm, currentPassword: event.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-slate-300">Confirmacao</span>
            <input className="w-full rounded border border-line bg-ink px-3 py-2" placeholder="Digite EXCLUIR" value={deleteForm.confirmation} onChange={(event) => setDeleteForm({ ...deleteForm, confirmation: event.target.value })} />
          </label>
          {deleteError ? <p className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-red-200">{deleteError}</p> : null}
          <button className="inline-flex w-full items-center justify-center gap-2 rounded bg-danger px-4 py-2 font-medium text-white disabled:opacity-70" disabled={deleting}>
            <Trash2 size={18} />
            {deleting ? 'Excluindo...' : 'Excluir minha conta'}
          </button>
        </form>
      </section>
    </div>
  );
}
