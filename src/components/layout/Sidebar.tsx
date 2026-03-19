"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  alertCount?: number;
}

const navigation = [
  {
    section: "Главное",
    items: [
      { href: "/dashboard", label: "Дашборд", icon: "📊" },
      { href: "/dashboard/executive", label: "Руководитель", icon: "👑" },
      { href: "/events", label: "События", icon: "🔔" },
    ],
  },
  {
    section: "Производство",
    items: [
      { href: "/groups", label: "Группы", icon: "🐄" },
      { href: "/groups?type=calves", label: "Телята", icon: "🌱" },
      { href: "/sections", label: "Размещение", icon: "🗺️" },
      { href: "/herd", label: "Стадо", icon: "🐄" },
      { href: "/herd-structure", label: "Структура стада", icon: "📊" },
      { href: "/milking", label: "Учёт молока", icon: "🥛" },
      { href: "/milk-balance", label: "Баланс молока", icon: "⚖️" },
      { href: "/feeding", label: "Кормление", icon: "🌾" },
      { href: "/video", label: "Видеоаналитика", icon: "📹" },
    ],
  },
  {
    section: "Ветеринария",
    items: [
      { href: "/health", label: "Здоровье", icon: "💊" },
      { href: "/work-plans", label: "Планы работ", icon: "📝" },
      { href: "/reproduction", label: "Воспроизводство", icon: "🧬" },
      { href: "/operations", label: "Контроль AfiMilk", icon: "📋" },
    ],
  },
  {
    section: "Система",
    items: [
      { href: "/scenarios", label: "Сценарии", icon: "🔮" },
      { href: "/reporting", label: "Отчетность", icon: "📄" },
      { href: "/admin", label: "Администрирование", icon: "⚙️" },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, alertCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">В</div>
        {!collapsed && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="sidebar-logo-text">АО «Гатчинское»</span>
            <span style={{ fontSize: 10, color: "var(--text-tertiary)", whiteSpace: "nowrap", lineHeight: 1.2 }}>ВЕТАИ v 1.4</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {navigation.map((section) => (
          <div key={section.section} className="sidebar-section">
            <div className="sidebar-section-title">{section.section}</div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  {!collapsed && (
                    <span className="sidebar-link-text">{item.label}</span>
                  )}
                  {!collapsed && 'badgeKey' in item && item.badgeKey === "alerts" && alertCount > 0 && (
                    <span className="sidebar-link-badge">{alertCount}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? "→" : "← Свернуть"}
        </button>
      </div>
    </aside>
  );
}
