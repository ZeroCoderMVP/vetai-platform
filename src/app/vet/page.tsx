"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";

export default function VetWorkspacePage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVetTasks = () => {
    setLoading(true);
    fetch("/api/tasks")
      .then(res => res.json())
      .then(json => {
        if(json.success) {
           // Filter for demo: only high priority or specific assignee "Ветврач Иванов"
           const vetTasks = json.data.filter((t: any) => t.assigneeId === "Ветврач Иванов" || t.title.toLowerCase().includes("осмотр") || t.title.toLowerCase().includes("мастит") || t.title.toLowerCase().includes("кровь"));
           setTasks(vetTasks);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVetTasks();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await fetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ action: "UPDATE_STATUS", taskId, payload: { status: newStatus } })
      });
    } catch {
      fetchVetTasks();
    }
  };

  return (
    <AppLayout title="Рабочее место специалиста: Здоровье">
      <div className="page-header" style={{ borderLeft: "8px solid var(--primary-500)", paddingLeft: 16 }}>
        <div className="page-header-left">
          <h2 className="page-title">🩺 Ветврач: Задачи и Осмотры</h2>
          <p className="page-subtitle">Персональная очередь животных, требующих внимания по здоровью и воспроизводству.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
           <h3 className="card-title">Очередь работы на сегодня</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
             <div style={{ padding: 24, textAlign: "center" }}>Загрузка пациентов...</div>
          ) : tasks.length === 0 ? (
             <div className="empty-state">
               <div className="empty-state-icon">🎉</div>
               <div className="empty-state-text">Очередь пуста. Все животные осмотрены!</div>
             </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Животное</th>
                    <th>Приоритет</th>
                    <th>Диагноз / Поручение</th>
                    <th>Срок</th>
                    <th>Статус выполнения</th>
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t.id}>
                      <td>
                        {t.cow ? (
                           <Link href={`/herd/${t.cow.id}`}><span className="badge badge-primary" style={{ fontSize: 13, padding: "6px 10px" }}>🐄 #{t.cow.number}</span></Link>
                        ) : "Без привязки"}
                      </td>
                      <td>
                        <span className={`badge ${t.priority === "CRITICAL" ? "badge-danger" : t.priority === "HIGH" ? "badge-warning" : "badge-neutral"}`}>{t.priority}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.title}</div>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t.description}</div>
                      </td>
                      <td>
                        {t.dueDate ? (
                           <span style={{ color: new Date(t.dueDate) < new Date() && t.status !== "DONE" ? "var(--danger)" : "inherit" }}>
                             {new Date(t.dueDate).toLocaleString("ru-RU", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                           </span>
                        ) : "—"}
                      </td>
                      <td>
                        <select 
                          className="form-input" 
                          value={t.status}
                          onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        >
                          <option value="TODO">Ожидает осмотра</option>
                          <option value="IN_PROGRESS">В процессе лечения</option>
                          <option value="DONE">Осмотрено / Здорова</option>
                        </select>
                      </td>
                      <td>
                        <Link href={`/herd/${t.cow?.id}`} className="btn btn-sm btn-ghost">Открыть историю</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
