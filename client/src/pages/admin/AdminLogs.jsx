import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';
import { formatDate } from '../../components/StatusBadge.jsx';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { api.admin.getLogs().then(setLogs).catch(() => {}); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Логи действий</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Актор</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Действие</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Сущность</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">ID сущности</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Детали</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map(l => (
              <tr key={l.id}>
                <td className="px-4 py-3 font-medium">{l.id}</td>
                <td className="px-4 py-3">{l.actorId || '-'}</td>
                <td className="px-4 py-3">{l.action}</td>
                <td className="px-4 py-3">{l.entity || '-'}</td>
                <td className="px-4 py-3">{l.entityId || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{l.details || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(l.createdAt)}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">Нет записей</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
