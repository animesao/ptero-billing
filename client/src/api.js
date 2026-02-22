const BASE = '';

async function request(url, options = {}) {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

export const api = {
  login: (d) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(d) }),
  register: (d) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(d) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),

  getPlans: () => request('/api/user/plans'),
  getServers: () => request('/api/user/servers'),
  getOrders: () => request('/api/user/orders'),
  createOrder: (d) => request('/api/user/orders', { method: 'POST', body: JSON.stringify(d) }),
  getPayments: () => request('/api/user/payments'),
  addBalance: (d) => request('/api/user/balance/add', { method: 'POST', body: JSON.stringify(d) }),
  getTickets: () => request('/api/user/tickets'),
  createTicket: (d) => request('/api/user/tickets', { method: 'POST', body: JSON.stringify(d) }),
  getTicket: (id) => request(`/api/user/tickets/${id}`),
  replyTicket: (id, d) => request(`/api/user/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify(d) }),
  getTicketCategories: () => request('/api/user/ticket-categories'),
  updateProfile: (d) => request('/api/user/profile', { method: 'PUT', body: JSON.stringify(d) }),

  admin: {
    getStats: () => request('/api/admin/stats'),
    getUsers: () => request('/api/admin/users'),
    updateUser: (id, d) => request(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
    getPlans: () => request('/api/admin/plans'),
    createPlan: (d) => request('/api/admin/plans', { method: 'POST', body: JSON.stringify(d) }),
    updatePlan: (id, d) => request(`/api/admin/plans/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    deletePlan: (id) => request(`/api/admin/plans/${id}`, { method: 'DELETE' }),
    getOrders: () => request('/api/admin/orders'),
    updateOrder: (id, d) => request(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
    getServers: () => request('/api/admin/servers'),
    getPayments: () => request('/api/admin/payments'),
    getTickets: () => request('/api/admin/tickets'),
    getTicket: (id) => request(`/api/admin/tickets/${id}`),
    replyTicket: (id, d) => request(`/api/admin/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify(d) }),
    updateTicket: (id, d) => request(`/api/admin/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
    getCategories: () => request('/api/admin/ticket-categories'),
    createCategory: (d) => request('/api/admin/ticket-categories', { method: 'POST', body: JSON.stringify(d) }),
    deleteCategory: (id) => request(`/api/admin/ticket-categories/${id}`, { method: 'DELETE' }),
    getSettings: () => request('/api/admin/settings'),
    saveSettings: (d) => request('/api/admin/settings', { method: 'POST', body: JSON.stringify(d) }),
    testPtero: () => request('/api/admin/ptero/test', { method: 'POST' }),
    getLogs: () => request('/api/admin/logs'),
  },
};
