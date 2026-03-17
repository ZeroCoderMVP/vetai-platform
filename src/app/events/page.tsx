"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { useDateParams } from "@/hooks/useDateParams";



interface UiEvent {
  id: string;
  type: string;
  severity: "danger" | "warning" | "info";
  cow: string;
  group: number;
  description: string;
  details: string;
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Загрузка...</div>}>
      <EventsContent />
    </Suspense>
  );
}

function EventsContent() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [eventsData, setEventsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { dateFrom, dateTo, setDateRange } = useDateParams(7);

  useEffect(() => {
    Promise.all([
      fetch("/api/farm").then((res) => res.json()),
      fetch(`/api/events?from=${dateFrom}&to=${dateTo}&limit=500`).then((res) => res.json()),
    ])
      .then(([farm, events]) => { setData(farm); setEventsData(events); setLoading(false); })
      .catch(() => setLoading(false));
  }, [dateFrom, dateTo]);

  if (loading || !data) {
    return (
      <AppLayout title="События">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">Загрузка...</div>
        </div>
      </AppLayout>
    );
  }

  const kpi = data?.kpi;

  const events: UiEvent[] = (eventsData?.events || []).map((event: any): UiEvent => ({
    id: event.id,
    type: event.title || "event",
    severity: event.severity === "critical" ? "danger" : event.severity === "warning" ? "warning" : "info",
    cow: event.cow?.number || "—",
    group: Number(event.group?.name || 0) || 0,
    description: event.title || "Событие",
    details: event.description || "",
  }));

  const filteredEvents = filter === "all" ? events : events.filter(e => {
    if (filter === "danger") return e.severity === "danger";
    if (filter === "warning") return e.severity === "warning";
    if (filter === "info") return e.severity === "info";
    return true;
  });

  const severityIcon: Record<string, string> = {
    danger: "🔴", warning: "🟡", info: "🔵", success: "🟢"
  };

  if (data?.status === "no_data" && eventsData?.status === "no_data") {
    return (
      <AppLayout title="События">
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">Данные не загружены. События появятся после импорта в SQLite.</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="События" alertCount={kpi.herdAlerts}>
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">🔔 Лента событий</h2>
          <p className="page-subtitle">{events.length} событий · Данные Afimilk</p>
        </div>
        <div className="page-header-actions">
          <DateRangePicker from={dateFrom} to={dateTo} onChange={(f, t) => setDateRange(f, t)} />
        </div>
      </div>

      {/* Фильтр по критичности */}
      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
        {[
          { id: "all", label: "Все", count: events.length },
          { id: "danger", label: "🔴 Критические", count: events.filter(e => e.severity === "danger").length },
          { id: "warning", label: "🟡 Предупреждения", count: events.filter(e => e.severity === "warning").length },
          { id: "info", label: "🔵 Информация", count: events.filter(e => e.severity === "info").length },
        ].map(f => (
          <button key={f.id}
            className={`btn ${filter === f.id ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter(f.id)}
            style={{ fontSize: 12 }}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="event-list" style={{ maxHeight: 600, overflowY: "auto" }}>
            {filteredEvents.map((event, i) => (
              <div key={i} className="event-item" style={{ cursor: "pointer" }} onClick={() => router.push(`/events/${event.id}`)}>
                <span className="event-dot" style={{ 
                  background: event.severity === "danger" ? "var(--danger)" :
                              event.severity === "warning" ? "var(--warning)" :
                              "var(--info)" 
                }} />
                <div className="event-content">
                  <div className="event-text">
                    {severityIcon[event.severity]} <strong>{event.description}</strong> — корова <strong>#{event.cow}</strong>
                  </div>
                  <div className="event-time">Группа {event.group} · {event.details}</div>
                </div>
                <span className={`badge badge-${event.severity}`} style={{ alignSelf: "center", flexShrink: 0 }}>
                  {event.type === "mastitis" ? "Мастит" :
                   event.type === "ketosis" ? "Кетоз" :
                   event.type === "abortion" ? "Аборт" :
                   event.type === "health" ? "Здоровье" :
                   event.type === "digestion" ? "Пищеварение" :
                   event.type === "breed" ? "Осеменение" :
                   event.type === "fresh" ? "Свежая" : event.type}
                </span>
              </div>
            ))}
            {filteredEvents.length === 0 && (
              <div className="empty-state" style={{ padding: "var(--space-8)" }}>
                <div className="empty-state-icon">✅</div>
                <div className="empty-state-text">Нет событий по выбранному фильтру</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
