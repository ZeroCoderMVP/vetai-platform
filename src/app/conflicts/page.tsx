"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";

const ATTR_TRANSLATIONS: Record<string, string> = {
  calfWeight: "Вес теленка (кг)",
  ease: "Оценка отёла (1-5)",
  calvesCount: "Кол-во телят",
  notes: "Заметки оператора",
  deviceId: "ID терминала",
  doctor: "Ветврач",
  confidenceScore: "Уверенность ИИ (%)"
};

const renderMetadata = (metadataStr: string) => {
  try {
    const meta = JSON.parse(metadataStr || "{}");
    if (Object.keys(meta).length === 0) return null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--bg-elevated)", padding: 12, borderRadius: 8, border: "1px dashed var(--border-secondary)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Технические атрибуты</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Object.entries(meta).map(([k, v]) => {
            const label = ATTR_TRANSLATIONS[k] || k;
            return (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, borderBottom: "1px dotted var(--border-subtle)", paddingBottom: 4 }}>
                <span style={{ color: "var(--text-secondary)" }}>
                  {label} <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.4, marginLeft: 4 }}>({k})</span>
                </span>
                <span style={{ fontWeight: 600, color: "var(--primary-600)" }}>{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  } catch {
    return <div style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--bg-elevated)", padding: 8, borderRadius: 4 }}>{metadataStr}</div>;
  }
};

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<any[][]>([]);
  const [loading, setLoading] = useState(true);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  const fetchConflicts = () => {
    setLoading(true);
    fetch("/api/conflicts")
      .then(res => res.json())
      .then(json => {
        if(json.success) setConflicts(json.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConflicts();
  }, []);

  const handleResolve = async (key: string, winnerId: string, loserId: string) => {
    const note = resolutionNotes[key] || "";
    if (!note.trim()) {
      alert("Необходимо указать комментарий (причину) разрешения конфликта!");
      return;
    }

    try {
      await fetch("/api/conflicts", {
        method: "POST",
        body: JSON.stringify({ action: "RESOLVE", dedupeKey: key, winnerId, loserId, resolutionNote: note })
      });
      // Clear note and refresh
      setResolutionNotes(prev => { const next = {...prev}; delete next[key]; return next; });
      fetchConflicts();
    } catch(err) {
      alert("Ошибка сети");
    }
  };

  return (
    <AppLayout title="Центр конфликтов (Data Conflicts)">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">⚔️ Разрешение Конфликтов</h2>
          <p className="page-subtitle">События по одному ключу (dedupeKey), пришедшие из разных источников и противоречащие друг другу.</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {loading ? (
          <div>Загрузка конфликтов...</div>
        ) : conflicts.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-state-icon">🕊️</div>
            <div className="empty-state-text">Споров нет. Системы согласны друг с другом.</div>
          </div>
        ) : (
          conflicts.map((pair, idx) => {
            const key = pair[0].dedupeKey || pair[0].id;
            const cow = pair[0].cow;
             
            return (
              <div key={key} className="card" style={{ borderLeft: "4px solid var(--warning)" }}>
                <div className="card-header" style={{ paddingBottom: 12 }}>
                  <h3 className="card-title" style={{ fontSize: 16 }}>
                    Конфликт #{idx + 1} по животному 
                    <Link href={`/herd/${cow?.id}`}><span className="badge badge-primary" style={{ marginLeft: 8 }}>🐄 #{cow?.number}</span></Link>
                  </h3>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>Ключ дедупликации: <code>{key}</code></div>
                </div>

                <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {pair.map((ev, i) => {
                    const otherEv = pair[i === 0 ? 1 : 0];
                    return (
                      <div key={ev.id} style={{ border: "1px solid var(--border-subtle)", borderRadius: 8, padding: 16, background: "var(--bg-surface)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                          <span className="badge" style={{ background: "var(--bg-elevated)" }}>Источник: {ev.source}</span>
                          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{new Date(ev.timestamp).toLocaleString("ru-RU")}</span>
                        </div>
                        
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{ev.title}</div>
                          <div style={{ fontSize: 14 }}>{ev.description}</div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                          {renderMetadata(ev.metadata)}
                        </div>

                        <button 
                          className="btn" 
                          style={{ 
                            width: "100%", 
                            background: "var(--primary-50)", 
                            color: "var(--primary-700)", 
                            border: "1px solid var(--primary-200)",
                            fontWeight: 600,
                            padding: "10px 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--primary-500)"; e.currentTarget.style.color = "white"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--primary-50)"; e.currentTarget.style.color = "var(--primary-700)"; }}
                          onClick={() => handleResolve(key, ev.id, otherEv?.id)}
                        >
                          🥇 Принять эту версию
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                <div className="card-body" style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border-subtle)", padding: "20px 24px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: "600px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                      <span style={{ fontSize: 16 }}>📝</span> Обоснование выбора (Resolution Note) *
                    </label>
                    <textarea 
                      className="form-input" 
                      style={{ minHeight: "80px", resize: "vertical", fontSize: 14, padding: "12px 14px", lineHeight: "1.5" }}
                      placeholder="Укажите причину выбора той или иной версии (например: Система DTM дает более точный вес...)" 
                      value={resolutionNotes[key] || ""}
                      onChange={(e) => setResolutionNotes(prev => ({...prev, [key]: e.target.value}))}
                    />
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                      Комментарий будет сохранён в аудит-логе и доступен другим сотрудникам.
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </AppLayout>
  );
}
