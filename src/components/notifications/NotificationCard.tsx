"use client";

import { useState } from "react";
import Link from "next/link";
import { Notification } from "@/generated/prisma";

interface Props {
  notification: Notification;
  onRead: (id: string) => void;
  onAction: (id: string, newStatus: string) => void;
}

export default function NotificationCard({ notification, onRead, onAction }: Props) {
  const [isExpanding, setIsExpanding] = useState(false);

  const priorityColors: Record<string, string> = {
    critical: "var(--status-critical)",
    high: "var(--status-warning)",
    medium: "var(--status-warning)",
    low: "var(--text-secondary)",
  };

  const typeIcons: Record<string, string> = {
    action_required: "⚠️",
    report_alert: "📊",
    system_alert: "⚙️",
    info: "ℹ️"
  };

  const pColor = priorityColors[notification.priority] || priorityColors.low;
  const icon = typeIcons[notification.type] || "🔔";

  return (
    <div 
      className={`card ${!notification.isRead ? 'unread' : ''}`} 
      style={{ 
        display: 'flex', 
        borderLeft: `4px solid ${pColor}`,
        opacity: notification.isRead ? 0.7 : 1,
        marginBottom: '10px',
        padding: '16px',
        background: !notification.isRead ? 'var(--bg-elevated)' : 'var(--bg-primary)'
      }}
    >
      <div style={{ marginRight: '16px', fontSize: '24px' }}>
        {icon}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h4 style={{ margin: 0, fontWeight: !notification.isRead ? 'bold' : 'normal', color: 'var(--text-primary)' }}>
            {notification.link ? (
              <Link href={notification.link} style={{ color: 'inherit', textDecoration: 'none' }} className="hover-underline">
                {notification.title}
              </Link>
            ) : (
              notification.title
            )}
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {new Date(notification.createdAt).toLocaleString('ru-RU')}
          </span>
        </div>
        
        {notification.message && (
          <p style={{ margin: '4px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
            {notification.message}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
          {!notification.isRead && (
            <button 
              onClick={() => onRead(notification.id)}
              className="btn" 
              style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '4px 12px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              Прочитано
            </button>
          )}

          {notification.isActionable && notification.status !== 'done' && (
            <button 
              onClick={() => onAction(notification.id, 'done')}
              className="btn btn-primary" 
              style={{ padding: '4px 12px', fontSize: '13px' }}
            >
              Закрыть / Готово
            </button>
          )}

          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {notification.sourceType && `Источник: ${notification.sourceType}`}
          </span>
        </div>
      </div>
      
      {!notification.isRead && (
         <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-500)', marginTop: '8px' }} />
      )}
    </div>
  );
}
