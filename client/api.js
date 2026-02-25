const BASE = "";

async function request(url, options = {}) {
  const res = await fetch(BASE + url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include",
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}

export const api = {
  login: (d) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(d) }),
  register: (d) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(d) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),

  getPlans: () => request("/api/user/plans"),
  getPterodactylNests: () => request("/api/user/pterodactyl/nests"),
  getPterodactylEggs: (nestId) =>
    request(`/api/user/pterodactyl/nests/${nestId}/eggs`),
  getServerAvailableEggs: (serverId) =>
    request(`/api/user/servers/${serverId}/available-eggs`),
  getServers: () => request("/api/user/servers"),
  getOrders: () => request("/api/user/orders"),
  createOrder: (d) =>
    request("/api/user/orders", { method: "POST", body: JSON.stringify(d) }),
  getPayments: () => request("/api/user/payments"),
  addBalance: (d) =>
    request("/api/user/balance/add", {
      method: "POST",
      body: JSON.stringify(d),
    }),
  getTickets: () => request("/api/user/tickets"),
  createTicket: (d) =>
    request("/api/user/tickets", { method: "POST", body: JSON.stringify(d) }),
  getTicket: (id) => request(`/api/user/tickets/${id}`),
  replyTicket: (id, d) =>
    request(`/api/user/tickets/${id}/reply`, {
      method: "POST",
      body: JSON.stringify(d),
    }),
  getTicketCategories: () => request("/api/user/ticket-categories"),
  updateProfile: (d) =>
    request("/api/user/profile", { method: "PUT", body: JSON.stringify(d) }),

  // Настройки сервера
  getUserServerSettings: (id) => request(`/api/user/servers/${id}/settings`),
  updateUserServerSettings: (id, d) =>
    request(`/api/user/servers/${id}/settings`, {
      method: "PUT",
      body: JSON.stringify(d),
    }),
  renewUserServer: (id) =>
    request(`/api/user/servers/${id}/renew`, { method: "POST" }),
  getServerEggs: (id) => request(`/api/user/servers/${id}/eggs`),
  changeServerEgg: (id, d) =>
    request(`/api/user/servers/${id}/change-egg`, {
      method: "POST",
      body: JSON.stringify(d),
    }),

  admin: {
    getStats: () => request("/api/admin/stats"),
    getUsers: () => request("/api/admin/users"),
    updateUser: (id, d) =>
      request(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(d),
      }),
    deleteUser: (id) => request(`/api/admin/users/${id}`, { method: "DELETE" }),
    getPlans: () => request("/api/admin/plans"),
    createPlan: (d) =>
      request("/api/admin/plans", { method: "POST", body: JSON.stringify(d) }),
    updatePlan: (id, d) =>
      request(`/api/admin/plans/${id}`, {
        method: "PUT",
        body: JSON.stringify(d),
      }),
    deletePlan: (id) => request(`/api/admin/plans/${id}`, { method: "DELETE" }),
    getOrders: () => request("/api/admin/orders"),
    updateOrder: (id, d) =>
      request(`/api/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify(d),
      }),
    getServers: () => request("/api/admin/servers"),
    deleteServer: (id) =>
      request(`/api/admin/servers/${id}`, { method: "DELETE" }),
    getPayments: () => request("/api/admin/payments"),
    getTickets: () => request("/api/admin/tickets"),
    getTicket: (id) => request(`/api/admin/tickets/${id}`),
    replyTicket: (id, d) =>
      request(`/api/admin/tickets/${id}/reply`, {
        method: "POST",
        body: JSON.stringify(d),
      }),
    updateTicket: (id, d) =>
      request(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(d),
      }),
    getCategories: () => request("/api/admin/ticket-categories"),
    createCategory: (d) =>
      request("/api/admin/ticket-categories", {
        method: "POST",
        body: JSON.stringify(d),
      }),
    deleteCategory: (id) =>
      request(`/api/admin/ticket-categories/${id}`, { method: "DELETE" }),
    getSettings: () => request("/api/admin/settings"),
    saveSettings: (d) =>
      request("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify(d),
      }),
    testPtero: () => request("/api/admin/ptero/test", { method: "POST" }),
    getNodes: () => request("/api/admin/ptero/nodes"),
    getLocations: () => request("/api/admin/ptero/locations"),
    getNests: () => request("/api/admin/ptero/nests"),
    getNodeAllocations: (nodeId) =>
      request(`/api/admin/ptero/nodes/${nodeId}/allocations`),
    getLogs: () => request("/api/admin/logs"),

    // Games API
    getGames: () => request("/api/admin/games"),
    createGame: (d) =>
      request("/api/admin/games", { method: "POST", body: JSON.stringify(d) }),
    updateGame: (id, d) =>
      request(`/api/admin/games/${id}`, {
        method: "PUT",
        body: JSON.stringify(d),
      }),
    deleteGame: (id) => request(`/api/admin/games/${id}`, { method: "DELETE" }),

    // Kernels API
    getKernels: () => request("/api/admin/kernels"),
    getKernelsByGame: (gameId) =>
      request(`/api/admin/kernels/by-game/${gameId}`),
    createKernel: (d) =>
      request("/api/admin/kernels", {
        method: "POST",
        body: JSON.stringify(d),
      }),
    updateKernel: (id, d) =>
      request(`/api/admin/kernels/${id}`, {
        method: "PUT",
        body: JSON.stringify(d),
      }),
    deleteKernel: (id) =>
      request(`/api/admin/kernels/${id}`, { method: "DELETE" }),

    // Sync Pterodactyl
    syncPterodactyl: () => request("/api/admin/ptero/sync", { method: "POST" }),
  },
};
