import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../api.js";
import { formatPrice } from "../../components/StatusBadge.jsx";

export default function OrderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [games, setGames] = useState([]);
  const [kernels, setKernels] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedKernel, setSelectedKernel] = useState(null);

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
    Promise.all([api.getPlans(), api.getGames().catch(() => [])])
      .then(([plansData, gamesData]) => {
        const plan = plansData.find((p) => p.id === parseInt(planId));
        if (!plan) {
          navigate("/plans");
          return;
        }
        setSelectedPlan(plan);
        setGames(gamesData);

        // Если есть игры, показываем выбор
        if (gamesData && gamesData.length > 0) {
          setStep(2); // Выбор игры
        } else {
          // Если игр нет, сразу к оформлению
          setStep(4);
        }
      })
      .catch((err) => {
        console.error("Failed to load order data:", err);
        setError("Не удалось загрузить данные. Попробуйте позже.");
        setStep(4);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchParams, navigate]);

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setLoading(true);
    api
      .getKernels(game.id)
      .then((kernelsData) => {
        setKernels(kernelsData);
        setStep(3); // Выбор ядра
      })
      .catch((err) => {
        console.error("Failed to load kernels:", err);
        setError("Не удалось загрузить ядра. Попробуйте позже.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleKernelSelect = (kernel) => {
    setSelectedKernel(kernel);
    setStep(4); // Переход к оформлению
  };

  const goToStep = (stepNum) => {
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
    if (!selectedKernel) {
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
        kernelId: selectedKernel.id,
      });
      navigate("/servers");
    } catch (err) {
      setError(err.message || "Ошибка при создании заказа");
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
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex items-center gap-2 cursor-pointer ${
                step >= s ? "text-[#dc143c]" : "text-[#666]"
              }`}
              onClick={() => goToStep(s)}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step >= s ? "bg-[#dc143c] text-white" : "bg-white/10"
                }`}
              >
                {s}
              </div>
              <span className="text-sm font-medium hidden sm:block">
                {s === 1
                  ? "Тариф"
                  : s === 2
                    ? "Игра"
                    : s === 3
                      ? "Ядро"
                      : "Оформление"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Шаг 1: Выбор тарифа */}
      {step === 1 && (
        <div className="glass-card p-8 animate-scale-in text-center">
          <h2 className="text-2xl font-bold gradient-text mb-4">
            Выбран тариф: {selectedPlan.name}
          </h2>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-6">
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="text-[#666] text-sm mb-1">CPU</div>
              <div className="text-white font-bold text-lg">
                {selectedPlan.cpu}%
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="text-[#666] text-sm mb-1">RAM</div>
              <div className="text-white font-bold text-lg">
                {selectedPlan.ramMb} MB
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="text-[#666] text-sm mb-1">Диск</div>
              <div className="text-white font-bold text-lg">
                {selectedPlan.diskMb} MB
              </div>
            </div>
          </div>
          <button onClick={() => setStep(2)} className="btn-primary">
            Продолжить
          </button>
        </div>
      )}

      {/* Шаг 2: Выбор игры */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold gradient-text text-center">
            Выберите игру
          </h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#dc143c]/20 border-t-[#dc143c] rounded-full animate-spin"></div>
            </div>
          ) : games.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-[#666] mb-4">Игры не найдены</p>
              <button onClick={() => setStep(4)} className="btn-primary">
                Перейти к оформлению
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game, index) => (
                <div
                  key={game.id}
                  onClick={() => handleGameSelect(game)}
                  className="glass-card-hover p-6 cursor-pointer animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#dc143c] to-[#ff1493] flex items-center justify-center shadow-lg shadow-[#dc143c]/30">
                      {game.icon ? (
                        <img
                          src={game.icon}
                          alt={game.name}
                          className="w-6 h-6 object-cover rounded"
                        />
                      ) : (
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{game.name}</h3>
                      {game.description && (
                        <p className="text-xs text-[#666] line-clamp-2">
                          {game.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Шаг 3: Выбор ядра */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setStep(2)}
              className="text-[#666] hover:text-white transition-colors"
            >
              ← Назад
            </button>
            <h2 className="text-2xl font-bold gradient-text">
              Ядра для {selectedGame?.name}
            </h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#dc143c]/20 border-t-[#dc143c] rounded-full animate-spin"></div>
            </div>
          ) : kernels.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-[#666] mb-4">Ядра не найдены</p>
              <button onClick={() => setStep(2)} className="btn-primary">
                Назад к играм
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kernels.map((kernel, index) => (
                <div
                  key={kernel.id}
                  onClick={() => handleKernelSelect(kernel)}
                  className="glass-card-hover p-6 cursor-pointer animate-scale-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <h3 className="font-bold text-white text-lg mb-2">
                    {kernel.name}
                  </h3>
                  {kernel.description && (
                    <p className="text-sm text-[#666] mb-3 line-clamp-2">
                      {kernel.description}
                    </p>
                  )}
                  {kernel.dockerImage && (
                    <div className="text-xs text-[#888] bg-white/5 p-2 rounded">
                      Docker: {kernel.dockerImage.slice(0, 50)}
                      {kernel.dockerImage.length > 50 ? "..." : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Шаг 4: Оформление */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() =>
                selectedKernel
                  ? setStep(3)
                  : selectedGame
                    ? setStep(2)
                    : setStep(1)
              }
              className="text-[#666] hover:text-white transition-colors"
            >
              ← Назад
            </button>
            <h2 className="text-2xl font-bold gradient-text">
              Оформление заказа
            </h2>
          </div>

          {error && (
            <div className="glass-card p-4 border border-red-500/30 text-red-400 animate-fade-in">
              {error}
            </div>
          )}

          <div className="glass-card p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Параметры сервера
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-[#666] mb-2">
                  Тарифный план
                </label>
                <div className="text-white font-medium">
                  {selectedPlan.name} - {formatPrice(getPrice())} /{" "}
                  {periodLabels[billingPeriod]}
                </div>
              </div>

              {selectedGame && (
                <div>
                  <label className="block text-sm text-[#666] mb-2">Игра</label>
                  <div className="text-white font-medium">
                    {selectedGame.name}
                  </div>
                </div>
              )}

              {selectedKernel && (
                <div>
                  <label className="block text-sm text-[#666] mb-2">Ядро</label>
                  <div className="text-white font-medium">
                    {selectedKernel.name}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-[#666] mb-2">
                  Название сервера
                </label>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="Мой сервер"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#dc143c]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#666] mb-2">
                  Период оплаты
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      value: "monthly",
                      label: "1 мес",
                      price: selectedPlan.priceMonthly,
                    },
                    {
                      value: "quarterly",
                      label: "3 мес",
                      price:
                        selectedPlan.priceQuarterly ||
                        selectedPlan.priceMonthly * 3,
                    },
                    {
                      value: "yearly",
                      label: "12 мес",
                      price:
                        selectedPlan.priceYearly ||
                        selectedPlan.priceMonthly * 12,
                    },
                  ].map((period) => (
                    <button
                      key={period.value}
                      onClick={() => setBillingPeriod(period.value)}
                      className={`p-3 rounded-lg border transition-all ${
                        billingPeriod === period.value
                          ? "border-[#dc143c] bg-[#dc143c]/20"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="text-xs text-[#666]">{period.label}</div>
                      <div className="text-sm font-bold text-white">
                        {formatPrice(period.price)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div>
                <div className="text-sm text-[#666]">Итого к оплате:</div>
                <div className="text-3xl font-bold gradient-text">
                  {formatPrice(getPrice())}
                </div>
              </div>
              <button
                onClick={handleOrder}
                disabled={loading}
                className="btn-primary px-8 py-3 text-lg"
              >
                {loading ? "Создание..." : "Оплатить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
