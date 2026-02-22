import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';
import { formatPrice } from '../../components/StatusBadge.jsx';

const emptyPlan = { name: '', description: '', cpu: 100, ramMb: 1024, diskMb: 5120, slots: 0, dbLimit: 0, backupLimit: 0, priceMonthly: 10000, priceQuarterly: '', priceYearly: '', nestId: '', eggId: '', nodeId: '', locationId: '', sortOrder: 0 };

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => api.admin.getPlans().then(setPlans).catch(() => {});
  useEffect(load, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.admin.updatePlan(editId, form);
      } else {
        await api.admin.createPlan(form);
      }
      setForm(null);
      setEditId(null);
      load();
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (confirm('Удалить тариф?')) {
      await api.admin.deletePlan(id);
      load();
    }
  };

  const startEdit = (plan) => {
    setEditId(plan.id);
    setForm({ ...plan, priceQuarterly: plan.priceQuarterly || '', priceYearly: plan.priceYearly || '', nestId: plan.nestId || '', eggId: plan.eggId || '', nodeId: plan.nodeId || '', locationId: plan.locationId || '' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Тарифные планы</h1>
        <button onClick={() => { setForm({ ...emptyPlan }); setEditId(null); }} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition">Добавить тариф</button>
      </div>

      {form && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="font-semibold mb-4">{editId ? 'Редактировать тариф' : 'Новый тариф'}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Описание</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[['CPU (%)', 'cpu'], ['RAM (MB)', 'ramMb'], ['Диск (MB)', 'diskMb'], ['Слоты', 'slots'], ['БД лимит', 'dbLimit'], ['Бэкапы', 'backupLimit']].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input type="number" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Цена/мес (коп)</label>
                <input type="number" value={form.priceMonthly} onChange={e => setForm({ ...form, priceMonthly: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Цена/кв (коп)</label>
                <input type="number" value={form.priceQuarterly} onChange={e => setForm({ ...form, priceQuarterly: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Цена/год (коп)</label>
                <input type="number" value={form.priceYearly} onChange={e => setForm({ ...form, priceYearly: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[['Nest ID', 'nestId'], ['Egg ID', 'eggId'], ['Node ID', 'nodeId'], ['Location ID', 'locationId'], ['Порядок', 'sortOrder']].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input type="number" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50">{saving ? 'Сохранение...' : 'Сохранить'}</button>
              <button type="button" onClick={() => { setForm(null); setEditId(null); }} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition">Отмена</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Название</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Ресурсы</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Цена/мес</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Активен</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {plans.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.id}</td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{p.cpu}% / {p.ramMb}MB / {p.diskMb}MB</td>
                <td className="px-4 py-3">{formatPrice(p.priceMonthly)}</td>
                <td className="px-4 py-3">{p.isActive ? <span className="text-green-500">Да</span> : <span className="text-red-500">Нет</span>}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => startEdit(p)} className="text-primary-600 dark:text-primary-400 hover:underline text-xs">Изменить</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 dark:text-red-400 hover:underline text-xs">Удалить</button>
                </td>
              </tr>
            ))}
            {plans.length === 0 && <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">Нет тарифов</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
