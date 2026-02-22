import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api.js';
import { AuthContext } from '../../App.jsx';
import StatusBadge, { formatDate } from '../../components/StatusBadge.jsx';

export default function AdminTicketDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => {
    api.admin.getTicket(id).then(d => { setTicket(d.ticket); setMessages(d.messages); }).catch(() => {});
  };
  useEffect(load, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.admin.replyTicket(id, { body: reply });
      setReply('');
      load();
    } catch {} finally { setSending(false); }
  };

  const changeStatus = async (status) => {
    await api.admin.updateTicket(id, { status });
    load();
  };

  if (!ticket) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <Link to="/admin/tickets" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-2xl font-bold">#{ticket.id} {ticket.subject}</h1>
        <StatusBadge status={ticket.status} />
        <StatusBadge status={ticket.priority} />
      </div>
      <div className="flex gap-2 mb-6">
        <span className="text-sm text-gray-500">User ID: {ticket.userId}</span>
        <span className="text-sm text-gray-500">|</span>
        {['open', 'answered', 'closed'].map(s => (
          <button key={s} onClick={() => changeStatus(s)} className={`px-3 py-1 rounded text-xs font-medium transition ${ticket.status === s ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>{s}</button>
        ))}
      </div>

      <div className="space-y-4 mb-6">
        {messages.map(m => (
          <div key={m.id} className={`rounded-xl p-4 ${m.userId !== ticket.userId ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 ml-8' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mr-8'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{m.userId !== ticket.userId ? 'Поддержка' : `User #${m.userId}`}</span>
              <span className="text-xs text-gray-500">{formatDate(m.createdAt)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
      </div>

      {ticket.status !== 'closed' && (
        <form onSubmit={handleReply} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} placeholder="Ответ от поддержки..." className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 outline-none transition resize-none mb-3" />
          <button type="submit" disabled={sending || !reply.trim()} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50">
            {sending ? 'Отправка...' : 'Ответить'}
          </button>
        </form>
      )}
    </div>
  );
}
