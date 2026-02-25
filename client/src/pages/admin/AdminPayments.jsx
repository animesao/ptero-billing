import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';
import StatusBadge, { formatPrice, formatDate } from '../../components/StatusBadge.jsx';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  useEffect(() => { api.admin.getPayments().then(setPayments).catch(() => {}); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Платежи</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">User ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Order ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Провайдер</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Сумма</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Статус</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {payments.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.id}</td>
                <td className="px-4 py-3">{p.userId}</td>
                <td className="px-4 py-3">{p.orderId || '-'}</td>
                <td className="px-4 py-3">{p.provider}</td>
                <td className="px-4 py-3">{formatPrice(p.amount)}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-gray-500">{formatDate(p.createdAt)}</td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">Нет платежей</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
