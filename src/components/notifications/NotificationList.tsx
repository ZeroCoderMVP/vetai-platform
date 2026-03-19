"use client";

import { useEffect, useState } from "react";
import NotificationCard from "./NotificationCard";
import { Notification } from "@/generated/prisma";

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const markAllAsRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    fetchNotifications();
  };

  const handleRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true })
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleAction = async (id: string, status: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status } : n));
  };

  const filters = [
    { id: "all", label: "Все" },
    { id: "unread", label: "Непрочитанные" },
    { id: "actionable", label: "Требуют действия" },
    { id: "reports", label: "По отчётам" },
    { id: "system", label: "Системные" }
  ];

  return (
    <div style={{ width: '100%', gap: '24px', display: 'flex', flexDirection: 'column' }}>
      
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)', padding: '16px 24px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Уведомления</h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Ваш Inbox действий и событий платформы
          </p>
        </div>
        <div>
          <button onClick={markAllAsRead} className="btn btn-secondary" style={{ marginRight: '12px' }}>
            Отметить всё прочитанным
          </button>
          <button onClick={fetchNotifications} className="btn">
            ↻ Обновить
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
        {filters.map(f => (
          <button 
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`btn ${filter === f.id ? 'btn-primary' : ''}`}
            style={{ 
              borderRadius: '20px', 
              padding: '6px 16px', 
              background: filter === f.id ? 'var(--primary-600)' : 'var(--bg-secondary)',
              color: filter === f.id ? 'white' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="notification-feed">
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>Загрузка уведомлений...</p>
        ) : notifications.length === 0 ? (
          <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Непрочитанных уведомлений нет</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>По выбранным фильтрам ничего не найдено.</p>
          </div>
        ) : (
          notifications.map(n => (
            <NotificationCard 
              key={n.id} 
              notification={n} 
              onRead={handleRead} 
              onAction={handleAction} 
            />
          ))
        )}
      </div>

    </div>
  );
}
