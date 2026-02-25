import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { AuthContext } from "../App.jsx";
import StarBackground from "../components/StarBackground.jsx";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      const data = await api.register({ username, email, password });
      login(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <StarBackground />

      <div className="w-full max-w-md relative z-10">
        {/* Логотип */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#dc143c] to-[#ff1493] flex items-center justify-center glow-red animate-float">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">PteroBilling</h1>
          <p className="text-[#666]">Регистрация аккаунта</p>
        </div>

        {/* Форма */}
        <div className="glass-card p-8 animate-slide-up">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Регистрация</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-scale-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                Имя пользователя
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="input-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                Подтверждение пароля
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input-primary"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Регистрация...
                </span>
              ) : (
                "Создать аккаунт"
              )}
            </button>
          </form>

          <div className="divider"></div>

          <p className="text-center text-[#666] text-sm">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="text-[#dc143c] hover:text-[#ff1493] transition-colors">
              Войти
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[#666] text-xs mt-8">
          © 2024 PteroBilling. Все права защищены.
        </p>
      </div>
    </div>
  );
}
