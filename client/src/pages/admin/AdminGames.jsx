import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';

const emptyGame = {
  name: '',
  description: '',
  icon: '',
  pteroNestId: '',
  isActive: true,
  sortOrder: 0,
};

export default function AdminGames() {
  const [games, setGames] = useState([]);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const load = () => api.admin.getGames().then(setGames).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const submitData = { ...form };
      if (editId) {
        await api.admin.updateGame(editId, submitData);
      } else {
        await api.admin.createGame(submitData);
      }
      setForm(null);
      setEditId(null);
      load();
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Удалить игру?')) {
      await api.admin.deleteGame(id);
      load();
    }
  };

  const startEdit = (game) => {
    setEditId(game.id);
    setForm({
      ...game,
      pteroNestId: game.pteroNestId || '',
    });
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const result = await api.admin.syncPterodactyl();
      setSyncMessage(`✓ ${result.message}`);
      load();
    } catch (err) {
      setSyncMessage('✕ Ошибка: ' + (err.response?.data?.error || err.message));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Игры</h1>
          <p className="text-[#666] mt-1">Управление играми и синхронизация с Pterodactyl</p>
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
            onClick={() => { setForm({ ...emptyGame }); setEditId(null); }}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить игру
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
            {editId ? 'Редактировать игру' : 'Новая игра'}
          </h2>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Название</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="input-primary"
                  placeholder="Minecraft"
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
                rows={3}
                placeholder="Описание игры..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Иконка (URL или emoji)</label>
              <input
                type="text"
                value={form.icon}
                onChange={e => setForm({ ...form, icon: e.target.value })}
                className="input-primary"
                placeholder="🎮 или https://..."
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-[#dc143c]/30 bg-[#1a1a1a] text-[#dc143c] focus:ring-[#dc143c]/50"
                />
                <span className="text-sm text-[#a0a0a0]">Активна</span>
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

      {/* Список игр */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left font-medium text-[#666]">ID</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Иконка</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Название</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Описание</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Nest ID</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Статус</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Порядок</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {games.map(game => (
              <tr key={game.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4 font-medium text-white">{game.id}</td>
                <td className="px-6 py-4 text-2xl">{game.icon || '🎮'}</td>
                <td className="px-6 py-4">
                  <p className="text-white font-medium">{game.name}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs text-[#666] max-w-xs truncate">{game.description || '—'}</p>
                </td>
                <td className="px-6 py-4 text-white font-mono text-xs">{game.pteroNestId || '—'}</td>
                <td className="px-6 py-4">
                  {game.isActive !== false ? (
                    <span className="badge badge-success">Активна</span>
                  ) : (
                    <span className="badge badge-danger">Неактивна</span>
                  )}
                </td>
                <td className="px-6 py-4 text-white">{game.sortOrder}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(game)}
                      className="text-[#dc143c] hover:text-[#ff1493] text-xs font-medium transition"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => handleDelete(game.id)}
                      className="text-red-500 hover:text-red-400 text-xs font-medium transition"
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {games.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-[#666]">
                  Нет игр. Нажмите "Синхронизировать" для импорта из Pterodactyl
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
