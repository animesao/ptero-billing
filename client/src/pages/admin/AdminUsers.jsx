import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';
import StatusBadge, { formatPrice, formatDate } from '../../components/StatusBadge.jsx';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => { api.admin.getUsers().then(setUsers).catch(() => {}); }, []);

  const handleUpdate = async (id, data) => {
    try {
      await api.admin.updateUser(id, data);
      api.admin.getUsers().then(setUsers);
      setEditing(null);
    } catch {}
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Пользователи</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Имя</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Роль</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Статус</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Баланс</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Регистрация</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3 font-medium">{u.id}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.username}</td>
                <td className="px-4 py-3">
                  {editing === u.id ? (
                    <select defaultValue={u.role} onChange={e => handleUpdate(u.id, { role: e.target.value })} className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : <StatusBadge status={u.role} />}
                </td>
                <td className="px-4 py-3">
                  {editing === u.id ? (
                    <select defaultValue={u.status} onChange={e => handleUpdate(u.id, { status: e.target.value })} className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                      <option value="active">active</option>
                      <option value="blocked">blocked</option>
                    </select>
                  ) : <StatusBadge status={u.status} />}
                </td>
                <td className="px-4 py-3">{formatPrice(u.balance)}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setEditing(editing === u.id ? null : u.id)} className="text-primary-600 dark:text-primary-400 hover:underline text-xs">
                    {editing === u.id ? 'Закрыть' : 'Изменить'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
