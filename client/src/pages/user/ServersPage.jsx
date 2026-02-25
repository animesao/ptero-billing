import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import StatusBadge from "../../components/StatusBadge.jsx";

export default function ServersPage() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadServers = () => {
    setLoading(true);
    api.getServers().then(setServers).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadServers();
    const interval = setInterval(loadServers, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && servers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#dc143c]/20 border-t-[#dc143c] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Мои серверы</h1>
          <p className="text-[#666]">Управление вашими серверами</p>
        </div>
        <Link to="/plans" className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Создать сервер
        </Link>
      </div>

      {servers.length === 0 ? (
        <div className="glass-card p-12 text-center animate-slide-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#dc143c]/20 to-[#ff1493]/20 border border-[#dc143c]/30 flex items-center justify-center animate-float">
            <svg className="w-10 h-10 text-[#dc143c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Нет серверов</h3>
          <p className="text-[#666] mb-6 max-w-md mx-auto">
            Выберите тарифный план и создайте свой первый сервер для размещения проекта
          </p>
          <Link to="/plans" className="btn-primary">Выбрать тариф</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((s, index) => (
            <div
              key={s.id}
              className="glass-card-hover p-6 animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#dc143c] to-[#ff1493] flex items-center justify-center shadow-lg shadow-[#dc143c]/30">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">{s.name}</h3>
                    <p className="text-xs text-[#666] font-mono">{s.pteroIdentifier || '—'}</p>
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <span className="text-[#666] flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    CPU
                  </span>
                  <span className="font-semibold text-white">{s.cpu}%</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <span className="text-[#666] flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    RAM
                  </span>
                  <span className="font-semibold text-white">{s.ramMb} MB</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <span className="text-[#666] flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    Диск
                  </span>
                  <span className="font-semibold text-white">{s.diskMb} MB</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <Link
                  to={`/servers/${s.id}/settings`}
                  className="flex-1 text-center py-2 px-3 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition"
                >
                  Настройки
                </Link>
                {s.pteroIdentifier && (
                  <a
                    href={`https://panel.amethystcloud.online/server/${s.pteroIdentifier}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2 px-3 bg-gradient-to-r from-[#dc143c] to-[#ff1493] text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-[#dc143c]/30 transition"
                  >
                    Панель
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
