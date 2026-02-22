import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import { AuthContext } from '../../App.jsx';
import { formatPrice } from '../../components/StatusBadge.jsx';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [serverName, setServerName] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => { api.getPlans().then(setPlans).catch(() => {}); }, []);

  const handleOrder = async () => {
    if (!selectedPlan) return;
    setOrdering(true);
    setError('');
    try {
      await api.createOrder({ planId: selectedPlan.id, billingPeriod, serverName: serverName || undefined });
      navigate('/servers');
    } catch (err) {
      setError(err.message);
    } finally {
      setOrdering(false);
    }
  };

  const getPrice = (plan) => {
    if (billingPeriod === 'yearly' && plan.priceYearly) return plan.priceYearly;
    if (billingPeriod === 'quarterly' && plan.priceQuarterly) return plan.priceQuarterly;
    return plan.priceMonthly;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Тарифные планы</h1>
      <div className="flex gap-2 mb-6">
        {['monthly', 'quarterly', 'yearly'].map(p => (
          <button key={p} onClick={() => setBillingPeriod(p)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${billingPeriod === p ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            {p === 'monthly' ? 'Месяц' : p === 'quarterly' ? 'Квартал' : 'Год'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {plans.map(plan => (
          <div key={plan.id} onClick={() => setSelectedPlan(plan)} className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-6 cursor-pointer transition ${selectedPlan?.id === plan.id ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
            <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
            {plan.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{plan.description}</p>}
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-4">{formatPrice(getPrice(plan))} <span className="text-sm font-normal text-gray-500">/{billingPeriod === 'monthly' ? 'мес' : billingPeriod === 'quarterly' ? 'кв' : 'год'}</span></p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>CPU</span><span className="font-medium">{plan.cpu}%</span></div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>RAM</span><span className="font-medium">{plan.ramMb} MB</span></div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Диск</span><span className="font-medium">{plan.diskMb} MB</span></div>
              {plan.slots > 0 && <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Слоты</span><span className="font-medium">{plan.slots}</span></div>}
              {plan.dbLimit > 0 && <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Базы данных</span><span className="font-medium">{plan.dbLimit}</span></div>}
              {plan.backupLimit > 0 && <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Бэкапы</span><span className="font-medium">{plan.backupLimit}</span></div>}
            </div>
          </div>
        ))}
        {plans.length === 0 && <div className="col-span-3 text-center py-12 text-gray-500 dark:text-gray-400">Тарифы пока не настроены администратором</div>}
      </div>

      {selectedPlan && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4">Оформление заказа: {selectedPlan.name}</h2>
          {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5">Название сервера (необязательно)</label>
            <input type="text" value={serverName} onChange={e => setServerName(e.target.value)} placeholder="Мой сервер" className="w-full max-w-md px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition" />
          </div>
          <div className="flex items-center gap-4">
            <p className="text-lg">К оплате: <span className="font-bold text-primary-600 dark:text-primary-400">{formatPrice(getPrice(selectedPlan))}</span></p>
            <p className="text-sm text-gray-500">Баланс: {formatPrice(user?.balance || 0)}</p>
            <button onClick={handleOrder} disabled={ordering} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition disabled:opacity-50">
              {ordering ? 'Оформление...' : 'Заказать'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
