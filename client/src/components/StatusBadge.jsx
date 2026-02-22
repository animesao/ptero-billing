import React from "react";

const badges = {
  active: { class: "bg-green-500/20 text-green-400 border border-green-500/30", label: "Активен" },
  completed: { class: "bg-green-500/20 text-green-400 border border-green-500/30", label: "Оплачен" },
  running: { class: "bg-green-500/20 text-green-400 border border-green-500/30", label: "Работает" },
  open: { class: "bg-blue-500/20 text-blue-400 border border-blue-500/30", label: "Открыт" },
  pending: { class: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30", label: "Ожидает" },
  installing: { class: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30", label: "Установка" },
  reinstalling: { class: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30", label: "Переустановка" },
  pending_setup: { class: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30", label: "Ожидает" },
  suspended: { class: "bg-red-500/20 text-red-400 border border-red-500/30", label: "Приостановлен" },
  blocked: { class: "bg-red-500/20 text-red-400 border border-red-500/30", label: "Заблокирован" },
  cancelled: { class: "bg-white/10 text-[#666] border border-white/5", label: "Отменён" },
  closed: { class: "bg-white/10 text-[#666] border border-white/5", label: "Закрыт" },
  answered: { class: "bg-purple-500/20 text-purple-400 border border-purple-500/30", label: "Отвечен" },
  user: { class: "bg-blue-500/20 text-blue-400 border border-blue-500/30", label: "Пользователь" },
  admin: { class: "bg-purple-500/20 text-purple-400 border border-purple-500/30", label: "Администратор" },
  monthly: { class: "bg-blue-500/20 text-blue-400 border border-blue-500/30", label: "Месяц" },
  quarterly: { class: "bg-purple-500/20 text-purple-400 border border-purple-500/30", label: "Квартал" },
  yearly: { class: "bg-green-500/20 text-green-400 border border-green-500/30", label: "Год" },
  low: { class: "bg-green-500/20 text-green-400 border border-green-500/30", label: "Низкий" },
  normal: { class: "bg-blue-500/20 text-blue-400 border border-blue-500/30", label: "Обычный" },
  high: { class: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30", label: "Высокий" },
  urgent: { class: "bg-red-500/20 text-red-400 border border-red-500/30", label: "Срочный" },
  offline: { class: "bg-red-500/20 text-red-400 border border-red-500/30", label: "Остановлен" },
  starting: { class: "bg-blue-500/20 text-blue-400 border border-blue-500/30", label: "Запуск" },
  stopping: { class: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30", label: "Остановка" },
  restarting: { class: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30", label: "Перезагрузка" },
};

export default function StatusBadge({ status }) {
  const badge = badges[status] || { class: "bg-white/10 text-[#666] border border-white/5", label: status };
  return (
    <span className={`badge px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${badge.class}`}>
      {badge.label}
    </span>
  );
}

export function formatPrice(cents) {
  return (cents / 100).toLocaleString("ru-RU") + " ₽";
}

export function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
