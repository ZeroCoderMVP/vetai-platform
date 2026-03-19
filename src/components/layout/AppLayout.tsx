"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import CommandPalette from "../ui/CommandPalette";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  alertCount?: number;
}

export default function AppLayout({ children, title, alertCount: initialAlertCount = 0 }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(initialAlertCount);

  useEffect(() => {
    // Initial fetch
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications?filter=unread');
        if (res.ok) {
          const data = await res.json();
          setAlertCount(data.unreadCount || 0);
        }
      } catch (e) {
        console.error('Failed to fetch unread count:', e);
      }
    };
    fetchUnread();
    
    // Poll every 60 seconds
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-layout">
      <CommandPalette />
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        alertCount={alertCount}
      />
      <main className={`app-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Header title={title} alertCount={alertCount} />
        <div className="page-container">{children}</div>
      </main>
    </div>
  );
}
