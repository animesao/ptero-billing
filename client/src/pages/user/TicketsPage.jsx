import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import StatusBadge, { formatDate } from "../../components/StatusBadge.jsx";

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    body: "",
    categoryId: "",
    priority: "normal",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getTickets()
      .then(setTickets)
      .catch(() => {});
    api
      .getTicketCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await api.createTicket(form);
      setShowNew(false);
      setForm({ subject: "", body: "", categoryId: "", priority: "normal" });
      api.getTickets().then(setTickets);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
            Тикеты поддержки
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Создавайте и отслеживайте обращения
          </p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="btn-primary flex items-center gap-2"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          {showNew ? "Отмена" : "Новый тикет"}
        </button>
      </div>

      {showNew && (
        <div className="glass-card p-6 mb-8 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
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
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Создать тикет
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Опишите вашу проблему
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 backdrop-blur-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <svg
                    className="w-4 h-4 inline mr-1.5"
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
                  Тема
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  required
                  className="input-field"
                  placeholder="Краткое описание проблемы"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <svg
                    className="w-4 h-4 inline mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  Категория
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="">Без категории</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <svg
                    className="w-4 h-4 inline mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  Приоритет
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="low">Низкий</option>
                  <option value="normal">Обычный</option>
                  <option value="high">Высокий</option>
                  <option value="urgent">Срочный</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <svg
                  className="w-4 h-4 inline mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Сообщение
              </label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
                rows={5}
                className="input-field resize-none"
                placeholder="Подробно опишите вашу проблему..."
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
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
                  Создание...
                </span>
              ) : (
                "Создать тикет"
              )}
            </button>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50/80 to-gray-50/50 dark:from-gray-800/80 dark:to-gray-800/50 border-b border-gray-200/50 dark:border-gray-700/50">
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  #
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Тема
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Приоритет
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Статус
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Обновлён
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">
                    #{t.id}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/tickets/${t.id}`}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      {t.subject}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={t.priority} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {formatDate(t.updatedAt)}
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
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
                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                        Нет тикетов
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm">
                        Создайте первый тикет поддержки
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
