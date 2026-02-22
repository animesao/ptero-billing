import React, { useState, useEffect } from "react";
import { api } from "../../api.js";
import StatusBadge, {
  formatPrice,
  formatDate,
} from "../../components/StatusBadge.jsx";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    api
      .getOrders()
      .then(setOrders)
      .catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
          Мои заказы
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          История заказов и подписок
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50/80 to-gray-50/50 dark:from-gray-800/80 dark:to-gray-800/50 border-b border-gray-200/50 dark:border-gray-700/50">
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  #
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Тариф
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Период
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Сумма
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Статус
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Истекает
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Создан
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">
                    #{o.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
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
                      </div>
                      <span className="text-gray-800 dark:text-gray-100">
                        Тариф #{o.planId}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={o.billingPeriod} />
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">
                    {formatPrice(o.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {formatDate(o.expiresAt)}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {formatDate(o.createdAt)}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
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
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                        Нет заказов
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm">
                        Закажите сервер, чтобы увидеть заказы здесь
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
