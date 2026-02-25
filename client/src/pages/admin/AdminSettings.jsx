import React, { useState, useEffect } from 'react';
import { api } from '../../api.js';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [testResult, setTestResult] = useState('');

  useEffect(() => { api.admin.getSettings().then(setSettings).catch(() => {}); }, []);

  const set = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await api.admin.saveSettings(settings);
      setMsg('Настройки сохранены');
    } catch (err) {
      setMsg('Ошибка: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const testPtero = async () => {
    setTestResult('Проверка...');
    try {
      const result = await api.admin.testPtero();
      setTestResult(result.success ? 'Подключение успешно!' : 'Ошибка: ' + result.message);
    } catch (err) {
      setTestResult('Ошибка: ' + err.message);
    }
  };

  const groups = [
    {
      title: 'Pterodactyl API',
      fields: [
        { key: 'ptero_url', label: 'URL панели', placeholder: 'https://panel.example.com', type: 'text' },
        { key: 'ptero_api_key', label: 'API ключ (Application)', placeholder: 'ptla_...', type: 'password' },
      ],
    },
    {
      title: 'Общие настройки',
      fields: [
        { key: 'site_name', label: 'Название сайта', placeholder: 'PteroBilling', type: 'text' },
        { key: 'site_description', label: 'Описание', placeholder: 'Биллинг-панель', type: 'text' },
        { key: 'default_currency', label: 'Валюта', placeholder: 'RUB', type: 'text' },
      ],
    },
    {
      title: 'Платёжные системы',
      fields: [
        { key: 'payment_stripe_enabled', label: 'Stripe включён', placeholder: 'true/false', type: 'text' },
        { key: 'payment_stripe_key', label: 'Stripe Secret Key', placeholder: 'sk_...', type: 'password' },
        { key: 'payment_paypal_enabled', label: 'PayPal включён', placeholder: 'true/false', type: 'text' },
        { key: 'payment_paypal_client_id', label: 'PayPal Client ID', placeholder: '', type: 'text' },
        { key: 'payment_paypal_secret', label: 'PayPal Secret', placeholder: '', type: 'password' },
        { key: 'payment_yokassa_enabled', label: 'ЮKassa включена', placeholder: 'true/false', type: 'text' },
        { key: 'payment_yokassa_shop_id', label: 'ЮKassa Shop ID', placeholder: '', type: 'text' },
        { key: 'payment_yokassa_secret', label: 'ЮKassa Secret Key', placeholder: '', type: 'password' },
      ],
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Настройки</h1>
        <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition disabled:opacity-50">
          {saving ? 'Сохранение...' : 'Сохранить все'}
        </button>
      </div>
      {msg && <div className={`p-3 rounded-lg mb-6 text-sm ${msg.includes('Ошибка') ? 'bg-red-50 dark:bg-red-900/30 text-red-600' : 'bg-green-50 dark:bg-green-900/30 text-green-600'}`}>{msg}</div>}

      <div className="space-y-6">
        {groups.map(group => (
          <div key={group.title} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">{group.title}</h2>
              {group.title === 'Pterodactyl API' && (
                <div className="flex items-center gap-3">
                  {testResult && <span className={`text-sm ${testResult.includes('успешно') ? 'text-green-600' : 'text-red-600'}`}>{testResult}</span>}
                  <button onClick={testPtero} className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition">Тест подключения</button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{f.label}</label>
                  <input type={f.type} value={settings[f.key] || ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
