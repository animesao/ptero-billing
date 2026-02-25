import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';
import { formatPrice } from '../../components/StatusBadge.jsx';

const emptyPlan = {
  name: '',
  description: '',
  cpu: 100,
  ramMb: 1024,
  diskMb: 5120,
  slots: 0,
  dbLimit: 0,
  backupLimit: 0,
  priceMonthly: 10000,
  priceQuarterly: '',
  priceYearly: '',
  nestId: '',
  eggId: '',
  nodeIds: [],
  allocationId: '',
  dockerImage: '',
  startup: '',
  isActive: true,
  sortOrder: 0,
};

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [nests, setNests] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const load = () => api.admin.getPlans().then(setPlans).catch(() => {});

  const loadPteroData = async () => {
    setLoadingData(true);
    try {
      const [nestsData, nodesData] = await Promise.all([
        api.admin.getNests(),
        api.admin.getNodes(),
      ]);
      setNests(nestsData);
      setNodes(nodesData);
    } catch (err) {
      console.error('Failed to load Pterodactyl data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    load();
    loadPteroData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const submitData = { ...form };
      if (!submitData.nestId) delete submitData.nestId;
      if (!submitData.eggId) delete submitData.eggId;
      if (!submitData.allocationId) delete submitData.allocationId;

      // Преобразуем nodeIds в JSON строку
      if (submitData.nodeIds && Array.isArray(submitData.nodeIds)) {
        submitData.nodeIds = JSON.stringify(submitData.nodeIds);
      }

      if (editId) {
        await api.admin.updatePlan(editId, submitData);
      } else {
        await api.admin.createPlan(submitData);
      }
      setForm(null);
      setEditId(null);
      load();
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Удалить тариф?')) {
      await api.admin.deletePlan(id);
      load();
    }
  };

  const startEdit = (plan) => {
    setEditId(plan.id);
    let nodeIdsArray = [];
    try {
      nodeIdsArray = plan.nodeIds ? JSON.parse(plan.nodeIds) : [];
    } catch (e) {
      nodeIdsArray = plan.nodeId ? [plan.nodeId] : [];
    }

    setForm({
      ...plan,
      priceQuarterly: plan.priceQuarterly || '',
      priceYearly: plan.priceYearly || '',
      nestId: plan.nestId || '',
      eggId: plan.eggId || '',
      nodeIds: nodeIdsArray,
      allocationId: plan.allocationId || '',
      dockerImage: plan.dockerImage || '',
      startup: plan.startup || '',
    });
  };

  const selectedNest = nests.find(n => n.id === parseInt(form?.nestId));
  const selectedEgg = selectedNest?.eggs.find(e => e.id === parseInt(form?.eggId));

  const toggleNodeId = (nodeId) => {
    if (!form) return;
    const current = form.nodeIds || [];
    if (current.includes(nodeId)) {
      setForm({ ...form, nodeIds: current.filter(id => id !== nodeId) });
    } else {
      setForm({ ...form, nodeIds: [...current, nodeId] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold gradient-text">Тарифные планы</h1>
        <button
          onClick={() => { setForm({ ...emptyPlan }); setEditId(null); loadPteroData(); }}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить тариф
        </button>
      </div>

      {form && (
        <div className="glass-card p-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-white mb-6">
            {editId ? 'Редактировать тариф' : 'Новый тариф'}
          </h2>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Основное */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Название</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="input-primary"
                  placeholder="GAMING-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Описание</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input-primary"
                  placeholder="Мощный игровой сервер"
                />
              </div>
            </div>

            {/* Ресурсы */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">CPU (%)</label>
                <input
                  type="number"
                  value={form.cpu}
                  onChange={e => setForm({ ...form, cpu: parseInt(e.target.value) })}
                  className="input-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">RAM (MB)</label>
                <input
                  type="number"
                  value={form.ramMb}
                  onChange={e => setForm({ ...form, ramMb: parseInt(e.target.value) })}
                  className="input-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Диск (MB)</label>
                <input
                  type="number"
                  value={form.diskMb}
                  onChange={e => setForm({ ...form, diskMb: parseInt(e.target.value) })}
                  className="input-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Слоты</label>
                <input
                  type="number"
                  value={form.slots}
                  onChange={e => setForm({ ...form, slots: parseInt(e.target.value) })}
                  className="input-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">БД лимит</label>
                <input
                  type="number"
                  value={form.dbLimit}
                  onChange={e => setForm({ ...form, dbLimit: parseInt(e.target.value) })}
                  className="input-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Бэкапы</label>
                <input
                  type="number"
                  value={form.backupLimit}
                  onChange={e => setForm({ ...form, backupLimit: parseInt(e.target.value) })}
                  className="input-primary"
                />
              </div>
            </div>

            {/* Цены */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Цена/мес (коп)</label>
                <input
                  type="number"
                  value={form.priceMonthly}
                  onChange={e => setForm({ ...form, priceMonthly: parseInt(e.target.value) })}
                  required
                  className="input-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Цена/кв (коп)</label>
                <input
                  type="number"
                  value={form.priceQuarterly}
                  onChange={e => setForm({ ...form, priceQuarterly: parseInt(e.target.value) || '' })}
                  className="input-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Цена/год (коп)</label>
                <input
                  type="number"
                  value={form.priceYearly}
                  onChange={e => setForm({ ...form, priceYearly: parseInt(e.target.value) || '' })}
                  className="input-primary"
                />
              </div>
            </div>

            {/* Pterodactyl настройки */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">Настройки Pterodactyl</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Гнездо (Nest)</label>
                  <select
                    value={form.nestId || ''}
                    onChange={e => {
                      const nestId = e.target.value;
                      setForm({ ...form, nestId, eggId: '' });
                    }}
                    className="input-primary"
                  >
                    <option value="">Выберите гнездо</option>
                    {nests.map(n => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Яйцо (Egg)</label>
                  <select
                    value={form.eggId || ''}
                    onChange={e => {
                      const egg = selectedNest?.eggs.find(x => x.id === parseInt(e.target.value));
                      setForm({
                        ...form,
                        eggId: e.target.value,
                        dockerImage: egg?.dockerImage || '',
                        startup: egg?.startup || '',
                      });
                    }}
                    disabled={!form.nestId}
                    className="input-primary disabled:opacity-50"
                  >
                    <option value="">Выберите яйцо</option>
                    {selectedNest?.eggs.map(egg => (
                      <option key={egg.id} value={egg.id}>{egg.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Выбор нод */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                  Ноды (можно выбрать несколько для случайного распределения)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {nodes.map(node => {
                    const nodeName = node.attributes?.name || node.name;
                    const isSelected = (form.nodeIds || []).includes(node.id);
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => toggleNodeId(node.id)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-[#dc143c]/10 border-[#dc143c]/50 text-white'
                            : 'bg-white/5 border-white/10 text-[#666] hover:border-[#dc143c]/30'
                        }`}
                      >
                        {nodeName}
                        {isSelected && (
                          <svg className="w-4 h-4 text-[#dc143c] ml-2 inline" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedEgg && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                  <p className="text-sm text-[#a0a0a0] mb-2">
                    <strong className="text-white">Docker Image:</strong>{" "}
                    <span className="font-mono text-xs">{selectedEgg.dockerImage}</span>
                  </p>
                  <p className="text-sm text-[#a0a0a0]">
                    <strong className="text-white">Startup:</strong>{" "}
                    <span className="font-mono text-xs">{selectedEgg.startup}</span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Docker Image</label>
                  <input
                    type="text"
                    value={form.dockerImage || ''}
                    onChange={e => setForm({ ...form, dockerImage: e.target.value })}
                    className="input-primary font-mono text-xs"
                    placeholder="ghcr.io/pterodactyl/yolks:java_17"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">Startup команда</label>
                  <input
                    type="text"
                    value={form.startup || ''}
                    onChange={e => setForm({ ...form, startup: e.target.value })}
                    className="input-primary font-mono text-xs"
                    placeholder="java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar"
                  />
                </div>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={() => { setForm(null); setEditId(null); }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Список тарифов */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left font-medium text-[#666]">ID</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Название</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Ресурсы</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Цена/мес</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Активен</th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {plans.map(p => (
              <tr key={p.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4 font-medium text-white">{p.id}</td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white font-medium">{p.name}</p>
                    {p.description && <p className="text-xs text-[#666]">{p.description}</p>}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-[#a0a0a0]">
                  CPU {p.cpu}% / RAM {p.ramMb}MB / Диск {p.diskMb}MB
                </td>
                <td className="px-6 py-4 text-white font-medium">{formatPrice(p.priceMonthly)}</td>
                <td className="px-6 py-4">
                  {p.isActive !== false ? (
                    <span className="text-green-400">✓ Да</span>
                  ) : (
                    <span className="text-red-400">✕ Нет</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-[#dc143c] hover:text-[#ff1493] text-xs font-medium transition"
                    >
                      Изменить
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-500 hover:text-red-400 text-xs font-medium transition"
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-[#666]">
                  Нет тарифов
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
