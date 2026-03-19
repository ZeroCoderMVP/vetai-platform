"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";

type EventDetail = {
  id: string;
  source: string;
  sourceId: string | null;
  timestamp: string;
  type: string | null;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string | null;
  metadata: any | null;
  cow: {
    id: string;
    number: string;
    status: string;
  } | null;
  group: {
    id: string;
    name: string;
  } | null;
};

// Helper to safely parse stringified JSON
const tryParseJSON = (jsonString: string | null) => {
  if (!jsonString) return null;
  try {
    const o = JSON.parse(jsonString);
    if (o && typeof o === "object") return o;
  } catch (e) {
    // Ignore error, return null if not valid JSON
  }
  return null;
};

const dictionary: Record<string, string> = {
  cow: "Номер животного",
  registrationNumber: "Рег. номер (Инвентарный)",
  group: "Группа",
  lactationNumber: "Номер лактации",
  dim: "Дни в доении (DIM)",
  fatProteinRatioS1: "Жир/Белок (Сессия 1)",
  fatProteinRatioS2: "Жир/Белок (Сессия 2)",
  fatProteinRatioS3: "Жир/Белок (Сессия 3)",
  fatProteinRatioS4: "Жир/Белок (Сессия 4)",
  fatProteinRatioS5: "Жир/Белок (Сессия 5)",
  activity: "Активность",
  yield: "Удой",
  conductivity: "Электропроводность",
  scc: "Соматические клетки (SCC)",
  weight: "Вес",
  diagnosis: "Диагноз",
  treatment: "Лечение"
};

const renderJsonAsTable = (data: any) => {
  if (!data || typeof data !== 'object') return String(data);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px", fontSize: "14px" }}>
      {Object.entries(data).map(([key, val]) => {
        if (val === null || val === undefined) return null;
        
        // Skip rendering fatProteinRatio keys if their value is null or empty, to reduce clutter
        if (key.startsWith('fatProteinRatio') && val === null) return null;

        const label = dictionary[key] || key;

        return (
          <div key={key} style={{ display: "contents" }}>
            <div style={{ color: "var(--text-secondary)", fontWeight: 500, padding: "4px 0" }}>{label}</div>
            <div style={{ color: "var(--text-primary)", background: "var(--bg-secondary)", padding: "4px 8px", borderRadius: "4px", wordBreak: "break-all" }}>
              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function EventDetailsPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${id}`);
        const json = await res.json();
        if (json.success) {
          setEvent(json.data);
        } else {
          setError(json.error || "Ошибка загрузки события");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <AppLayout title="Событие">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">Загрузка информации о событии...</div>
        </div>
      </AppLayout>
    );
  }

  if (error || !event) {
    notFound();
  }

  const severityIcon = {
    info: "🔵 Инфо",
    warning: "🟡 Предупреждение",
    critical: "🔴 Критическое"
  };

  const badgeClass = event.severity === "critical" ? "badge-danger" : event.severity === "warning" ? "badge-warning" : "badge-info";

  // Attempt to parse description
  const parsedDescription = tryParseJSON(event.description);
  const displayDescription = parsedDescription || event.description || "—";
  
  // Attempt to parse metadata (if it comes as string)
  const parsedMetadata = typeof event.metadata === 'string' ? tryParseJSON(event.metadata) : event.metadata;

  return (
    <AppLayout title={`Событие: ${event.title}`}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
          <Link href="/events" className="hover-underline" style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            ← Вернуться к ленте событий
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <h2 className="page-title" style={{ margin: 0 }}>Окно события</h2>
            <span className={`badge ${badgeClass}`}>{severityIcon[event.severity]}</span>
            <span className="badge" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>{event.source}</span>
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>
             Зарегистрировано: {new Date(event.timestamp).toLocaleString("ru-RU")}
             {event.sourceId && ` • Внешний ID: ${event.sourceId}`}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          
          {/* Main Info */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
              <span className="card-title" style={{ fontSize: '18px', fontWeight: 'bold' }}>{event.title}</span>
            </div>
            <div className="card-body" style={{ padding: '20px', flexGrow: 1, overflowX: "hidden" }}>
              <h4 style={{ margin: "0 0 16px 0", color: "var(--text-tertiary)", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Детали события</h4>
              {parsedDescription ? renderJsonAsTable(parsedDescription) : (
                <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--text-primary)", wordBreak: "break-word" }}>
                  {displayDescription}
                </p>
              )}
            </div>
          </div>

          {/* Links and Context */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
              <span className="card-title">🔗 Связанные объекты</span>
            </div>
            <div className="card-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {event.cow ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>🐄</span>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--text-tertiary)", textTransform: 'uppercase' }}>Животное</div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: 'var(--primary-600)' }}>Номер {event.cow.number}</div>
                    </div>
                  </div>
                  <Link href={`/herd/${event.cow.id}`} className="btn btn-primary btn-sm">В профиль →</Link>
                </div>
              ) : (
                <div style={{ padding: "16px", background: "var(--bg-secondary)", borderRadius: "8px", display: "flex", gap: "12px", alignItems: "center" }}>
                   <span style={{ fontSize: '24px', opacity: 0.5 }}>🐄</span>
                   <div style={{ color: "var(--text-tertiary)", fontSize: "14px" }}>Животное не привязано</div>
                </div>
              )}

              {event.group ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>🏷️</span>
                    <div>
                      <div style={{ fontSize: "12px", color: "var(--text-tertiary)", textTransform: 'uppercase' }}>Производственная группа</div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: 'var(--primary-600)' }}>{event.group.name}</div>
                    </div>
                  </div>
                  <Link href={`/groups/${event.group.id}`} className="btn btn-primary btn-sm">В группу →</Link>
                </div>
              ) : (
                <div style={{ padding: "16px", background: "var(--bg-secondary)", borderRadius: "8px", display: "flex", gap: "12px", alignItems: "center" }}>
                   <span style={{ fontSize: '24px', opacity: 0.5 }}>🏷️</span>
                   <div style={{ color: "var(--text-tertiary)", fontSize: "14px" }}>Группа не привязана</div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Metadata Details */}
        {parsedMetadata && Object.keys(parsedMetadata).length > 0 && (
          <div className="card">
            <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <span className="card-title" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>⚙️ Внутренние технические параметры (Метаданные)</span>
            </div>
            <div className="card-body" style={{ padding: '20px', overflowX: "auto" }}>
              {renderJsonAsTable(parsedMetadata)}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
