import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../api.js";
import { ToastContext } from "../../components/Toast.jsx";

export default function ServerSettings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useContext(ToastContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingEgg, setChangingEgg] = useState(false);
  const [server, setServer] = useState(null);
  const [order, setOrder] = useState(null);
  const [plan, setPlan] = useState(null);
  const [eggs, setEggs] = useState([]);
  const [currentEggId, setCurrentEggId] = useState(null);
  const [selectedEggId, setSelectedEggId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    cpu: '',
    ramMb: '',
    diskMb: '',
  });

  const loadSettings = () => {
    setLoading(true);
    api.getUserServerSettings(id)
      .then(data => {
        setServer(data.server);
        setOrder(data.order);
        setPlan(data.plan);
        setFormData({
          name: data.server?.name || '',
          cpu: data.server?.cpu || '',
          ramMb: data.server?.ramMb || '',
          diskMb: data.server?.diskMb || '',
        });
      })
      .catch(err => {
        console.error(err);
        alert('Ошибка загрузки настроек');
      })
      .finally(() => setLoading(false));
  };

  const loadEggs = () => {
    api.getServerEggs(id)
      .then(data => {
        setEggs(data.eggs || []);
        setCurrentEggId(data.currentEggId);
        setSelectedEggId(data.currentEggId?.toString() || '');
      })
      .catch(err => {
        console.error('Ошибка загрузки яиц:', err);
      });
  };

  useEffect(() => {
    loadSettings();
    loadEggs();
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateUserServerSettings(id, formData);
      toast.success('Настройки сохранены');
      loadSettings();
    } catch (err) {
      toast.error('Ошибка: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEgg = async () => {
    if (!selectedEggId || selectedEggId === currentEggId?.toString()) {
      toast.warning('Выберите другое ядро');
      return;
    }

    if (!confirm(`Сменить ядро и переустановить сервер?\n\nВНИМАНИЕ: Все данные сервера будут удалены!`)) {
      return;
    }

    setChangingEgg(true);
    try {
      await api.changeServerEgg(id, { eggId: parseInt(selectedEggId) });
      toast.success('Сервер переустанавливается с новым ядром. Это может занять несколько минут.');
      loadSettings();
      loadEggs();
    } catch (err) {
      toast.error('Ошибка: ' + (err.response?.data?.error || err.message));
    } finally {
      setChangingEgg(false);
    }
  };

  const handleRenew = async () => {
    if (!confirm('Продлить сервер на текущий период?')) return;
    try {
      await api.renewUserServer(id);
      toast.success('Сервер продлён');
      loadSettings();
    } catch (err) {
      toast.error('Ошибка: ' + (err.response?.data?.error || err.message));
    }
  };

  const formatExpiresAt = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Сервер не найден</h2>
        <Link to="/servers" className="btn-primary">Назад к серверам</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link to="/servers" className="text-primary-600 hover:underline text-sm flex items-center gap-1">
          ← Назад к серверам
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основные настройки */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Основные настройки</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Название сервера
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CPU (%)
                  </label>
                  <input
                    type="number"
                    value={formData.cpu}
                    onChange={e => setFormData({ ...formData, cpu: e.target.value })}
                    max={plan?.cpu || 100}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Макс: {plan?.cpu}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    RAM (MB)
                  </label>
                  <input
                    type="number"
                    value={formData.ramMb}
                    onChange={e => setFormData({ ...formData, ramMb: e.target.value })}
                    max={plan?.ramMb || 1024}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Макс: {plan?.ramMb} MB</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Диск (MB)
                  </label>
                  <input
                    type="number"
                    value={formData.diskMb}
                    onChange={e => setFormData({ ...formData, diskMb: e.target.value })}
                    max={plan?.diskMb || 5120}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Макс: {plan?.diskMb} MB</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-700 transition disabled:opacity-50"
                >
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>

          {/* Смена ядра */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Смена ядра (Egg)</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Выберите другое ядро для переустановки сервера. Все данные будут удалены.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Доступные ядра
                </label>
                <select
                  value={selectedEggId}
                  onChange={e => setSelectedEggId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  {eggs.map(egg => (
                    <option key={egg.id} value={egg.id}>
                      {egg.name} {egg.id === currentEggId ? '(текущее)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {eggs.find(e => e.id === parseInt(selectedEggId)) && (
                <div className="p-4 rounded-lg bg-gray-50/80 dark:bg-gray-700/50 text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Docker Image:</strong> {eggs.find(e => e.id === parseInt(selectedEggId))?.dockerImage}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    <strong>Startup:</strong> {eggs.find(e => e.id === parseInt(selectedEggId))?.startup}
                  </p>
                </div>
              )}
              <button
                onClick={handleChangeEgg}
                disabled={changingEgg || !selectedEggId || selectedEggId === currentEggId?.toString()}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-700 transition disabled:opacity-50"
              >
                {changingEgg ? 'Переустановка...' : 'Сменить ядро и переустановить'}
              </button>
            </div>
          </div>
        </div>

        {/* Информация о заказе */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Информация о заказе</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Статус</span>
                <span className={`font-semibold ${order?.status === 'active' ? 'text-green-500' : 'text-gray-800 dark:text-gray-100'}`}>
                  {order?.status || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Истекает</span>
                <span className={`font-semibold ${isExpired(order?.expiresAt) ? 'text-red-500' : 'text-gray-800 dark:text-gray-100'}`}>
                  {formatExpiresAt(order?.expiresAt)}
                </span>
              </div>
            </div>

            {order && (
              <button
                onClick={handleRenew}
                className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition"
              >
                Продлить сервер
              </button>
            )}
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Действия</h2>
            <div className="space-y-2">
              {server.pteroIdentifier && (
                <a
                  href={`https://panel.amethystcloud.online/server/${server.pteroIdentifier}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-center font-medium rounded-lg hover:from-blue-600 hover:to-cyan-700 transition"
                >
                  Открыть панель управления
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
