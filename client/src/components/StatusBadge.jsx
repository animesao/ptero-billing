import React from "react";

const badges = {
  active: { class: "badge-success", label: "Активен" },
  completed: { class: "badge-success", label: "Оплачен" },
  running: { class: "badge-success", label: "Работает" },
  open: { class: "badge-info", label: "Открыт" },
  pending: { class: "badge-warning", label: "Ожидает" },
  installing: { class: "badge-warning", label: "Установка" },
  pending_setup: { class: "badge-warning", label: "Ожидает настройки" },
  suspended: { class: "badge-danger", label: "Приостановлен" },
  blocked: { class: "badge-danger", label: "Заблокирован" },
  cancelled: { class: "badge-secondary", label: "Отменён" },
  closed: { class: "badge-secondary", label: "Закрыт" },
  answered: { class: "badge-purple", label: "Отвечен" },
  user: { class: "badge-info", label: "Пользователь" },
  admin: { class: "badge-purple", label: "Администратор" },
  monthly: { class: "badge-info", label: "Месяц" },
  quarterly: { class: "badge-purple", label: "Квартал" },
  yearly: { class: "badge-success", label: "Год" },
  low: { class: "badge-success", label: "Низкий" },
  normal: { class: "badge-info", label: "Обычный" },
  high: { class: "badge-warning", label: "Высокий" },
  urgent: { class: "badge-danger", label: "Срочный" },
};

export default function StatusBadge({ status }) {
  const badge = badges[status] || { class: "badge-secondary", label: status };
  return <span className={`badge ${badge.class}`}>{badge.label}</span>;
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
