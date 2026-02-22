import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api.js";
import { AuthContext } from "../../App.jsx";
import StatusBadge, { formatDate } from "../../components/StatusBadge.jsx";

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    api
      .getTicket(id)
      .then((d) => {
        setTicket(d.ticket);
        setMessages(d.messages);
      })
      .catch(() => {});
  };
  useEffect(load, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.replyTicket(id, { body: reply });
      setReply("");
      load();
    } catch {
    } finally {
      setSending(false);
    }
  };

  if (!ticket)
    return (
      <div className="flex justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 rounded-full animate-spin border-t-primary-600 dark:border-t-primary-400"></div>
        </div>
      </div>
    );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/tickets"
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg
            className="w-6 h-6 text-gray-500"
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
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            #{ticket.id} {ticket.subject}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Тикет поддержки
          </p>
        </div>
        <StatusBadge status={ticket.status} />
        <StatusBadge status={ticket.priority} />
      </div>

      {/* Messages */}
      <div className="space-y-4 mb-8">
        {messages.map((m, index) => (
          <div
            key={m.id}
            className={`flex ${m.userId === user?.id ? "justify-end" : "justify-start"} animate-slide-up`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={`max-w-2xl rounded-2xl p-5 ${
                m.userId === user?.id
                  ? "gradient-bg text-white shadow-lg shadow-primary-500/30"
                  : "glass-card border border-gray-200/50 dark:border-gray-700/50"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <span
                  className={`text-sm font-medium ${m.userId === user?.id ? "text-white/90" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {m.userId === user?.id ? "Вы" : "Поддержка"}
                </span>
                <span
                  className={`text-xs ${m.userId === user?.id ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {formatDate(m.createdAt)}
                </span>
              </div>
              <p
                className={`text-sm whitespace-pre-wrap ${m.userId === user?.id ? "text-white" : "text-gray-700 dark:text-gray-300"}`}
              >
                {m.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Form */}
      {ticket.status !== "closed" && (
        <form onSubmit={handleReply} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
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
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Ответить
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Отправьте сообщение поддержке
              </p>
            </div>
          </div>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
            placeholder="Напишите ваш ответ..."
            className="input-field resize-none mb-4"
          />
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
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
                Отправка...
              </span>
            ) : (
              <span className="flex items-center gap-2">
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Отправить
              </span>
            )}
          </button>
        </form>
      )}

      {ticket.status === "closed" && (
        <div className="glass-card p-6 text-center">
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
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Тикет закрыт
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Этот тикет был закрыт. Создайте новый, если нужна помощь.
          </p>
        </div>
      )}
    </div>
  );
}
