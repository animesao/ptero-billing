import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { api } from "./api.js";
import { ToastProvider } from "./components/Toast.jsx";
import Sidebar from "./components/Sidebar.jsx";
import StarBackground from "./components/StarBackground.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import Dashboard from "./pages/user/Dashboard.jsx";
import ServersPage from "./pages/user/ServersPage.jsx";
import PlansPage from "./pages/user/PlansPage.jsx";
import OrdersPage from "./pages/user/OrdersPage.jsx";
import PaymentsPage from "./pages/user/PaymentsPage.jsx";
import TicketsPage from "./pages/user/TicketsPage.jsx";
import TicketDetail from "./pages/user/TicketDetail.jsx";
import ProfilePage from "./pages/user/ProfilePage.jsx";
import ServerSettings from "./pages/user/ServerSettings.jsx";
import OrderPage from "./pages/user/OrderPage.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminPlans from "./pages/admin/AdminPlans.jsx";
import AdminNodes from "./pages/admin/AdminNodes.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminServers from "./pages/admin/AdminServers.jsx";
import AdminPayments from "./pages/admin/AdminPayments.jsx";
import AdminTickets from "./pages/admin/AdminTickets.jsx";
import AdminTicketDetail from "./pages/admin/AdminTicketDetail.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";
import AdminLogs from "./pages/admin/AdminLogs.jsx";

export const AuthContext = createContext();

function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <StarBackground />
      <Sidebar />
      <main className="flex-1 ml-72 p-8 relative z-10">
        <div className="max-w-7xl mx-auto animate-slide-up">{children}</div>
      </main>
    </div>
  );
}

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#dc143c]/20 rounded-full animate-spin border-t-[#dc143c]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-[#dc143c] to-[#ff1493] rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then((d) => setUser(d.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = (userData) => setUser(userData);
  const logout = async () => {
    try { await api.logout(); } catch {}
    setUser(null);
  };

  return (
    <ToastProvider>
      <AuthContext.Provider value={{ user, login, logout, loading }}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/servers" element={<ProtectedRoute><ServersPage /></ProtectedRoute>} />
            <Route path="/plans" element={<ProtectedRoute><PlansPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
            <Route path="/tickets" element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />
            <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/servers/:id/settings" element={<ProtectedRoute><ServerSettings /></ProtectedRoute>} />
            <Route path="/plans/order" element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/plans" element={<ProtectedRoute adminOnly><AdminPlans /></ProtectedRoute>} />
            <Route path="/admin/nodes" element={<ProtectedRoute adminOnly><AdminNodes /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute adminOnly><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/servers" element={<ProtectedRoute adminOnly><AdminServers /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute adminOnly><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/tickets" element={<ProtectedRoute adminOnly><AdminTickets /></ProtectedRoute>} />
            <Route path="/admin/tickets/:id" element={<ProtectedRoute adminOnly><AdminTicketDetail /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/logs" element={<ProtectedRoute adminOnly><AdminLogs /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </ToastProvider>
  );
}
