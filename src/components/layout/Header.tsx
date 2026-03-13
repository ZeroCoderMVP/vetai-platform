"use client";

import { useTheme } from "@/components/ThemeProvider";

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
        <button className="header-btn" title="Уведомления">
          🔔
          {alertCount > 0 && <span className="badge" />}
        </button>
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
