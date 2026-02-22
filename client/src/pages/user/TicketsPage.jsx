import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import StatusBadge, { formatDate } from '../../components/StatusBadge.jsx';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '', categoryId: '', priority: 'normal' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTickets().then(setTickets).catch(() => {});
    api.getTicketCategories().then(setCategories).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await api.createTicket(form);
      setShowNew(false);
      setForm({ subject: '', body: '', categoryId: '', priority: 'normal' });
      api.getTickets().then(setTickets);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Тикеты поддержки</h1>
        <button onClick={() => setShowNew(!showNew)} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition">
          {showNew ? 'Отмена' : 'Новый тикет'}
        </button>
      </div>

      {showNew && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="font-semibold mb-4">Создать тикет</h2>
          {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Тема</label>
                <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1.5">Категория</label>
                  <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition">
                    <option value="">Без категории</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1.5">Приоритет</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition">
                    <option value="low">Низкий</option>
                    <option value="normal">Обычный</option>
                    <option value="high">Высокий</option>
                    <option value="urgent">Срочный</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Сообщение</label>
              <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required rows={5} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition resize-none" />
            </div>
            <button type="submit" disabled={creating} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition disabled:opacity-50">
              {creating ? 'Создание...' : 'Создать тикет'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Тема</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Приоритет</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Статус</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Обновлён</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {tickets.map(t => (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3 font-medium">{t.id}</td>
                <td className="px-4 py-3"><Link to={`/tickets/${t.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">{t.subject}</Link></td>
                <td className="px-4 py-3"><StatusBadge status={t.priority} /></td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(t.updatedAt)}</td>
              </tr>
            ))}
            {tickets.length === 0 && <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">Нет тикетов</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
