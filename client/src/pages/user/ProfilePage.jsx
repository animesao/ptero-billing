import React, { useState, useContext } from 'react';
import { AuthContext } from '../../App.jsx';
import { api } from '../../api.js';
import { formatDate } from '../../components/StatusBadge.jsx';

export default function ProfilePage() {
  const { user } = useContext(AuthContext);
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setError('');
    try {
      await api.updateProfile({ username, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined });
      setMsg('Профиль обновлён');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Профиль</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold mb-4">Информация</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Email</span><span>{user?.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Имя</span><span>{user?.username}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Роль</span><span className="capitalize">{user?.role}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Регистрация</span><span>{formatDate(user?.createdAt)}</span></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold mb-4">Редактировать</h2>
          {msg && <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg mb-4 text-sm">{msg}</div>}
          {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Имя пользователя</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Текущий пароль</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Новый пароль</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition" />
            </div>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition disabled:opacity-50">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
