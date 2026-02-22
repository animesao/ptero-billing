import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { AuthContext } from '../../App.jsx';
import StatusBadge, { formatPrice, formatDate } from '../../components/StatusBadge.jsx';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [servers, setServers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    api.getServers().then(setServers).catch(() => {});
    api.getOrders().then(setOrders).catch(() => {});
    api.getTickets().then(setTickets).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Добро пожаловать, {user?.username}!</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Баланс</p>
          <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">{formatPrice(user?.balance || 0)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Серверы</p>
          <p className="text-2xl font-bold mt-1">{servers.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Заказы</p>
          <p className="text-2xl font-bold mt-1">{orders.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Тикеты</p>
          <p className="text-2xl font-bold mt-1">{tickets.filter(t => t.status !== 'closed').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-semibold">Мои серверы</h2>
            <Link to="/plans" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Создать</Link>
          </div>
          <div className="p-4">
            {servers.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Нет серверов. <Link to="/plans" className="text-primary-600 dark:text-primary-400 hover:underline">Создать первый</Link></p>
            ) : (
              <div className="space-y-3">
                {servers.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{s.cpu}% CPU / {s.ramMb}MB RAM / {s.diskMb}MB Disk</p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-semibold">Последние тикеты</h2>
            <Link to="/tickets" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Все</Link>
          </div>
          <div className="p-4">
            {tickets.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Нет тикетов</p>
            ) : (
              <div className="space-y-3">
                {tickets.slice(0, 5).map(t => (
                  <Link key={t.id} to={`/tickets/${t.id}`} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <div>
                      <p className="font-medium text-sm">#{t.id} {t.subject}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(t.createdAt)}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
