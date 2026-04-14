"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { SourceChip } from "@/components/ui/SourceChip";
import { TrustBadge, TrustStatus } from "@/components/ui/TrustBadge";

type IntegrationBatch = {
  id: string;
  source: string;
  status: string;
  filename: string;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordCount: number;
  errorMessage: string | null;
  createdAt: string;
  finishedAt: string | null;
};

type DataSource = {
  id: string;
  name: string;
  type: string;
  status: string;
  lastSync: string | null;
  batches: IntegrationBatch[];
};

export default function SyncCenterPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [stats, setStats] = useState({ pendingCount: 0, errorCount: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncData = () => {
    setLoading(true);
    fetch("/api/sync")
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки данных синхронизации");
        return res.json();
      })
      .then((data) => {
        setSources(data.sources || []);
        if (data.stats) setStats(data.stats);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSyncData();
  }, []);

  const handleToggleSource = async (sourceId: string, currentStatus: string) => {
    if (!confirm(`Вы действительно хотите ${currentStatus === "active" ? "отключить" : "включить"} этот коннектор?`)) return;
    try {
      await fetch("/api/sync", {
        method: "POST",
        body: JSON.stringify({ action: "TOGGLE_SOURCE", sourceId, status: currentStatus === "active" ? "inactive" : "active" })
      });
      fetchSyncData();
    } catch(err) {
      alert("Ошибка конфигурации коннектора");
    }
  };

  const handleUndoBatch = async (batchId: string) => {
    if (!confirm("Внимание! Это откатит загруженные данные этого батча. Продолжить?")) return;
    try {
      await fetch("/api/sync", {
        method: "POST",
        body: JSON.stringify({ action: "UNDO_BATCH", batchId })
      });
      fetchSyncData();
    } catch(err) {
      alert("Ошибка отката батча");
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/import", { method: "POST" });
      if (!res.ok) throw new Error("Ошибка запуска импорта");
      await fetchSyncData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getTargetSourceChip = (sourceName: string) => {
    if (sourceName === "afimilk") return <SourceChip source="AfiFarm" />;
    if (sourceName === "dtm") return <SourceChip source="DTM" />;
    if (sourceName === "aic") return <SourceChip source="System" />; // AIC uses system
    return <SourceChip source="System" />;
  };

  const getSourceStatus = (source: DataSource): TrustStatus => {
    if (source.status === "error") return "Conflict";
    const lastBatch = source.batches?.[0];
    if (lastBatch?.status === "error") return "Conflict";
    if (source.status === "active") return "Verified";
    return "Unconfirmed";
  };

  const allRecentBatches = sources.flatMap((s) => s.batches).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <AppLayout title="Центр Синхронизации (Sync Center)">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">🔄 Центр Синхронизации</h2>
          <p className="page-subtitle">Внешние интеграции: статусы, ошибки импорта и очереди данных</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleSyncNow} disabled={syncing}>
            {syncing ? "⏳ Синхронизация..." : "▶ Синхронизировать сейчас"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "1rem", color: "var(--danger)", background: "rgba(229, 72, 77, 0.1)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-4)" }}>
          {error}
        </div>
      )}

      {/* KPI карточки источников */}
      <div className="grid-3">
        {sources.length === 0 && loading ? (
           <p style={{ color: "var(--text-secondary)" }}>Загрузка источников...</p>
        ) : sources.length === 0 ? (
           <p style={{ color: "var(--text-secondary)" }}>Источники не настроены.</p>
        ) : sources.map((source) => {
          const statusBadge = getSourceStatus(source);
          const errorsCount = source.batches.filter((b) => b.status === "error").length;

          return (
            <div key={source.id} className={`card ${statusBadge === "Conflict" ? "border-critical" : ""} ${source.status === "inactive" ? "opacity-50" : ""}`}>
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="card-title">{getTargetSourceChip(source.name)}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <TrustBadge status={source.status === "inactive" ? "Unconfirmed" : statusBadge} />
                  <button 
                    className={`btn btn-sm ${source.status === "active" ? "btn-danger" : "btn-primary"}`}
                    onClick={() => handleToggleSource(source.id, source.status)}
                  >
                    {source.status === "active" ? "Выкл" : "Вкл"}
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Последняя синхронизация:</span>
                    <strong style={{ fontSize: 13 }}>{formatDate(source.lastSync)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Ошибок (из 5 последних):</span>
                    <strong style={{ fontSize: 13, color: errorsCount > 0 ? "var(--danger)" : "var(--success)" }}>{errorsCount}</strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Очередь и Ошибки */}
      <div className="card" style={{ marginTop: "var(--space-6)" }}>
        <div className="card-header">
          <span className="card-title">📖 История импортов (Integration Batches)</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Источник</th>
                  <th>Файл</th>
                  <th>Статус</th>
                  <th>Обработано</th>
                  <th>Ошибки</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {allRecentBatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--text-secondary)" }}>Нет истории импортов</td>
                  </tr>
                ) : (
                  allRecentBatches.map((batch) => (
                    <tr key={batch.id}>
                      <td>{formatDate(batch.createdAt)}</td>
                      <td>{getTargetSourceChip(batch.source)}</td>
                      <td><span style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{batch.filename}</span></td>
                      <td>
                        <span className={`badge ${batch.status === "completed" ? "badge-success" : batch.status === "error" ? "badge-danger" : batch.status === "undone" ? "badge-neutral" : "badge-warning"}`}>
                          {batch.status === "completed" ? "✅ Успех" : batch.status === "error" ? "❌ Ошибка" : batch.status === "undone" ? "↩️ Откачен" : "⏳ В процессе"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          {batch.recordsInserted} добав. / {batch.recordsUpdated} обнов.
                        </span>
                      </td>
                      <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {batch.errorMessage ? (
                           <span style={{ color: "var(--danger)", fontSize: "11px", cursor: "help" }} title={batch.errorMessage}>
                             {batch.errorMessage}
                           </span>
                        ) : (
                           <span style={{ color: "var(--success)" }}>—</span>
                        )}
                      </td>
                      <td>
                        {batch.status !== "undone" && (
                          <button className="btn btn-sm btn-ghost" style={{ color: "var(--danger)" }} onClick={() => handleUndoBatch(batch.id)}>
                            Сбросить
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
