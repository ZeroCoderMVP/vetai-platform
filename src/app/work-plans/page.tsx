"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { getSystemDate } from "@/lib/systemDate";

type TaskStatus = "CREATED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type OperationRequest = {
  id: string;
  operationType: string;
  status: TaskStatus;
  priority: TaskPriority;
  title: string;
  description?: string;
  eventDate: string;
  cow: { number: string; group?: { name: string } };
};

type CategoryStats = { total: number; completed: number; percent: number };

type TabId = "TREATMENT" | "INSEMINATION" | "VACCINATION" | "HOOF_TRIM";

export default function WorkPlansPage() {
  const [tasks, setTasks] = useState<Record<TabId, OperationRequest[]>>({
    TREATMENT: [], INSEMINATION: [], VACCINATION: [], HOOF_TRIM: []
  });
  const [stats, setStats] = useState<Record<TabId, CategoryStats>>({
    TREATMENT: { total: 0, completed: 0, percent: 0 },
    INSEMINATION: { total: 0, completed: 0, percent: 0 },
    VACCINATION: { total: 0, completed: 0, percent: 0 },
    HOOF_TRIM: { total: 0, completed: 0, percent: 0 }
  });
  
  const [activeTab, setActiveTab] = useState<TabId>("TREATMENT");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [date] = useState(getSystemDate().toISOString().split("T")[0]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/work-plans?date=${date}`);
      const json = await res.json();
      if (json.success) {
        setTasks({
          TREATMENT: json.tasks.TREATMENT || [],
          INSEMINATION: json.tasks.INSEMINATION || [],
          VACCINATION: json.tasks.VACCINATION || [],
          HOOF_TRIM: json.tasks.HOOF_TRIM || [],
        });
        setStats({
          TREATMENT: json.stats.TREATMENT || { total: 0, completed: 0, percent: 0 },
          INSEMINATION: json.stats.INSEMINATION || { total: 0, completed: 0, percent: 0 },
          VACCINATION: json.stats.VACCINATION || { total: 0, completed: 0, percent: 0 },
          HOOF_TRIM: json.stats.HOOF_TRIM || { total: 0, completed: 0, percent: 0 },
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [date]);

  const generateMockData = async () => {
    setGenerating(true);
    try {
      await fetch("/api/work-plans/generate", { method: "POST" });
      await loadData();
    } finally {
      setGenerating(false);
    }
  };

  const toggleTaskStatus = async (id: string, currentStatus: TaskStatus) => {
    const newStatus = currentStatus === "COMPLETED" ? "CREATED" : "COMPLETED";
    
    // Optimistic update
    setTasks(prev => {
      const next = { ...prev };
      const list = next[activeTab].map(t => t.id === id ? { ...t, status: newStatus as TaskStatus } : t);
      // Re-sort placing completed at the bottom
      next[activeTab] = list.sort((a, b) => {
         const wa = a.status === "COMPLETED" ? 1 : 0;
         const wb = b.status === "COMPLETED" ? 1 : 0;
         return wa - wb;
      });
      return next;
    });
    
    setStats(prev => {
      const next = { ...prev };
      const diff = newStatus === "COMPLETED" ? 1 : -1;
      next[activeTab].completed += diff;
      next[activeTab].percent = next[activeTab].total > 0 ? Math.round((next[activeTab].completed / next[activeTab].total) * 100) : 0;
      return next;
    });

    try {
      await fetch("/api/work-plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus })
      });
    } catch (e) {
      console.error(e);
      loadData(); // Revert on failure
    }
  };

  const tabs: {id: TabId, label: string, icon: string}[] = [
    { id: "TREATMENT", label: "Лечение", icon: "🩺" },
    { id: "INSEMINATION", label: "Воспроизводство", icon: "🧬" },
    { id: "VACCINATION", label: "Вакцинация", icon: "💉" },
    { id: "HOOF_TRIM", label: "Расчистка копыт", icon: "🧲" }
  ];

  const renderProgressBar = (percent: number) => {
    const color = percent === 100 ? "var(--success)" : percent === 0 ? "var(--danger)" : "var(--warning)";
    return (
      <div style={{ width: "100%", height: 6, background: "var(--bg-surface-hover)", borderRadius: 3, overflow: "hidden", marginTop: 12 }}>
        <div style={{ width: `${percent}%`, height: "100%", background: color, transition: "width 0.4s ease-out, background 0.4s" }} />
      </div>
    );
  };

  const renderPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "CRITICAL": return <span className="badge badge-danger">Критично</span>;
      case "HIGH": return <span className="badge badge-warning">Высокий</span>;
      case "MEDIUM": return <span className="badge badge-primary">Средний</span>;
      case "LOW": return <span className="badge badge-neutral">Низкий</span>;
      default: return null;
    }
  };

  return (
    <AppLayout title="Планы работ">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>📋 Планы работ</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>
            Ежедневные задачи на {new Date(date).toLocaleDateString("ru-RU")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button 
            onClick={generateMockData}
            disabled={generating}
            className="btn btn-ghost"
            style={{ border: "1px dashed var(--border-subtle)", color: "var(--text-secondary)" }}
            title="Для демонстрации"
          >
            {generating ? "⏳ Создаем..." : "✨ Сгенерировать демо-задачи"}
          </button>
          <button onClick={loadData} className="btn btn-secondary">
            🔄 Обновить
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
        {tabs.map(tab => {
          const stat = stats[tab.id] || { total: 0, completed: 0, percent: 0 };
          return (
            <div 
              key={tab.id} 
              className="card" 
              style={{ 
                cursor: "pointer", 
                border: activeTab === tab.id ? "2px solid var(--primary)" : "1px solid var(--border-subtle)",
                transition: "all 0.2s"
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="card-body" style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{tab.icon}</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{tab.label}</span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                    {stat.completed}/{stat.total}
                  </span>
                </div>
                {renderProgressBar(stat.percent)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
             {tabs.find(t => t.id === activeTab)?.icon} Задачи: {tabs.find(t => t.id === activeTab)?.label}
          </span>
          <span className="badge badge-neutral">Всего: {stats[activeTab]?.total || 0}</span>
        </div>
        
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
             <div style={{ padding: 64, textAlign: "center", color: "var(--text-secondary)" }}>⏳ Загрузка задач...</div>
          ) : !tasks[activeTab] || tasks[activeTab].length === 0 ? (
             <div style={{ padding: 64, textAlign: "center" }}>
               <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
               <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Задач нет!</h3>
               <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>На сегодня по этой категории ничего не запланировано.</p>
             </div>
          ) : (
             <div style={{ overflowX: "auto" }}>
               <table style={{ width: "100%", fontSize: 14, textAlign: "left", borderCollapse: "collapse" }}>
                 <thead>
                   <tr style={{ backgroundColor: "var(--bg-surface-hover)", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-subtle)" }}>
                     <th style={{ padding: "12px 24px", width: 50 }}></th>
                     <th style={{ padding: "12px 16px", fontWeight: 500 }}>Животное</th>
                     <th style={{ padding: "12px 16px", fontWeight: 500 }}>Задача</th>
                     <th style={{ padding: "12px 16px", fontWeight: 500 }}>Приоритет</th>
                     <th style={{ padding: "12px 16px", fontWeight: 500 }}>Статус</th>
                   </tr>
                 </thead>
                 <tbody>
                   {tasks[activeTab].map(task => {
                     const isCompleted = task.status === "COMPLETED";
                     return (
                       <tr 
                         key={task.id} 
                         style={{ 
                           borderBottom: "1px solid var(--border-subtle)", 
                           transition: "background-color 0.2s",
                           opacity: isCompleted ? 0.6 : 1,
                           backgroundColor: isCompleted ? "var(--bg-surface-hover)" : "transparent"
                         }}
                       >
                         <td style={{ padding: "16px 24px", textAlign: "center" }}>
                           <input 
                             type="checkbox" 
                             checked={isCompleted}
                             onChange={() => toggleTaskStatus(task.id, task.status)}
                             style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--success)" }}
                           />
                         </td>
                         <td style={{ padding: "16px", fontWeight: 600 }}>
                           <Link href={`/cows/cow-${task.cow?.number || ""}`} style={{ color: "var(--primary)", textDecoration: "none" }}>
                             #{task.cow?.number || "Неизвестно"}
                           </Link>
                           <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 400, marginTop: 4 }}>
                             Группа: {task.cow?.group?.name || "Нет"}
                           </div>
                         </td>
                         <td style={{ padding: "16px", color: "var(--text-primary)" }}>
                           <span style={{ textDecoration: isCompleted ? "line-through" : "none" }}>{task.title}</span>
                           {task.description && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{task.description}</div>}
                         </td>
                         <td style={{ padding: "16px" }}>
                           {renderPriorityBadge(task.priority)}
                         </td>
                         <td style={{ padding: "16px" }}>
                           {isCompleted ? (
                             <span className="badge badge-success" style={{ display: "inline-flex", gap: 4 }}><span style={{fontSize:10}}>✓</span> Выполнено</span>
                           ) : task.status === "IN_PROGRESS" ? (
                             <span className="badge badge-warning">В работе</span>
                           ) : (
                             <span className="badge badge-neutral">Ожидает</span>
                           )}
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
