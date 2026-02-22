import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api.js";
import { AuthContext } from "../../App.jsx";
import { formatPrice } from "../../components/StatusBadge.jsx";

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [serverName, setServerName] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState("");
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getPlans()
      .then(setPlans)
      .catch(() => {});
  }, []);

  const handleOrder = async () => {
    if (!selectedPlan) return;
    setOrdering(true);
    setError("");
    try {
      await api.createOrder({
        planId: selectedPlan.id,
        billingPeriod,
        serverName: serverName || undefined,
      });
      navigate("/servers");
    } catch (err) {
      setError(err.message);
    } finally {
      setOrdering(false);
    }
  };

  const getPrice = (plan) => {
    if (billingPeriod === "yearly" && plan.priceYearly) return plan.priceYearly;
    if (billingPeriod === "quarterly" && plan.priceQuarterly)
      return plan.priceQuarterly;
    return plan.priceMonthly;
  };

  const periodLabels = {
    monthly: { label: "Месяц", discount: null },
    quarterly: { label: "Квартал", discount: "Экономия 10%" },
    yearly: { label: "Год", discount: "Экономия 20%" },
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Тарифные планы
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Выберите оптимальный тариф для вашего проекта
        </p>

        {/* Billing Period Toggle */}
        <div className="inline-flex p-1.5 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
          {["monthly", "quarterly", "yearly"].map((p) => (
            <button
              key={p}
              onClick={() => setBillingPeriod(p)}
              className={`relative px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                billingPeriod === p
                  ? "gradient-bg text-white shadow-lg shadow-primary-500/30"
                  : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50"
              }`}
            >
              {periodLabels[p].label}
              {periodLabels[p].discount && billingPeriod === p && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan)}
            className={`glass-card p-6 cursor-pointer transition-all duration-300 card-hover ${
              selectedPlan?.id === plan.id
                ? "ring-2 ring-primary-500 shadow-xl shadow-primary-500/20 scale-[1.02]"
                : ""
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary-500/30">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              {plan.description && (
                <span className="badge badge-purple">{plan.description}</span>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {plan.name}
            </h3>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold gradient-text">
                  {formatPrice(getPrice(plan))}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  /{periodLabels[billingPeriod].label.toLowerCase()}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-600 dark:text-blue-400"
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
                <span className="text-gray-600 dark:text-gray-400">CPU</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100 ml-auto">
                  {plan.cpu}%
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-gray-600 dark:text-gray-400">RAM</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100 ml-auto">
                  {plan.ramMb} MB
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                    />
                  </svg>
                </div>
                <span className="text-gray-600 dark:text-gray-400">Диск</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100 ml-auto">
                  {plan.diskMb} MB
                </span>
              </div>
              {plan.slots > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-orange-600 dark:text-orange-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Слоты
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100 ml-auto">
                    {plan.slots}
                  </span>
                </div>
              )}
              {plan.dbLimit > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-cyan-600 dark:text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Базы данных
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100 ml-auto">
                    {plan.dbLimit}
                  </span>
                </div>
              )}
              {plan.backupLimit > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-pink-600 dark:text-pink-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H2a2 2 0 01-2-2V5a2 2 0 012-2h6"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Бэкапы
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100 ml-auto">
                    {plan.backupLimit}
                  </span>
                </div>
              )}
            </div>

            <div
              className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
                selectedPlan?.id === plan.id
                  ? "gradient-bg text-white shadow-lg shadow-primary-500/30"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {selectedPlan?.id === plan.id ? "Выбрано" : "Выбрать тариф"}
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-400"
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
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Тарифы пока не настроены администратором
          </p>
        </div>
      )}

      {/* Order Section */}
      {selectedPlan && (
        <div className="glass-card p-8 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary-500/30">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Оформление заказа
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedPlan.name}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 backdrop-blur-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Название сервера (необязательно)
            </label>
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="Мой сервер"
              className="input-field max-w-md"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 p-6 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                К оплате:
              </p>
              <p className="text-3xl font-bold gradient-text">
                {formatPrice(getPrice(selectedPlan))}
              </p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-600"></div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Ваш баланс:
              </p>
              <p
                className={`text-xl font-bold ${user?.balance >= getPrice(selectedPlan) ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {formatPrice(user?.balance || 0)}
              </p>
            </div>
            <button
              onClick={handleOrder}
              disabled={ordering || user?.balance < getPrice(selectedPlan)}
              className="btn-primary py-3 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ordering ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Оформление...
                </span>
              ) : (
                "Заказать сервер"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
