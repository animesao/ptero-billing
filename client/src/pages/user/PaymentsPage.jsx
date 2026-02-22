import React, { useState, useEffect, useContext } from 'react';
import { api } from '../../api.js';
import { AuthContext } from '../../App.jsx';
import StatusBadge, { formatPrice, formatDate } from '../../components/StatusBadge.jsx';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => { api.getPayments().then(setPayments).catch(() => {}); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const result = await api.addBalance({ amount: parseInt(amount) * 100 });
      setMsg(`Баланс пополнен. Текущий баланс: ${formatPrice(result.balance)}`);
      setAmount('');
      api.getPayments().then(setPayments);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Платежи и баланс</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="font-semibold mb-2">Текущий баланс: <span className="text-green-600 dark:text-green-400">{formatPrice(user?.balance || 0)}</span></h2>
        <form onSubmit={handleAdd} className="flex gap-3 items-end mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Сумма пополнения (руб.)</label>
            <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition w-40" />
          </div>
          <button type="submit" disabled={loading || !amount} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50">
            {loading ? '...' : 'Пополнить'}
          </button>
        </form>
        {msg && <p className="mt-3 text-sm text-green-600 dark:text-green-400">{msg}</p>}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Провайдер</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Сумма</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Статус</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {payments.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.id}</td>
                <td className="px-4 py-3">{p.provider}</td>
                <td className="px-4 py-3">{formatPrice(p.amount)}</td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(p.createdAt)}</td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">Нет платежей</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
