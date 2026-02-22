import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';
import { formatPrice } from '../../components/StatusBadge.jsx';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  useEffect(() => { api.admin.getStats().then(setStats).catch(() => {}); }, []);

  const cards = [
    { label: 'Пользователи', value: stats.users || 0, color: 'text-blue-600 dark:text-blue-400', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { label: 'Серверы', value: stats.servers || 0, color: 'text-green-600 dark:text-green-400', icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2' },
    { label: 'Заказы', value: stats.orders || 0, color: 'text-purple-600 dark:text-purple-400', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'Тикеты', value: stats.tickets || 0, color: 'text-orange-600 dark:text-orange-400', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
    { label: 'Доход', value: formatPrice(stats.revenue || 0), color: 'text-emerald-600 dark:text-emerald-400', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Админ-панель</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3 mb-2">
              <svg className={`w-6 h-6 ${c.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.icon} /></svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">{c.label}</p>
            </div>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
