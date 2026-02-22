import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api.js";
import { formatPrice } from "../../components/StatusBadge.jsx";

export default function PlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPlans()
      .then((data) => {
        setPlans(data.filter(p => p.isActive !== false));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePlanClick = (plan) => {
    navigate(`/plans/order?planId=${plan.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#dc143c]/20 border-t-[#dc143c] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl font-bold gradient-text mb-3">Игровые серверы</h1>
        <p className="text-[#666] max-w-md mx-auto">
          Выбери тариф, игру и ядро для своего сервера
        </p>
      </div>

      {/* Список тарифов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            onClick={() => handlePlanClick(plan)}
            className="glass-card-hover p-6 cursor-pointer animate-scale-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#dc143c] to-[#ff1493] flex items-center justify-center shadow-lg shadow-[#dc143c]/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">{plan.name}</h3>
                {plan.description && <p className="text-xs text-[#666]">{plan.description}</p>}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-3xl font-bold gradient-text">{formatPrice(plan.priceMonthly)}</p>
              <p className="text-xs text-[#666]">/ месяц</p>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                <span className="text-[#666] flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  CPU
                </span>
                <span className="text-white font-medium">{plan.cpu}%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                <span className="text-[#666] flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  RAM
                </span>
                <span className="text-white font-medium">{plan.ramMb} MB</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                <span className="text-[#666] flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  Диск
                </span>
                <span className="text-white font-medium">{plan.diskMb} MB</span>
              </div>
            </div>

            <div className="btn-primary w-full text-center">
              Выбрать тариф
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="glass-card p-12 text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#dc143c]/20 to-[#ff1493]/20 border border-[#dc143c]/30 flex items-center justify-center animate-float">
            <svg className="w-10 h-10 text-[#dc143c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Нет доступных тарифов</h3>
          <p className="text-[#666]">Тарифы пока не настроены администратором</p>
        </div>
      )}
    </div>
  );
}
