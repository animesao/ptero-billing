import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import { AuthContext } from "../../App.jsx";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ servers: 0, orders: 0, balance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getServers(),
      api.getOrders(),
      api.me(),
    ])
      .then(([servers, orders, me]) => {
        setStats({
          servers: servers.length,
          orders: orders.filter(o => o.status === 'active').length,
          balance: me.user.balance || 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (cents) => (cents / 100).toLocaleString("ru-RU") + " ₽";

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
      <div className="animate-fade-in">
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Добро пожаловать, {user?.username}!
        </h1>
        <p className="text-[#666]">Панель управления вашими сервисами</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card-hover p-6 animate-scale-in" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
              </svg>
            </div>
            <div>
              <p className="text-[#666] text-sm">Серверы</p>
              <p className="text-2xl font-bold text-white">{stats.servers}</p>
            </div>
          </div>
        </div>

        <div className="glass-card-hover p-6 animate-scale-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-[#666] text-sm">Активные заказы</p>
              <p className="text-2xl font-bold text-white">{stats.orders}</p>
            </div>
          </div>
        </div>

        <div className="glass-card-hover p-6 animate-scale-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#dc143c]/20 to-[#ff1493]/20 border border-[#dc143c]/30 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#dc143c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[#666] text-sm">Баланс</p>
              <p className="text-2xl font-bold text-white">{formatPrice(stats.balance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="glass-card p-8 animate-slide-up">
        <h2 className="text-2xl font-bold text-white mb-6">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/servers" className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-[#dc143c]/30 hover:bg-[#dc143c]/10 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#dc143c] to-[#ff1493] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Создать сервер</h3>
            <p className="text-sm text-[#666]">Развернуть новый сервер</p>
          </Link>

          <Link to="/plans" className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-[#dc143c]/30 hover:bg-[#dc143c]/10 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Тарифы</h3>
            <p className="text-sm text-[#666]">Выбрать тарифный план</p>
          </Link>

          <Link to="/payments" className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-[#dc143c]/30 hover:bg-[#dc143c]/10 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Пополнить</h3>
            <p className="text-sm text-[#666]">Пополнить баланс счёта</p>
          </Link>

          <Link to="/tickets" className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-[#dc143c]/30 hover:bg-[#dc143c]/10 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Поддержка</h3>
            <p className="text-sm text-[#666]">Создать обращение</p>
          </Link>
        </div>
      </div>

      {/* Последние заказы */}
      <div className="glass-card p-8 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Последние заказы</h2>
          <Link to="/orders" className="text-[#dc143c] hover:text-[#ff1493] transition-colors text-sm font-medium flex items-center gap-1">
            Все заказы
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#dc143c]/20 to-[#ff1493]/20 border border-[#dc143c]/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#dc143c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Заказ #000</p>
                <p className="text-sm text-[#666]">Нет активных заказов</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
