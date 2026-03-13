"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import DateRangePicker from "@/components/ui/DateRangePicker";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}
function getDaysAgo(days: number): string {
  const d = new Date(); d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export default function EventsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState(getDaysAgo(7));
  const [dateTo, setDateTo] = useState(getToday());

  useEffect(() => {
    fetch("/api/farm")
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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

  const { afimilk, kpi } = data;

  // Формируем единый список событий
  interface FarmEvent {
    type: string;
    severity: "danger" | "warning" | "info" | "success";
    cow: string;
    group: number;
    description: string;
    details: string;
  }

  const events: FarmEvent[] = [];

  afimilk.mastitisSuspects?.items.forEach((i: any) => events.push({
    type: "mastitis", severity: "danger", cow: i.cow, group: i.group,
    description: "Подозрение на клинический мастит",
    details: `Лактация ${i.lactationNumber} · DIM ${i.dim}`
  }));

  afimilk.ketosisSuspects?.items.forEach((i: any) => events.push({
    type: "ketosis", severity: "danger", cow: i.cow, group: i.group,
    description: "Подозрение на кетоз",
    details: `Лактация ${i.lactationNumber} · DIM ${i.dim}`
  }));

  afimilk.abortionSuspects?.items.forEach((i: any) => events.push({
    type: "abortion", severity: "danger", cow: i.cow, group: i.group,
    description: "Подозрение на аборт",
    details: `${i.gynStatus} · Лактация ${i.lactationNumber} · DIM ${i.dim}`
  }));

  afimilk.healthIssues?.items
    .filter((i: any) => (i.yieldLast24HPercent ?? 0) < -30)
    .forEach((i: any) => events.push({
      type: "health", severity: "warning", cow: i.cow, group: i.group,
      description: `Резкое падение надоя (${i.yieldLast24HPercent}%)`,
      details: `${i.status} · Лактация ${i.lactationNumber} · DIM ${i.dim}`
    }));

  afimilk.digestionProblems?.items.forEach((i: any) => events.push({
    type: "digestion", severity: "warning", cow: i.cow, group: i.group,
    description: "Проблемы пищеварения",
    details: `${i.status} · Лактация ${i.lactationNumber} · DIM ${i.dim}`
  }));

  afimilk.animalsToBreed?.items
    .filter((i: any) => (i.daysAfterHeat ?? 999) <= 1)
    .forEach((i: any) => events.push({
      type: "breed", severity: "info", cow: i.cow, group: i.group,
      description: "Готова к осеменению (активная охота)",
      details: `Ср. надой ${i.dailyAverageYield} кг · DIM ${i.dim}`
    }));

  afimilk.freshCows?.items.forEach((i: any) => events.push({
    type: "fresh", severity: "info", cow: i.cow, group: i.group,
    description: "Свежая корова — требуется проверка",
    details: `Лактация ${i.lactationNumber} · DIM ${i.dim}`
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

  return (
    <AppLayout title="События" alertCount={kpi.herdAlerts}>
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">🔔 Лента событий</h2>
          <p className="page-subtitle">{events.length} событий · Данные Afimilk</p>
        </div>
        <div className="page-header-actions">
          <DateRangePicker from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
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
              <div key={i} className="event-item" style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${event.cow}`)}>
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
