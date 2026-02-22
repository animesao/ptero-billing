import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import StatusBadge, { formatDate } from '../../components/StatusBadge.jsx';

export default function ServersPage() {
  const [servers, setServers] = useState([]);
  useEffect(() => { api.getServers().then(setServers).catch(() => {}); }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Мои серверы</h1>
        <Link to="/plans" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition">Создать сервер</Link>
      </div>
      {servers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" /></svg>
          <h3 className="text-lg font-medium mb-2">Нет серверов</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Выберите тариф и создайте свой первый сервер</p>
          <Link to="/plans" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">Выбрать тариф</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers.map(s => (
            <div key={s.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold">{s.name}</h3>
                <StatusBadge status={s.status} />
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between"><span>CPU</span><span className="font-medium">{s.cpu}%</span></div>
                <div className="flex justify-between"><span>RAM</span><span className="font-medium">{s.ramMb} MB</span></div>
                <div className="flex justify-between"><span>Диск</span><span className="font-medium">{s.diskMb} MB</span></div>
                {s.pteroIdentifier && <div className="flex justify-between"><span>ID</span><span className="font-mono text-xs">{s.pteroIdentifier}</span></div>}
                <div className="flex justify-between"><span>Создан</span><span>{formatDate(s.createdAt)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
