"use client";

import { useTheme } from "@/components/ThemeProvider";
import Link from "next/link";

interface HeaderProps {
  title: string;
  userName?: string;
  userRole?: string;
  alertCount?: number;
}

export default function Header({ title, userName = "Лебедев Александр Владимирович", userRole = "Владелец", alertCount = 0 }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>

      <div className="header-search">
        <span className="header-search-icon">🔍</span>
        <input type="text" placeholder="Поиск коров, событий..." />
      </div>

      <div className="header-actions">
        <button 
          className="header-btn theme-toggle-btn" 
          onClick={toggleTheme} 
          title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
        >
          <span className="theme-icon">{theme === "dark" ? "☀️" : "🌙"}</span>
        </button>
        <Link href="/notifications" className="header-btn" title="Уведомления" style={{ textDecoration: 'none', position: 'relative' }}>
          🔔
          {alertCount > 0 && (
            <span className="badge" style={{ 
              position: 'absolute', top: 4, right: 4, background: 'var(--status-critical)', color: 'white', 
              fontSize: '10px', fontWeight: 'bold', padding: '2px 4px', borderRadius: '10px', minWidth: '16px', textAlign: 'center'
            }}>
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </Link>
        <button className="header-btn" title="Настройки">
          ⚙️
        </button>
      </div>

      <div className="header-user">
        <div className="header-avatar">{initials}</div>
        <div className="header-user-info">
          <span className="header-user-name">{userName}</span>
          <span className="header-user-role">{userRole}</span>
        </div>
      </div>
    </header>
  );
}
