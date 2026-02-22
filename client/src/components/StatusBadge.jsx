import React from 'react';

const colors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  running: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  installing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending_setup: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  answered: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const labels = {
  active: 'Активен', completed: 'Оплачен', running: 'Работает', open: 'Открыт',
  pending: 'Ожидает', installing: 'Установка', pending_setup: 'Ожидает настройки',
  suspended: 'Приостановлен', blocked: 'Заблокирован', cancelled: 'Отменён',
  closed: 'Закрыт', answered: 'Отвечен', user: 'Пользователь', admin: 'Администратор',
  monthly: 'Мес.', quarterly: 'Кварт.', yearly: 'Год.',
  low: 'Низкий', normal: 'Обычный', high: 'Высокий', urgent: 'Срочный',
};

export default function StatusBadge({ status }) {
  const cls = colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  const label = labels[status] || status;
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

export function formatPrice(cents) {
  return (cents / 100).toFixed(2) + ' \u20BD';
}

export function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
