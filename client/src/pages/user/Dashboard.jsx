import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import { AuthContext } from "../../App.jsx";
import StatusBadge, {
  formatPrice,
  formatDate,
} from "../../components/StatusBadge.jsx";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [servers, setServers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    api
      .getServers()
      .then(setServers)
      .catch(() => {});
    api
      .getOrders()
      .then(setOrders)
      .catch(() => {});
    api
      .getTickets()
      .then(setTickets)
      .catch(() => {});
  }, []);

  const stats = [
    {
      title: "Баланс",
      value: formatPrice(user?.balance || 0),
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      gradient: "from-green-500 to-emerald-600",
      shadow: "shadow-green-500/30",
    },
    {
      title: "Серверы",
      value: servers.length,
      icon: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2",
      gradient: "from-blue-500 to-cyan-600",
      shadow: "shadow-blue-500/30",
    },
    {
      title: "Заказы",
      value: orders.length,
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
      gradient: "from-purple-500 to-pink-600",
      shadow: "shadow-purple-500/30",
    },
    {
      title: "Тикеты",
      value: tickets.filter((t) => t.status !== "closed").length,
      icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
      gradient: "from-orange-500 to-red-600",
      shadow: "shadow-orange-500/30",
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Добро пожаловать,{" "}
          <span className="gradient-text">{user?.username}</span>!
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Панель управления вашим хостингом
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="glass-card p-6 card-hover"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow}`}
              >
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
                    d={stat.icon}
                  />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {stat.title}
            </p>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Servers Card */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg
                  className="w-5 h-5 text-white"
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
              </div>
              <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                Мои серверы
              </h2>
            </div>
            <Link
              to="/plans"
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              Создать
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
            </Link>
          </div>
          <div className="p-6">
            {servers.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Нет серверов
                </p>
                <Link to="/plans" className="btn-primary text-sm">
                  Выбрать тариф
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {servers.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {s.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {s.cpu}% CPU • {s.ramMb}MB RAM • {s.diskMb}MB Disk
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tickets Card */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              </div>
              <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                Последние тикеты
              </h2>
            </div>
            <Link
              to="/tickets"
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              Все
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
            </Link>
          </div>
          <div className="p-6">
            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">Нет тикетов</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.slice(0, 5).map((t) => (
                  <Link
                    key={t.id}
                    to={`/tickets/${t.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 group"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        #{t.id} {t.subject}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(t.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
