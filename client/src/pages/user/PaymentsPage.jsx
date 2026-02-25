import React, { useState, useEffect } from "react";
import { api } from "../../api.js";
import StatusBadge, {
  formatPrice,
  formatDate,
} from "../../components/StatusBadge.jsx";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  useEffect(() => {
    api
      .getPayments()
      .then(setPayments)
      .catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
          Платежи
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          История платежей и пополнений
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
                  Заказ
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Провайдер
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Сумма
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Статус
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Дата
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">
                    #{p.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-800 dark:text-gray-100">
                        #{p.orderId || "Пополнение"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-gray-600 dark:text-gray-400">
                      {p.provider}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">
                    {formatPrice(p.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {formatDate(p.createdAt)}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
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
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                        Нет платежей
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm">
                        История платежей появится здесь
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
