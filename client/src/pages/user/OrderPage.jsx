import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../api.js";
import { formatPrice } from "../../components/StatusBadge.jsx";

export default function OrderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [nests, setNests] = useState([]);
  const [selectedNest, setSelectedNest] = useState(null);
  const [selectedEgg, setSelectedEgg] = useState(null);

  const [serverName, setServerName] = useState("");
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  useEffect(() => {
    const planId = searchParams.get("planId");
    if (!planId) {
      navigate("/plans");
      return;
    }

    setLoading(true);
    Promise.all([api.getPlans(), api.getPterodactylNests().catch(() => [])])
      .then(([plansData, nestsData]) => {
        const plan = plansData.find((p) => p.id === parseInt(planId));
        if (!plan) {
          navigate("/plans");
          return;
        }
        setSelectedPlan(plan);
        setNests(nestsData);

        // Автовыбор гнезда и яйца если есть данные
        if (nestsData && nestsData.length > 0) {
          const firstNest = nestsData[0];
          setSelectedNest(firstNest);

          // Выбираем первое яйцо из первого гнезда если есть
          if (firstNest.eggs && firstNest.eggs.length > 0) {
            const firstEgg = firstNest.eggs[0];
            setSelectedEgg(firstEgg);
            setStep(4); // Переходим сразу к оформлению
          } else {
            setStep(3); // Нужно выбрать яйцо
          }
        } else {
          setStep(2); // Нужно выбрать игру
        }
      })
      .catch((err) => {
        console.error("Failed to load order data:", err);
        setError("Не удалось загрузить данные. Попробуйте позже.");
        setStep(2); // Показываем шаг выбора игры даже при ошибке
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams, navigate]);

  const handleNestSelect = (nest) => {
    setSelectedNest(nest);
    setSelectedEgg(null); // Сбрасываем яйцо при смене игры
    setStep(3);
  };

  const handleEggSelect = (egg) => {
    setSelectedEgg(egg);
    setStep(4);
  };

  const goToStep = (stepNum) => {
    // Можно вернуться на предыдущие шаги для редактирования
    if (stepNum <= step) {
      setStep(stepNum);
    }
  };

  const handleOrder = async () => {
    if (!selectedPlan) return;
    if (!serverName.trim()) {
      setError("Введите название сервера");
      return;
    }
    if (!selectedEgg) {
      setError("Выберите ядро");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.createOrder({
        planId: selectedPlan.id,
        billingPeriod,
        serverName,
        eggId: selectedEgg.id,
      });
      navigate("/servers");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = () => {
    if (!selectedPlan) return 0;
    if (billingPeriod === "yearly" && selectedPlan.priceYearly)
      return selectedPlan.priceYearly;
    if (billingPeriod === "quarterly" && selectedPlan.priceQuarterly)
      return selectedPlan.priceQuarterly;
    return selectedPlan.priceMonthly;
  };

  const periodLabels = {
    monthly: "1 месяц",
    quarterly: "3 месяца",
    yearly: "12 месяцев",
  };

  if (!selectedPlan) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#dc143c]/20 border-t-[#dc143c] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Прогресс бар */}
      <div className="glass-card p-4 animate-slide-up">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div
            className={`flex items-center gap-2 cursor-pointer ${step >= 1 ? "text-[#dc143c]" : "text-[#666]"}`}
            onClick={() => goToStep(1)}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= 1 ? "bg-[#dc143c] text-white" : "bg-white/10"
              }`}
            >
              1
            </div>
            <span className="text-sm font-medium hidden sm:inline">Тариф</span>
          </div>
          <div
            className={`flex-1 h-0.5 mx-4 transition-all ${step >= 2 ? "bg-[#dc143c]" : "bg-white/10"}`}
          ></div>
          <div
            className={`flex items-center gap-2 cursor-pointer ${step >= 2 ? "text-[#dc143c]" : "text-[#666]"}`}
            onClick={() => goToStep(2)}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= 2 ? "bg-[#dc143c] text-white" : "bg-white/10"
              }`}
            >
              2
            </div>
            <span className="text-sm font-medium hidden sm:inline">Игра</span>
          </div>
          <div
            className={`flex-1 h-0.5 mx-4 transition-all ${step >= 3 ? "bg-[#dc143c]" : "bg-white/10"}`}
          ></div>
          <div
            className={`flex items-center gap-2 cursor-pointer ${step >= 3 ? "text-[#dc143c]" : "text-[#666]"}`}
            onClick={() => goToStep(3)}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= 3 ? "bg-[#dc143c] text-white" : "bg-white/10"
              }`}
            >
              3
            </div>
            <span className="text-sm font-medium hidden sm:inline">Ядро</span>
          </div>
          <div
            className={`flex-1 h-0.5 mx-4 transition-all ${step >= 4 ? "bg-[#dc143c]" : "bg-white/10"}`}
          ></div>
          <div
            className={`flex items-center gap-2 ${step >= 4 ? "text-[#dc143c]" : "text-[#666]"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= 4 ? "bg-[#dc143c] text-white" : "bg-white/10"
              }`}
            >
              4
            </div>
            <span className="text-sm font-medium hidden sm:inline">Заказ</span>
          </div>
        </div>
      </div>

      {/* Шаг 1: Выбранный тариф */}
      {step >= 1 && (
        <div className="glass-card p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              1. Выбранный тариф
            </h3>
            <button
              onClick={() => navigate("/plans")}
              className="text-sm text-[#dc143c] hover:text-[#ff1493] transition-colors flex items-center gap-1"
            >
              Изменить
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#dc143c] to-[#ff1493] flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedPlan.name}
                </h2>
                <p className="text-[#666] text-sm">
                  {formatPrice(getPrice())} / {periodLabels[billingPeriod]}
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-sm text-[#666]">
                CPU: <span className="text-white">{selectedPlan.cpu}%</span>
              </div>
              <div className="text-sm text-[#666]">
                RAM: <span className="text-white">{selectedPlan.ramMb} MB</span>
              </div>
              <div className="text-sm text-[#666]">
                Диск:{" "}
                <span className="text-white">{selectedPlan.diskMb} MB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Шаг 2: Выбор игры */}
      {step >= 2 && (
        <div className="glass-card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
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
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
              2. Выбери игру
            </h3>
            {step > 1 && (
              <button
                onClick={() => goToStep(1)}
                className="text-sm text-[#dc143c] hover:text-[#ff1493] transition-colors flex items-center gap-1"
              >
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Назад
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-[#dc143c]/20 border-t-[#dc143c] rounded-full animate-spin"></div>
            </div>
          ) : nests && nests.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {nests.map((nest) => (
                <button
                  key={nest.id}
                  onClick={() => handleNestSelect(nest)}
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    selectedNest?.id === nest.id
                      ? "bg-[#dc143c]/10 border-[#dc143c]/50 text-white"
                      : "bg-white/5 border-white/10 text-[#666] hover:border-[#dc143c]/30"
                  }`}
                >
                  <p className="font-medium text-sm">{nest.name}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#666]">
              <p>Игры не загружены. Попробуйте обновить страницу.</p>
            </div>
          )}
        </div>
      )}

      {/* Шаг 3: Выбор ядра */}
      {step >= 3 && selectedNest && (
        <div className="glass-card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
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
              3. Выбери ядро
            </h3>
            {step > 2 && (
              <button
                onClick={() => goToStep(2)}
                className="text-sm text-[#dc143c] hover:text-[#ff1493] transition-colors flex items-center gap-1"
              >
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Назад
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedNest.eggs?.map((egg) => (
              <button
                key={egg.id}
                onClick={() => handleEggSelect(egg)}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                  selectedEgg?.id === egg.id
                    ? "bg-[#dc143c]/10 border-[#dc143c]/50 text-white"
                    : "bg-white/5 border-white/10 text-[#666] hover:border-[#dc143c]/30"
                }`}
              >
                <p className="font-medium">{egg.name}</p>
                <p className="text-xs text-[#666] mt-1 line-clamp-2">
                  {egg.description || egg.dockerImage}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Шаг 4: Оформление */}
      {step >= 4 && selectedEgg && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
          {/* Левая колонка */}
          <div className="lg:col-span-2 space-y-6">
            {/* Название сервера */}
            <div className="glass-card p-6">
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                Название сервера
              </label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="Мой сервер"
                className="input-primary"
              />
            </div>

            {/* Период оплаты */}
            <div className="glass-card p-6">
              <label className="block text-sm font-medium text-[#a0a0a0] mb-4">
                Период оплаты
              </label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(periodLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setBillingPeriod(key)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      billingPeriod === key
                        ? "bg-[#dc143c]/10 border-[#dc143c]/50 text-white"
                        : "bg-white/5 border-white/10 text-[#666] hover:border-[#dc143c]/30"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={handleOrder}
              disabled={loading || !serverName.trim()}
              className="btn-primary w-full py-4 text-lg disabled:opacity-50"
            >
              {loading
                ? "Оформление..."
                : `Заказать за ${formatPrice(getPrice())}`}
            </button>
          </div>

          {/* Правая колонка - Итого */}
          <div className="space-y-6">
            <div className="glass-card p-6 sticky top-8">
              <h3 className="text-lg font-bold text-white mb-4">Итого</h3>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-[#666]">Тариф</span>
                  <span className="text-white">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Игра</span>
                  <span className="text-white">{selectedNest?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Ядро</span>
                  <span className="text-white">{selectedEgg?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Период</span>
                  <span className="text-white">
                    {periodLabels[billingPeriod]}
                  </span>
                </div>
              </div>

              <div className="divider"></div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-[#666]">К оплате:</span>
                <span className="text-2xl font-bold gradient-text">
                  {formatPrice(getPrice())}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-[#666] mb-2">Информация о ядре:</p>
                <p className="text-xs font-mono text-[#a0a0a0] break-all">
                  {selectedEgg.dockerImage}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
