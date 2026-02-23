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
  const [selectedEggId, setSelectedEggId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    cpu: "",
    ramMb: "",
    diskMb: "",
  });

  const loadSettings = () => {
    setLoading(true);
    api
      .getUserServerSettings(id)
      .then((data) => {
        setServer(data.server);
        setOrder(data.order);
        setPlan(data.plan);
        setFormData({
          name: data.server?.name || "",
          cpu: data.server?.cpu || "",
          ramMb: data.server?.ramMb || "",
          diskMb: data.server?.diskMb || "",
        });
      })
      .catch((err) => {
        console.error(err);
        toast.error("Ошибка загрузки настроек");
      })
      .finally(() => setLoading(false));
  };

  const loadEggs = () => {
    api
      .getServerEggs(id)
      .then((data) => {
        setEggs(data.eggs || []);
        setCurrentEggId(data.currentEggId);
        setSelectedEggId(data.currentEggId?.toString() || "");
      })
      .catch((err) => {
        console.error("Ошибка загрузки яиц:", err);
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
      toast.success("Настройки сохранены");
      loadSettings();
    } catch (err) {
      toast.error("Ошибка: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEgg = async () => {
    if (!selectedEggId || selectedEggId === currentEggId?.toString()) {
      toast.warning("Выберите другое ядро");
      return;
    }

    const selectedEgg = eggs.find((e) => e.id === parseInt(selectedEggId));
    if (
      !confirm(
        `Сменить ядро на "${selectedEgg?.name}"?\n\n⚠️ ВНИМАНИЕ: Все данные сервера будут удалены!`,
      )
    ) {
      return;
    }

    setChangingEgg(true);
    try {
      await api.changeServerEgg(id, { eggId: parseInt(selectedEggId) });
      toast.success(
        "Сервер переустанавливается с новым ядром. Это может занять несколько минут.",
      );
      loadSettings();
      loadEggs();
    } catch (err) {
      toast.error("Ошибка: " + (err.response?.data?.error || err.message));
    } finally {
      setChangingEgg(false);
    }
  };

  const handleRenew = async () => {
    if (!confirm("Продлить сервер на текущий период?")) return;
    try {
      await api.renewUserServer(id);
      toast.success("Сервер продлён");
      loadSettings();
    } catch (err) {
      toast.error("Ошибка: " + (err.response?.data?.error || err.message));
    }
  };

  const formatExpiresAt = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#dc143c]/20 border-t-[#dc143c] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#dc143c]/20 to-[#ff1493]/20 border border-[#dc143c]/30 flex items-center justify-center animate-float">
          <svg
            className="w-10 h-10 text-[#dc143c]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Сервер не найден</h2>
        <p className="text-[#666] mb-6">
          Запрашиваемый сервер не существует или удалён
        </p>
        <Link to="/servers" className="btn-primary inline-block">
          ← Назад к серверам
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <Link
          to="/servers"
          className="text-[#dc143c] hover:text-[#ff1493] transition-colors flex items-center gap-1"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{server.name}</h1>
          <p className="text-[#666] text-sm">Настройки сервера</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основная колонка */}
        <div className="lg:col-span-2 space-y-6">
          {/* Основные настройки */}
          <div className="glass-card p-6 animate-slide-up">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Основные настройки
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                  Название сервера
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-primary w-full"
                  placeholder="Мой сервер"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                    CPU (%)
                  </label>
                  <input
                    type="number"
                    value={formData.cpu}
                    onChange={(e) =>
                      setFormData({ ...formData, cpu: e.target.value })
                    }
                    max={plan?.cpu || 100}
                    className="input-primary w-full"
                  />
                  <p className="text-xs text-[#666] mt-1">Макс: {plan?.cpu}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                    RAM (MB)
                  </label>
                  <input
                    type="number"
                    value={formData.ramMb}
                    onChange={(e) =>
                      setFormData({ ...formData, ramMb: e.target.value })
                    }
                    max={plan?.ramMb || 1024}
                    className="input-primary w-full"
                  />
                  <p className="text-xs text-[#666] mt-1">
                    Макс: {plan?.ramMb} MB
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                    Диск (MB)
                  </label>
                  <input
                    type="number"
                    value={formData.diskMb}
                    onChange={(e) =>
                      setFormData({ ...formData, diskMb: e.target.value })
                    }
                    max={plan?.diskMb || 5120}
                    className="input-primary w-full"
                  />
                  <p className="text-xs text-[#666] mt-1">
                    Макс: {plan?.diskMb} MB
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full md:w-auto px-8 py-3 disabled:opacity-50"
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </form>
          </div>

          {/* Смена ядра */}
          <div className="glass-card p-6 animate-slide-up">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Смена ядра (Egg)
            </h2>
            <p className="text-sm text-[#666] mb-6">
              Выберите другое ядро для переустановки сервера. Все данные будут
              удалены.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                  Доступные ядра
                </label>
                <select
                  value={selectedEggId}
                  onChange={(e) => setSelectedEggId(e.target.value)}
                  className="input-primary w-full"
                >
                  {eggs.length === 0 ? (
                    <option value="">Загрузка...</option>
                  ) : (
                    eggs.map((egg) => (
                      <option key={egg.id} value={egg.id}>
                        {egg.name} {egg.id === currentEggId ? "(текущее)" : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {selectedEggId &&
                eggs.find((e) => e.id === parseInt(selectedEggId)) && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-[#a0a0a0]">
                      <span className="text-[#666]">Docker Image:</span>{" "}
                      <span className="font-mono text-xs">
                        {
                          eggs.find((e) => e.id === parseInt(selectedEggId))
                            ?.dockerImage
                        }
                      </span>
                    </p>
                  </div>
                )}
              <button
                onClick={handleChangeEgg}
                disabled={
                  changingEgg ||
                  !selectedEggId ||
                  selectedEggId === currentEggId?.toString()
                }
                className="btn-danger w-full py-3 disabled:opacity-50"
              >
                {changingEgg ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Переустановка...
                  </span>
                ) : (
                  "Сменить ядро и переустановить"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Боковая колонка */}
        <div className="space-y-6">
          {/* Информация о заказе */}
          <div className="glass-card p-6 animate-slide-up">
            <h2 className="text-lg font-bold text-white mb-4">
              Информация о заказе
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#666]">Статус</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    order?.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-white/10 text-white"
                  }`}
                >
                  {order?.status || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#666]">Истекает</span>
                <span
                  className={`font-medium ${isExpired(order?.expiresAt) ? "text-red-400" : "text-white"}`}
                >
                  {formatExpiresAt(order?.expiresAt)}
                </span>
              </div>
            </div>

            {order && (
              <button
                onClick={handleRenew}
                className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition"
              >
                Продлить сервер
              </button>
            )}
          </div>

          {/* Действия */}
          <div className="glass-card p-6 animate-slide-up">
            <h2 className="text-lg font-bold text-white mb-4">Действия</h2>
            {server.pteroIdentifier ? (
              <a
                href={`https://panel.amethystcloud.online/server/${server.pteroIdentifier}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full block text-center"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Открыть панель управления
                </span>
              </a>
            ) : (
              <div className="text-center py-3 text-[#666] text-sm">
                Панель управления будет доступна после создания сервера
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
