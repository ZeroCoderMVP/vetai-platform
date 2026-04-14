"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";

export default function OutboxPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOutbox = () => {
    setLoading(true);
    fetch("/api/outbox")
      .then(res => res.json())
      .then(json => {
        if(json.success) setMessages(json.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOutbox();
  }, []);

  const handleAction = async (action: string, id?: string) => {
    try {
      await fetch("/api/outbox", {
        method: "POST",
        body: JSON.stringify(id ? { action, messageId: id } : { action })
      });
      fetchOutbox();
    } catch(err) {
      alert("Ошибка действия");
    }
  };

  const failedCount = messages.filter(m => m.status === "FAILED").length;

  return (
    <AppLayout title="Исходящие (Outbox)">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">📤 Исходящие (Writeback)</h2>
          <p className="page-subtitle">Очередь сообщений на отправку во внешние системы (AfiFarm, DTM и др.). Механизм повторов при ошибках.</p>
        </div>
        
        {failedCount > 0 && (
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={() => handleAction("RETRY_ALL_FAILED")}>
              ↻ Retry All Failed ({failedCount})
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: "var(--space-6)", textAlign: "center" }}>Загрузка...</div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">Очередь пуста.</div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Статус</th>
                    <th>Целевая Система</th>
                    <th>Полезная нагрузка (Payload)</th>
                    <th>Попытки</th>
                    <th>Ошибка (Verbose Log)</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((m) => {
                    let statusBadge = "badge-neutral";
                    if (m.status === "FAILED") statusBadge = "badge-danger";
                    if (m.status === "ACKNOWLEDGED") statusBadge = "badge-success";
                    if (m.status === "PENDING") statusBadge = "badge-warning";
                    
                    return (
                      <tr key={m.id}>
                        <td><span className={`badge ${statusBadge}`}>{m.status}</span></td>
                        <td><span className="badge" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>{m.dataSource.name.toUpperCase()}</span></td>
                        <td>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--bg-elevated)", padding: "4px 8px", borderRadius: 4, whiteSpace: "pre-wrap", maxWidth: 350 }}>
                            {m.payloadJson}
                          </div>
                        </td>
                        <td>{m.attempts}</td>
                        <td style={{ color: "var(--danger)", fontSize: 12, maxWidth: 200, wordWrap: "break-word" }}>
                           {m.errorMessage || "—"}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            {m.status === "FAILED" && (
                              <button className="btn btn-sm btn-primary" onClick={() => handleAction("RETRY", m.id)}>↻ Повторить</button>
                            )}
                            {(m.status === "FAILED" || m.status === "PENDING") && (
                              <button className="btn btn-sm btn-danger" onClick={() => handleAction("CANCEL", m.id)}>Отменить</button>
                            )}
                          </div>
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
