"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";

export default function InboxPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });

  const fetchInbox = () => {
    setLoading(true);
    fetch("/api/inbox")
      .then(res => res.json())
      .then(json => {
        if(json.success) setEvents(json.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkAction = async (action: "APPROVE" | "REJECT") => {
    if (selectedIds.size === 0) return;
    try {
      await fetch("/api/inbox", {
        method: "POST",
        body: JSON.stringify({ action, eventIds: Array.from(selectedIds) })
      });
      setSelectedIds(new Set());
      fetchInbox();
    } catch(err) {
      alert("Ошибка выполнения действия");
    }
  };

  const startEdit = (e: any) => {
    setEditEventId(e.id);
    setEditForm({ title: e.title, description: e.description || "" });
  };

  const saveEdit = async () => {
    try {
      await fetch("/api/inbox", {
        method: "POST",
        body: JSON.stringify({ action: "EDIT_APPROVE", eventIds: [editEventId], updates: editForm })
      });
      setEditEventId(null);
      fetchInbox();
    } catch(err) {
      alert("Ошибка сохранения");
    }
  };

  return (
    <AppLayout title="Инбокс (Входящие события)">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">📥 Инбокс Валидации</h2>
          <p className="page-subtitle">Входящие события из мобильного приложения и внешних систем, требующие ручного подтверждения (ручной ввод, аномалии).</p>
        </div>
        
        {selectedIds.size > 0 && (
          <div className="page-header-actions" style={{ background: "var(--bg-elevated)", padding: "10px 16px", borderRadius: "100px", border: "1px solid var(--primary-400)" }}>
            <span style={{ fontSize: 13, marginRight: 16 }}>Выбрано: <strong>{selectedIds.size}</strong></span>
            <button className="btn btn-primary btn-sm" onClick={() => handleBulkAction("APPROVE")}>✔️ Подтвердить все (Approve)</button>
            <button className="btn btn-danger btn-sm" onClick={() => handleBulkAction("REJECT")}>❌ Отклонить (Reject)</button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: "var(--space-6)", textAlign: "center" }}>Загрузка...</div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">Инбокс пуст. Нет событий, требующих модерации.</div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}><input type="checkbox" onClick={(e:any) => {
                      if(e.target.checked) setSelectedIds(new Set(events.map(ev => ev.id)));
                      else setSelectedIds(new Set());
                    }} /></th>
                    <th>Время</th>
                    <th>Объект</th>
                    <th>Событие (Что произошло?)</th>
                    <th>Источник</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => {
                    const isEditing = editEventId === e.id;
                    return (
                      <tr key={e.id} style={{ background: selectedIds.has(e.id) ? "rgba(15, 168, 122, 0.05)" : "transparent" }}>
                        <td>
                          <input type="checkbox" checked={selectedIds.has(e.id)} onChange={() => toggleSelect(e.id)} />
                        </td>
                        <td>{new Date(e.timestamp).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute:"2-digit" })}</td>
                        <td>
                          {e.cow ? (
                            <Link href={`/herd/${e.cow.id}`}><span className="badge badge-primary">🐄 #{e.cow.number}</span></Link>
                          ) : e.group ? (
                            <span className="badge badge-neutral">👥 {e.group.name}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 300 }}>
                              <input type="text" className="form-input" value={editForm.title} onChange={(ev) => setEditForm({...editForm, title: ev.target.value})} />
                              <input type="text" className="form-input" value={editForm.description} onChange={(ev) => setEditForm({...editForm, description: ev.target.value})} placeholder="Описание..." />
                            </div>
                          ) : (
                            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                               <span style={{ width: 8, height: 8, borderRadius: "50%", background: e.severity === "warning" ? "var(--warning)" : "var(--info)", marginRight: 8, flexShrink: 0 }}></span>
                               <div>
                                 <div style={{ fontWeight: 600 }}>{e.title}</div>
                                 <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{e.description}</div>
                                 {e.metadata && <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color:"var(--text-tertiary)", marginTop: 4 }}>{e.metadata}</div>}
                               </div>
                            </div>
                          )}
                        </td>
                        <td><span className="badge" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>{e.source}</span></td>
                        <td>
                          {isEditing ? (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button className="btn btn-sm btn-primary" onClick={saveEdit}>Сохранить & Approve</button>
                              <button className="btn btn-sm btn-ghost" onClick={() => setEditEventId(null)}>Отмена</button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button className="btn btn-sm" style={{ background: "rgba(15,168,122,0.1)", color: "var(--primary-500)", border: "none" }} onClick={async () => {
                                 await fetch("/api/inbox", { method: "POST", body: JSON.stringify({ action: "APPROVE", eventIds: [e.id] }) }); fetchInbox();
                              }}>✓ Ок</button>
                              <button className="btn btn-sm btn-ghost" onClick={() => startEdit(e)}>✏️ Изменить</button>
                            </div>
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
