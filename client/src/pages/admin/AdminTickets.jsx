import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import StatusBadge, { formatDate } from '../../components/StatusBadge.jsx';

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    api.admin.getTickets().then(setTickets).catch(() => {});
    api.admin.getCategories().then(setCategories).catch(() => {});
  }, []);

  const addCategory = async () => {
    if (!newCat.trim()) return;
    await api.admin.createCategory({ name: newCat });
    setNewCat('');
    api.admin.getCategories().then(setCategories);
  };

  const deleteCat = async (id) => {
    await api.admin.deleteCategory(id);
    api.admin.getCategories().then(setCategories);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Тикеты</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">User ID</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Тема</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Приоритет</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Обновлён</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tickets.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium">{t.id}</td>
                    <td className="px-4 py-3">{t.userId}</td>
                    <td className="px-4 py-3"><Link to={`/admin/tickets/${t.id}`} className="text-primary-600 dark:text-primary-400 hover:underline">{t.subject}</Link></td>
                    <td className="px-4 py-3"><StatusBadge status={t.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(t.updatedAt)}</td>
                  </tr>
                ))}
                {tickets.length === 0 && <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">Нет тикетов</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold mb-3">Категории</h3>
            <div className="space-y-2 mb-3">
              {categories.map(c => (
                <div key={c.id} className="flex justify-between items-center text-sm">
                  <span>{c.name}</span>
                  <button onClick={() => deleteCat(c.id)} className="text-red-500 hover:text-red-700 text-xs">x</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Новая категория" className="flex-1 px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              <button onClick={addCategory} className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
