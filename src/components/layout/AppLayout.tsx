"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import CommandPalette from "../ui/CommandPalette";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  alertCount?: number;
}

export default function AppLayout({ children, title, alertCount = 0 }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
