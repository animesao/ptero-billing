import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';
import StatusBadge, { formatPrice, formatDate } from '../../components/StatusBadge.jsx';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.admin.getOrders().then(setOrders).catch(() => {}); }, []);

  const updateStatus = async (id, status) => {
    await api.admin.updateOrder(id, { status });
    api.admin.getOrders().then(setOrders);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Заказы</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">User ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Plan ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Период</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Сумма</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Истекает</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map(o => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-medium">{o.id}</td>
                <td className="px-4 py-3">{o.userId}</td>
                <td className="px-4 py-3">{o.planId}</td>
                <td className="px-4 py-3"><StatusBadge status={o.billingPeriod} /></td>
                <td className="px-4 py-3">{formatPrice(o.amount)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-gray-500">{formatDate(o.expiresAt)}</td>
                <td className="px-4 py-3">
                  <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                    <option value="pending">pending</option>
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">Нет заказов</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
