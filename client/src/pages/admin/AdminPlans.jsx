import React, { useState, useEffect } from "react";
import { api } from "../../api.js";
import { formatPrice } from "../../components/StatusBadge.jsx";

const emptyPlan = {
  name: "",
  description: "",
  cpu: 100,
  ramMb: 1024,
  diskMb: 5120,
  slots: 0,
  dbLimit: 0,
  backupLimit: 0,
  priceMonthly: 10000,
  priceQuarterly: "",
  priceYearly: "",
  kernelId: "",
  nodeIds: "",
  isActive: true,
  sortOrder: 0,
};

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [games, setGames] = useState([]);
  const [kernels, setKernels] = useState([]);
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedGame, setSelectedGame] = useState("");

  const load = () =>
    api.admin
      .getPlans()
      .then(setPlans)
      .catch(() => {});
  const loadGames = () =>
    api.admin
      .getGames()
      .then(setGames)
      .catch(() => {});
  const loadKernels = () =>
    api.admin
      .getKernels()
      .then(setKernels)
      .catch(() => {});

  useEffect(() => {
    load();
    loadGames();
    loadKernels();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      api.admin
        .getKernelsByGame(selectedGame)
        .then(setKernels)
        .catch(() => {});
    } else {
      loadKernels();
    }
  }, [selectedGame]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const submitData = { ...form };

      // Получаем данные из выбранного ядра
      if (form.kernelId) {
        const kernel = kernels.find((k) => k.id === parseInt(form.kernelId));
        if (kernel) {
          submitData.nestId = kernel.pteroNestId;
          submitData.eggId = kernel.pteroEggId;
          submitData.dockerImage = kernel.dockerImage;
          submitData.startup = kernel.startup;
          submitData.environment = kernel.environment;
        }
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
      alert("Ошибка: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Удалить тариф?")) {
      await api.admin.deletePlan(id);
      load();
    }
  };

  const startEdit = (plan) => {
    setEditId(plan.id);
    setForm({
      ...plan,
      priceQuarterly: plan.priceQuarterly || "",
      priceYearly: plan.priceYearly || "",
      kernelId: plan.eggId || "",
      nodeIds: plan.nodeIds || "",
    });
  };

  const getKernelName = (eggId) => {
    const kernel = kernels.find(
      (k) => k.id === eggId || k.pteroEggId === eggId,
    );
    return kernel ? kernel.name : "—";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Тарифные планы</h1>
          <p className="text-[#666] mt-1">Управление тарифами и ценами</p>
        </div>
        <button
          onClick={() => {
            setForm({ ...emptyPlan });
            setEditId(null);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Добавить тариф
        </button>
      </div>

      {form && (
        <div className="glass-card p-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-white mb-6">
            {editId ? "Редактировать тариф" : "Новый тариф"}
          </h2>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Основное */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                  Название
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="input-primary"
                  placeholder="GAMING-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                  Описание
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="input-primary"
                  placeholder="Мощный игровой сервер"
                />
              </div>
            </div>

            {/* Игра и Ядро */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                  Игра
                </label>
                <select
                  value={selectedGame}
                  onChange={(e) => {
                    setSelectedGame(e.target.value);
                    setForm({ ...form, kernelId: "" });
                  }}
                  className="input-primary"
                >
                  <option value="">Все игры</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.icon || "🎮"} {game.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                  Ядро (конфигурация)
                </label>
                <select
                  value={form.kernelId || ""}
                  onChange={(e) =>
                    setForm({ ...form, kernelId: e.target.value })
                  }
                  className="input-primary"
                >
                  <option value="">Не выбрано</option>
                  {kernels.map((kernel) => (
                    <option key={kernel.id} value={kernel.id}>
                      {kernel.name}{" "}
                      {kernel.pteroEggId ? `(Egg #${kernel.pteroEggId})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#666] mt-1">
                  Ядро определяет тип сервера и переменные окружения
                </p>
              </div>
            </div>

            {/* Ресурсы */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#dc143c]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
                Ресурсы сервера
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                    CPU (%)
                  </label>
                  <input
                    type="number"
                    value={form.cpu}
                    onChange={(e) =>
                      setForm({ ...form, cpu: parseInt(e.target.value) })
                    }
                    className="input-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                    RAM (MB)
                  </label>
                  <input
                    type="number"
                    value={form.ramMb}
                    onChange={(e) =>
                      setForm({ ...form, ramMb: parseInt(e.target.value) })
                    }
                    className="input-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                    Диск (MB)
                  </label>
                  <input
                    type="number"
                    value={form.diskMb}
                    onChange={(e) =>
                      setForm({ ...form, diskMb: parseInt(e.target.value) })
                    }
                    className="input-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                    Слоты
                  </label>
                  <input
                    type="number"
                    value={form.slots}
                    onChange={(e) =>
                      setForm({ ...form, slots: parseInt(e.target.value) })
                    }
                    className="input-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                    БД лимит
                  </label>
                  <input
                    type="number"
                    value={form.dbLimit}
                    onChange={(e) =>
                      setForm({ ...form, dbLimit: parseInt(e.target.value) })
                    }
                    className="input-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                    Бэкапы
                  </label>
                  <input
                    type="number"
                    value={form.backupLimit}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        backupLimit: parseInt(e.target.value),
                      })
                    }
                    className="input-primary"
                  />
                </div>
              </div>
            </div>

            {/* Ноды */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#dc143c]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
                  />
                </svg>
                Ноды (серверы Pterodactyl)
              </h3>
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                  ID нод (JSON массив, через запятую)
                </label>
                <input
                  type="text"
                  value={form.nodeIds}
                  onChange={(e) =>
                    setForm({ ...form, nodeIds: e.target.value })
                  }
                  className="input-primary font-mono"
                  placeholder="[1, 2, 3] или оставьте пустым для автовыбора"
                />
                <p className="text-xs text-[#666] mt-1">
                  Если указано несколько нод, сервер будет создан на случайной
                  ноде из списка. Если пусто — будет выбрана наименее
                  загруженная нода.
                </p>
              </div>
            </div>

            {/* Цены */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#dc143c]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Цены (в копейках)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                    Цена/мес
                  </label>
                  <input
                    type="number"
                    value={form.priceMonthly}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priceMonthly: parseInt(e.target.value),
                      })
                    }
                    required
                    className="input-primary"
                  />
                  <p className="text-xs text-[#666] mt-1">
                    {formatPrice(form.priceMonthly)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                    Цена/кв
                  </label>
                  <input
                    type="number"
                    value={form.priceQuarterly}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priceQuarterly: parseInt(e.target.value) || "",
                      })
                    }
                    className="input-primary"
                  />
                  {form.priceQuarterly && (
                    <p className="text-xs text-[#666] mt-1">
                      {formatPrice(form.priceQuarterly)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                    Цена/год
                  </label>
                  <input
                    type="number"
                    value={form.priceYearly}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priceYearly: parseInt(e.target.value) || "",
                      })
                    }
                    className="input-primary"
                  />
                  {form.priceYearly && (
                    <p className="text-xs text-[#666] mt-1">
                      {formatPrice(form.priceYearly)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Статус и порядок */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-[#dc143c]/30 bg-[#1a1a1a] text-[#dc143c] focus:ring-[#dc143c]/50"
                />
                <span className="text-sm text-[#a0a0a0]">Активен</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-[#a0a0a0]">
                  Порядок отображения:
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: parseInt(e.target.value) })
                  }
                  className="w-20 input-primary"
                />
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(null);
                  setEditId(null);
                }}
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
              <th className="px-6 py-4 text-left font-medium text-[#666]">
                ID
              </th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">
                Название
              </th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">
                Ресурсы
              </th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">
                Ядро
              </th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">
                Цена/мес
              </th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">
                Активен
              </th>
              <th className="px-6 py-4 text-left font-medium text-[#666]">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {plans.map((p) => (
              <tr key={p.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4 font-medium text-white">{p.id}</td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white font-medium">{p.name}</p>
                    {p.description && (
                      <p className="text-xs text-[#666]">{p.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-[#a0a0a0]">
                  <div>CPU {p.cpu}%</div>
                  <div>RAM {p.ramMb}MB</div>
                  <div>Диск {p.diskMb}MB</div>
                </td>
                <td className="px-6 py-4 text-white">
                  {getKernelName(p.eggId)}
                </td>
                <td className="px-6 py-4 text-white font-medium">
                  {formatPrice(p.priceMonthly)}
                </td>
                <td className="px-6 py-4">
                  {p.isActive !== false ? (
                    <span className="badge badge-success">Да</span>
                  ) : (
                    <span className="badge badge-danger">Нет</span>
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
                <td colSpan="7" className="px-6 py-12 text-center text-[#666]">
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
