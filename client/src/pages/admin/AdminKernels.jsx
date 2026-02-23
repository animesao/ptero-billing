import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';

const emptyKernel = {
  gameId: '',
  name: '',
  description: '',
  pteroEggId: '',
  pteroNestId: '',
  dockerImage: '',
  startup: '',
  environment: '',
  isActive: true,
  sortOrder: 0,
};

export default function AdminKernels() {
  const [kernels, setKernels] = useState([]);
  const [games, setGames] = useState([]);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [showEnv, setShowEnv] = useState(false);

  const loadKernels = () => api.admin.getKernels().then(setKernels).catch(() => {});
  const loadGames = () => api.admin.getGames().then(setGames).catch(() => {});

  useEffect(() => {
    loadKernels();
    loadGames();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const submitData = { ...form };
      if (editId) {
        await api.admin.updateKernel(editId, submitData);
      } else {
        await api.admin.createKernel(submitData);
      }
      setForm(null);
      setEditId(null);
      loadKernels();
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Удалить ядро?')) {
      await api.admin.deleteKernel(id);
      loadKernels();
    }
  };

  const startEdit = (kernel) => {
    setEditId(kernel.id);
    setForm({
      ...kernel,
      pteroEggId: kernel.pteroEggId || '',
      pteroNestId: kernel.pteroNestId || '',
      environment: kernel.environment ? (typeof kernel.environment === 'string' ? kernel.environment : JSON.stringify(kernel.environment)) : '',
    });
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const result = await api.admin.syncPterodactyl();
      setSyncMessage(`✓ ${result.message}`);
      loadKernels();
      loadGames();
    } catch (err) {
      setSyncMessage('✕ Ошибка: ' + (err.response?.data?.error || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const getGameName = (gameId) => {
    const game = games.find(g => g.id === gameId);
    return game ? game.name : '—';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Ядра</h1>
          <p className="text-[#666] mt-1">Управление ядрами (конфигурациями серверов)</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Синхронизация...' : 'Синхронизировать'}
          </button>
          <button
            onClick={() => { setForm({ ...emptyKernel }); setEditId(null); }}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить ядро
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className={`p-4 rounded-xl animate-slide-up ${
          syncMessage.includes('✓')
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {syncMessage}
        </div>
      )}

      {form && (
        <div className="glass-card p-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-white mb-6">
            {editId ? 'Редактировать ядро' : 'Новое ядро'}
          </h2>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Игра</label>
                <select
                  value={form.gameId || ''}
                  onChange={e => setForm({ ...form, gameId: parseInt(e.target.value) || '' })}
                  className="input-primary"
                >
                  <option value="">Не выбрано</option>
                  {games.map(game => (
                    <option key={game.id} value={game.id}>{game.icon || '🎮'} {game.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Название</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="input-primary"
                  placeholder="Paper 1.20.4"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Pterodactyl Egg ID</label>
                <input
                  type="number"
                  value={form.pteroEggId}
                  onChange={e => setForm({ ...form, pteroEggId: e.target.value })}
                  className="input-primary"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Pterodactyl Nest ID</label>
                <input
                  type="number"
                  value={form.pteroNestId}
                  onChange={e => setForm({ ...form, pteroNestId: e.target.value })}
                  className="input-primary"
                  placeholder="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Описание</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="input-primary"
                rows={2}
                placeholder="Описание ядра..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Docker Image</label>
              <input
                type="text"
                value={form.dockerImage}
                onChange={e => setForm({ ...form, dockerImage: e.target.value })}
                className="input-primary"
                placeholder="ghcr.io/parkervcp/yolks:java_21"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Startup Command</label>
              <input
                type="text"
                value={form.startup}
                onChange={e => setForm({ ...form, startup: e.target.value })}
                className="input-primary"
                placeholder="java -Xms128M -Xmx${SERVER_MEMORY}M -jar ${SERVER_JARFILE}"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[#a0a0a0]">Environment Variables (JSON)</label>
                <button
                  type="button"
                  onClick={() => setShowEnv(!showEnv)}
                  className="text-xs text-[#dc143c] hover:text-[#ff1493]"
                >
                  {showEnv ? 'Скрыть' : 'Показать пример'}
                </button>
              </div>
              <textarea
                value={form.environment}
                onChange={e => setForm({ ...form, environment: e.target.value })}
                className="input-primary font-mono text-xs"
                rows={showEnv ? 10 : 4}
                placeholder='{"SERVER_JARFILE": "server.jar", "MINECRAFT_VERSION": "latest"}'
              />
              {showEnv && (
                <div className="mt-2 p-3 bg-white/5 rounded-lg text-xs text-[#666]">
                  <p className="mb-1">Пример для Minecraft:</p>
                  <pre className="text-[#a0a0a0]">{`{
  "SERVER_JARFILE": "server.jar",
  "MINECRAFT_VERSION": "latest",
  "BUILD_NUMBER": "latest"
}`}</pre>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-[#dc143c]/30 bg-[#1a1a1a] text-[#dc143c] focus:ring-[#dc143c]/50"
                />
                <span className="text-sm text-[#a0a0a0]">Активно</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-[#a0a0a0]">Порядок:</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) })}
                  className="w-20 input-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={() => { setForm(null); setEditId(null); }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список ядер */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left font-medium text-[#666]">ID</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Игра</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Название</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Docker Image</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Egg ID</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Статус</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {kernels.map(kernel => (
              <tr key={kernel.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4 font-medium text-white">{kernel.id}</td>
                <td className="px-6 py-4 text-white">{getGameName(kernel.gameId)}</td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white font-medium">{kernel.name}</p>
                    {kernel.description && <p className="text-xs text-[#666]">{kernel.description}</p>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="text-xs text-[#a0a0a0] bg-white/5 px-2 py-1 rounded">
                    {kernel.dockerImage || '—'}
                  </code>
                </td>
                <td className="px-6 py-4 text-white font-mono text-xs">{kernel.pteroEggId || '—'}</td>
                <td className="px-6 py-4">
                  {kernel.isActive !== false ? (
                    <span className="badge badge-success">Активно</span>
                  ) : (
                    <span className="badge badge-danger">Неактивно</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(kernel)}
                      className="text-[#dc143c] hover:text-[#ff1493] text-xs font-medium transition"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => handleDelete(kernel.id)}
                      className="text-red-500 hover:text-red-400 text-xs font-medium transition"
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {kernels.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-[#666]">
                  Нет ядер. Нажмите "Синхронизировать" для импорта из Pterodactyl
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
