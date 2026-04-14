"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assigneeId: string;
  cowId: string;
  cow?: { id: string, number: string };
};

const STATUSES = [
  { id: "TODO", label: "К выполнению" },
  { id: "IN_PROGRESS", label: "В работе" },
  { id: "DONE", label: "Готово" }
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = () => {
    setLoading(true);
    fetch("/api/tasks")
      .then(res => res.json())
      .then(json => {
        if (json.success) setTasks(json.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await fetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ action: "UPDATE_STATUS", taskId, payload: { status: newStatus } })
      });
    } catch {
      fetchTasks(); // rollback on error
    }
  };

  return (
    <AppLayout title="Задачи персонала (Task Engine)">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">📝 Задачи и Поручения</h2>
          <p className="page-subtitle">Распределение и контроль задач (Kanban).</p>
        </div>
      </div>

      {loading ? (
        <div>Загрузка доски...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, alignItems: "start" }}>
          {STATUSES.map(statusCol => {
            const colTasks = tasks.filter(t => t.status === statusCol.id);
            return (
              <div key={statusCol.id} style={{ background: "var(--bg-elevated)", padding: 16, borderRadius: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 16 }}>
                  {statusCol.label} ({colTasks.length})
                </h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {colTasks.length === 0 && <div style={{ fontSize: 13, color: "var(--text-tertiary)", textAlign: "center", padding: "20px 0" }}>Пусто</div>}
                  {colTasks.map(task => (
                    <div key={task.id} className="card" style={{ padding: 16, cursor: "grab" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span className={`badge ${task.priority === "CRITICAL" ? "badge-danger" : task.priority === "HIGH" ? "badge-warning" : "badge-neutral"}`}>{task.priority}</span>
                        {task.dueDate && <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>до {new Date(task.dueDate).toLocaleDateString("ru-RU")}</span>}
                      </div>
                      
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{task.description}</div>}
                      
                      {task.cow && (
                        <div style={{ marginBottom: 16 }}>
                          <Link href={`/herd/${task.cow.id}`}>
                            <span className="badge badge-primary">🐄 #{task.cow.number}</span>
                          </Link>
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: 8 }}>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                          👤 {task.assigneeId || "Не назначен"}
                        </div>
                        
                        <select 
                          className="form-input" 
                          style={{ padding: "2px 8px", fontSize: 12, width: "auto" }}
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        >
                          {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
