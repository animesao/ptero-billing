import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';
import StatusBadge, { formatPrice, formatDate } from '../../components/StatusBadge.jsx';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.getOrders().then(setOrders).catch(() => {}); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Мои заказы</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Тариф</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Период</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Сумма</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Статус</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Истекает</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Создан</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3 font-medium">{o.id}</td>
                <td className="px-4 py-3">#{o.planId}</td>
                <td className="px-4 py-3"><StatusBadge status={o.billingPeriod} /></td>
                <td className="px-4 py-3">{formatPrice(o.amount)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(o.expiresAt)}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">Нет заказов</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
