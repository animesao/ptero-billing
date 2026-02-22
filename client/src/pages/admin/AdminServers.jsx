import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';
import StatusBadge, { formatDate } from '../../components/StatusBadge.jsx';

export default function AdminServers() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.admin.getServers().then(setServers).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Удалить сервер "${name}"?\n\nСервер будет удалён из Pterodactyl и базы данных.`)) {
      return;
    }

    setLoading(true);
    try {
      await api.admin.deleteServer(id);
      alert('Сервер удалён');
      load();
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Серверы</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Имя</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">User ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Ptero ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Ресурсы</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Создан</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {servers.map(s => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium">{s.id}</td>
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3">{s.userId}</td>
                <td className="px-4 py-3 font-mono text-xs">{s.pteroServerId || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{s.cpu}% / {s.ramMb}MB / {s.diskMb}MB</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3 text-gray-500">{formatDate(s.createdAt)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    disabled={loading}
                    className="text-red-600 dark:text-red-400 hover:underline text-xs disabled:opacity-50"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {servers.length === 0 && (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">Нет серверов</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
