import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import StatusBadge, { formatDate } from "../../components/StatusBadge.jsx";

export default function ServersPage() {
  const [servers, setServers] = useState([]);
  useEffect(() => {
    api
      .getServers()
      .then(setServers)
      .catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
            Мои серверы
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Управление вашими серверами
          </p>
        </div>
        <Link to="/plans" className="btn-primary flex items-center gap-2">
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
          Создать сервер
        </Link>
      </div>

      {servers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-bg flex items-center justify-center shadow-2xl shadow-primary-500/30 animate-float">
            <svg
              className="w-10 h-10 text-white"
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
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Нет серверов
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Выберите тарифный план и создайте свой первый сервер для размещения
            проекта
          </p>
          <Link to="/plans" className="btn-primary">
            Выбрать тариф
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((s, index) => (
            <div
              key={s.id}
              className="glass-card p-6 card-hover"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-4">
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
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                    {s.name}
                  </h3>
                </div>
                <StatusBadge status={s.status} />
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-700/50">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    CPU
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {s.cpu}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-700/50">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
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
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    RAM
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {s.ramMb} MB
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-700/50">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
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
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                      />
                    </svg>
                    Диск
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {s.diskMb} MB
                  </span>
                </div>
                {s.pteroIdentifier && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-700/50">
                    <span className="text-gray-500 dark:text-gray-400">ID</span>
                    <span className="font-mono text-xs text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                      {s.pteroIdentifier}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200/50 dark:border-gray-700/50">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Создан: {formatDate(s.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
