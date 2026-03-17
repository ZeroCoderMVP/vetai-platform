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
    critical: "🔴 Кривое событие"
  };

  const badgeClass = event.severity === "critical" ? "badge-danger" : event.severity === "warning" ? "badge-warning" : "badge-info";

  return (
    <AppLayout title={`Событие: ${event.title}`}>
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/events" className="text-gray-500 hover:text-black transition-colors">
            ← К ленте событий
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Карточка события</h2>
        </div>

        <div className="grid-2">
          {/* Main Info */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📝 Описание</span>
              <span className={`badge ${badgeClass}`}>{severityIcon[event.severity]}</span>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Заголовок:</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{event.title}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Детали:</div>
                  <div style={{ fontSize: 14 }}>{event.description || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Дата регистрации:</div>
                  <div style={{ fontSize: 14 }}>{new Date(event.timestamp).toLocaleString("ru-RU")}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Источник:</div>
                  <div style={{ fontSize: 14 }}>{event.source} {event.sourceId && `(ID: ${event.sourceId})`}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🔗 Связанные объекты</span>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {event.cow ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "var(--space-2)", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Животное:</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>Номер {event.cow.number}</div>
                    </div>
                    <Link href={`/herd/${event.cow.id}`} className="btn btn-outline btn-sm">В профиль →</Link>
                  </div>
                ) : (
                  <div style={{ paddingBottom: "var(--space-2)", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Животное:</span>
                    <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>Не привязано</div>
                  </div>
                )}

                {event.group ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "var(--space-2)", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Группа:</div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{event.group.name}</div>
                    </div>
                    <Link href={`/groups/${event.group.id}`} className="btn btn-outline btn-sm">В группу →</Link>
                  </div>
                ) : (
                  <div style={{ paddingBottom: "var(--space-2)" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Группа:</span>
                    <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>Не привязано</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Details */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="card" style={{ marginTop: "var(--space-4)" }}>
            <div className="card-header">
              <span className="card-title">📄 Метаданные (Техническая часть)</span>
            </div>
            <div className="card-body">
              <pre style={{ background: "var(--bg-elevated)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", fontSize: 12, overflowX: "auto" }}>
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
