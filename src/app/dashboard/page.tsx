"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { useDateParams } from "@/hooks/useDateParams";

interface DashboardData {
  status?: string;
  feeding: {
    totalPlanned: number;
    totalActual: number;
    totalRemainder: number;
    totalDryMatter: number;
    efficiency: number;
    avgIOFC: number | null;
    totalFeedCost: number;
    totalHeadCount: number;
    recordCount: number;
    groupCount: number;
  };
  milking: {
    totalYield: number;
    avgYield: number;
    cowCount: number;
    recordCount: number;
  };
  groups: Array<{
    id: string | null;
    name: string;
    planned: number;
    actual: number;
    remainder: number;
    headCount: number;
    iofc: number | null;
    feedCost: number | null;
    groupType: string;
    efficiency: number;
    count: number;
  }>;
  daily: Array<{
    date: string;
    planned: number;
    actual: number;
    remainder: number;
  }>;
  mixBatches: number;
  ingredients: number;
  events: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    timestamp: string;
  }>;
}

interface FarmData {
  status?: string;
  kpi: {
    totalMilkToday: number;
    averageMilkPerCow: number;
    milkingCows: number;
    milkDate: string;
    herdAlerts: number;
    healthIssues: number;
    heatSuspects: number;
    toBreed: number;
    calving: number;
    freshCows: number;
    mastitisSuspects: number;
    ketosisSuspects: number;
    digestionProblems: number;
    lastUpdate: string;
  };
  totalAnimals: number;
  afimilk: any;
  milkingSummary: any;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatNum(n: number): string {
  return n.toLocaleString("ru-RU");
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}


// Enhanced bar chart component using CSS
function SimpleBarChart({ data, maxValue, onRowClick }: { data: Array<{ id?: string, label: string; value: number; target?: number; subValue?: string; color?: string }>; maxValue: number, onRowClick?: (id: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {data.map((item, i) => {
        const valuePct = maxValue > 0 ? Math.min((item.value / maxValue) * 100, 100) : 0;
        const targetPct = item.target && maxValue > 0 ? Math.min((item.target / maxValue) * 100, 100) : 0;
        
        return (
          <div 
            key={i} 
            style={{ 
              display: "flex", alignItems: "center", gap: "var(--space-3)", 
              cursor: item.id && onRowClick ? "pointer" : "default" 
            }}
            onClick={() => {
              if (item.id && onRowClick) onRowClick(item.id);
            }}
            className={item.id && onRowClick ? "hover:bg-white/5 transition-colors p-1 -mx-1 rounded-md" : ""}
          >
            <div style={{ width: 130, display: "flex", flexDirection: "column", flexShrink: 0, textAlign: "right" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: item.id && onRowClick ? "var(--primary-400)" : "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
              {item.subValue && <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{item.subValue}</span>}
            </div>
            
            <div style={{ flex: 1, position: "relative", height: 28, background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
              {/* Actual value bar */}
              <div style={{
                width: `${valuePct}%`,
                height: "100%",
                background: item.color || "var(--primary-400)",
                borderRadius: "var(--radius-sm)",
                transition: "width 0.6s ease",
                minWidth: item.value > 0 ? 4 : 0,
              }} />
              
              {/* Target marker */}
              {item.target && targetPct > 0 && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${targetPct}%`,
                  width: 3,
                  background: "var(--text-primary)",
                  boxShadow: "0 0 4px rgba(0,0,0,0.3)",
                  zIndex: 2,
                  transform: "translateX(-50%)"
                }} title={`План: ${formatNum(item.target)} кг`} />
              )}
            </div>
            
            <div style={{ width: 80, display: "flex", flexDirection: "column", flexShrink: 0, textAlign: "right" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{formatNum(item.value)} кг</span>
              {item.target && (
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>факт / из {formatNum(item.target)}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Sparkline mini chart
function SparkLine({ data, color = "var(--primary-400)" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 40;
  const w = 120;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Загрузка...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [farmData, setFarmData] = useState<FarmData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { dateFrom, dateTo, setDateRange } = useDateParams(30);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/dashboard").then(r => r.json()).catch(() => null),
      fetch("/api/farm").then(r => r.json()).catch(() => null),
    ]).then(([dashData, farm]) => {
      if (dashData && !dashData.error) setData(dashData);
      if (farm && !farm.error) setFarmData(farm);
      setLoading(false);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDateChange = (from: string, to: string) => {
    setDateRange(from, to);
  };

  if (loading) {
    return (
      <AppLayout title="Дашборд">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">Загрузка данных фермы...</div>
        </div>
      </AppLayout>
    );
  }

  const kpi = farmData?.kpi;
  const feed = data?.feeding;
  const milk = farmData?.milkingSummary || data?.milking;
  const hasNoData = data?.status === "no_data" && farmData?.status === "no_data";


  if (hasNoData) {
    return (
      <AppLayout title="Дашборд">
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">Данные не загружены. Импортируйте файлы в SQLite через /data/inbox/* и запустите импорт.</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Дашборд" alertCount={kpi?.herdAlerts || 0}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">🏠 Пульт управления фермой</h2>
          <p className="page-subtitle">
            Данные: {kpi ? `обновлены ${formatDate(kpi.lastUpdate)}` : "DTM + система"}
          </p>
        </div>
        <div className="page-header-actions">
          <DateRangePicker from={dateFrom} to={dateTo} onChange={handleDateChange} />
          <button className="btn btn-primary" onClick={loadData}>🔄 Обновить</button>
        </div>
      </div>

      {/* KPI Cards Row 1 — Ключевые показатели */}
      <div className="kpi-grid">
        {/* Надой */}
        <div className="kpi-card green" style={{ cursor: "pointer" }} onClick={() => router.push(`/milk-balance?from=${dateFrom}&to=${dateTo}`)}>
          <div className="kpi-header">
            <span className="kpi-label">Надой за сессию</span>
            <div className="kpi-icon green">🥛</div>
          </div>
          <div className="kpi-value">
            {kpi ? formatNum(kpi.totalMilkToday) : milk?.totalYield ? formatNum(milk.totalYield) : "—"}
            <span className="kpi-unit">кг</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-2)" }}>
            <span className="kpi-change neutral">
              {kpi ? `${kpi.milkingCows} коров · ${kpi.averageMilkPerCow.toFixed(1)} кг/гол` : `${milk?.cowCount || 0} коров`}
            </span>
            {data?.daily && <SparkLine data={data.daily.map(d => d.actual)} />}
          </div>
        </div>

        {/* Кормление */}
        <div className="kpi-card blue" style={{ cursor: "pointer" }} onClick={() => router.push(`/feeding?from=${dateFrom}&to=${dateTo}`)}>
          <div className="kpi-header">
            <span className="kpi-label">Подано корма</span>
            <div className="kpi-icon blue">🌾</div>
          </div>
          <div className="kpi-value">
            {feed ? formatNum(feed.totalActual) : "—"}
            <span className="kpi-unit">кг</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-2)" }}>
            <span className={`kpi-change ${feed && feed.efficiency >= 95 ? "positive" : feed && feed.efficiency > 0 ? "negative" : "neutral"}`}>
              {feed ? `${feed.efficiency}% эфф.` : "—"} · План {feed ? formatNum(feed.totalPlanned) : "—"}
            </span>
          </div>
        </div>

        {/* Доход минус корм */}
        <div className="kpi-card purple" style={{ cursor: "pointer" }} onClick={() => router.push(`/feeding?from=${dateFrom}&to=${dateTo}`)}>
          <div className="kpi-header">
            <span className="kpi-label">Дох−корм ср.</span>
            <div className="kpi-icon purple">💰</div>
          </div>
          <div className="kpi-value">
            {feed?.avgIOFC ? `${feed.avgIOFC > 0 ? "+" : ""}${feed.avgIOFC.toFixed(0)}` : "—"}
            <span className="kpi-unit">₽</span>
          </div>
          <span className={`kpi-change ${feed?.avgIOFC && feed.avgIOFC > 0 ? "positive" : "negative"}`}>
            {feed?.avgIOFC ? (feed.avgIOFC > 0 ? "▲ Прибыль на голову" : "▼ Убыток на голову") : "Нет данных"}
          </span>
        </div>

        {/* Поголовье */}
        <div className="kpi-card amber" style={{ cursor: "pointer" }} onClick={() => router.push("/herd")}>
          <div className="kpi-header">
            <span className="kpi-label">Поголовье</span>
            <div className="kpi-icon amber">🐄</div>
          </div>
          <div className="kpi-value">
            {farmData?.totalAnimals || feed?.totalHeadCount || "—"}
            <span className="kpi-unit">голов</span>
          </div>
          <span className="kpi-change neutral">
            {feed ? `${feed.groupCount} групп · ${feed.recordCount} записей` : "—"}
          </span>
        </div>

        {/* Тревоги здоровья */}
        <div className="kpi-card danger" style={{ cursor: "pointer" }} onClick={() => router.push("/health")}>
          <div className="kpi-header">
            <span className="kpi-label">Тревоги здоровья</span>
            <div className="kpi-icon" style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}>⚕️</div>
          </div>
          <div className="kpi-value">{kpi?.herdAlerts || 0}</div>
          <span className="kpi-change negative">
            {kpi ? `${kpi.mastitisSuspects} мастит · ${kpi.ketosisSuspects} кетоз` : "Нет данных от AfiFarm"}
          </span>
        </div>

        {/* --- Row 2: Sub-cards --- */}

        {/* Воспроизводство */}
        <div className="kpi-card orange" style={{ cursor: "pointer" }} onClick={() => router.push("/reproduction")}>
          <div className="kpi-header">
            <span className="kpi-label">Воспроизводство</span>
            <div className="kpi-icon" style={{ background: "rgba(249,115,22,0.12)", color: "var(--accent-orange)" }}>🧬</div>
          </div>
          <div className="kpi-value">
            {kpi ? `${kpi.heatSuspects}/${kpi.toBreed}` : "—"}
          </div>
          <span className="kpi-change neutral">
            {kpi ? `охота / к осеменению · ${kpi.calving} отёл` : "Нет данных от AfiFarm"}
          </span>
        </div>

        {/* СВ потребление */}
        <div className="kpi-card blue" style={{ cursor: "pointer" }} onClick={() => router.push(`/feeding?from=${dateFrom}&to=${dateTo}`)}>
          <div className="kpi-header">
            <span className="kpi-label">Сухое вещество</span>
            <div className="kpi-icon blue">📦</div>
          </div>
          <div className="kpi-value">
            {feed ? formatNum(feed.totalDryMatter) : "—"}
            <span className="kpi-unit">кг</span>
          </div>
          <span className="kpi-change neutral">
            Остаток: {feed ? formatNum(feed.totalRemainder) : "—"} кг
          </span>
        </div>

        {/* Себестоимость */}
        <div className="kpi-card purple" style={{ cursor: "pointer" }} onClick={() => router.push(`/feeding?from=${dateFrom}&to=${dateTo}`)}>
          <div className="kpi-header">
            <span className="kpi-label">Стоимость / голову</span>
            <div className="kpi-icon purple">📊</div>
          </div>
          <div className="kpi-value">
            {feed?.totalFeedCost ? `${Math.round(feed.totalFeedCost / Math.max(feed.totalHeadCount, 1))}` : "—"}
            <span className="kpi-unit">₽</span>
          </div>
          <span className="kpi-change neutral">
            {feed?.totalFeedCost ? `Общая: ${formatNum(Math.round(feed.totalFeedCost))} ₽` : "Нет данных"}
          </span>
        </div>

        {/* Дойные коровы */}
        <div className="kpi-card amber" style={{ cursor: "pointer" }} onClick={() => router.push("/herd")}>
          <div className="kpi-header">
            <span className="kpi-label">Дойных коров</span>
            <div className="kpi-icon amber">🥛</div>
          </div>
          <div className="kpi-value">
            {kpi?.milkingCows || milk?.cowCount || "—"}
          </div>
          <span className="kpi-change neutral">
            {kpi?.freshCows ? `${kpi.freshCows} свежих` : "—"} · {kpi?.averageMilkPerCow ? `${kpi.averageMilkPerCow.toFixed(1)} кг/гол` : ""}
          </span>
        </div>

        {/* Мастит / Кетоз */}
        <div className="kpi-card danger" style={{ cursor: "pointer" }} onClick={() => router.push("/health")}>
          <div className="kpi-header">
            <span className="kpi-label">Мастит / Кетоз</span>
            <div className="kpi-icon" style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}>🔬</div>
          </div>
          <div className="kpi-value" style={{ fontSize: 22 }}>
            {kpi ? `${kpi.mastitisSuspects} / ${kpi.ketosisSuspects}` : "—"}
          </div>
          <span className="kpi-change negative">
            {kpi?.digestionProblems ? `+ ${kpi.digestionProblems} пищевар.` : "Нет данных"}
          </span>
        </div>
      </div>

      {/* Видеоаналитика виджет */}
      <div className="card" style={{ marginTop: "var(--space-4)", marginBottom: "var(--space-4)", cursor: "pointer" }} onClick={() => router.push("/video")}>
        <div className="card-header">
          <span className="card-title">📹 Видеоаналитика</span>
          <span className="badge badge-success">5 / 6 онлайн</span>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "var(--space-3)" }}>
            {[
              { name: "Вход в д/з", status: "online", detections: 12, icon: "🦶" },
              { name: "Выход из д/з", status: "online", detections: 9, icon: "⚖️" },
              { name: "Высокоудойные", status: "online", detections: 5, icon: "👁️" },
              { name: "Среднеудойные", status: "online", detections: 3, icon: "👁️" },
              { name: "Родильное", status: "online", detections: 4, icon: "🐄" },
              { name: "Кормовой стол", status: "offline", detections: 0, icon: "🍽️" },
            ].map((cam, i) => (
              <div key={i} style={{
                padding: "var(--space-3)",
                background: cam.status === "online" ? "var(--bg-elevated)" : "rgba(239,68,68,0.04)",
                borderRadius: "var(--radius-md)",
                textAlign: "center",
                border: cam.status === "online" ? "1px solid var(--border-subtle)" : "1px solid rgba(239,68,68,0.15)",
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{cam.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{cam.name}</div>
                <div style={{
                  fontSize: 10,
                  color: cam.status === "online" ? "var(--success)" : "var(--danger)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: cam.status === "online" ? "var(--success)" : "var(--danger)" }} />
                  {cam.status === "online" ? `${cam.detections} дет.` : "Не в сети"}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "var(--space-3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Хромота: <strong>18</strong> · Упитанность: <strong>14</strong> · Отёлы: <strong>4</strong> · Поведение: <strong>8</strong>
            </span>
            <span style={{ fontSize: 12, color: "var(--primary-400)", fontWeight: 600 }}>Открыть камеры →</span>
          </div>
        </div>
      </div>

      {/* Main content: 2-column layout */}
      <div className="grid-dashboard">
        {/* Left: Feed by group chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🌾 Кормление по группам</span>
            <span className="badge badge-info">{data?.groups.length || 0} групп</span>
          </div>
          <div className="card-body">
            {data?.groups && data.groups.length > 0 ? (
              <SimpleBarChart
                data={data.groups
                  .filter(g => g.actual > 0)
                  .slice(0, 12)
                  .map(g => ({
                    id: g.id || undefined,
                    label: g.name,
                    value: g.actual,
                    target: g.planned,
                    subValue: `${g.efficiency}% эфф.`,
                    color: g.efficiency >= 95 ? "var(--success)" : g.efficiency > 80 ? "var(--warning)" : "var(--danger)",
                  }))}
                maxValue={Math.max(...data.groups.map(g => Math.max(g.actual, g.planned)))}
                onRowClick={(id) => router.push(`/groups/${id}?from=${dateFrom}&to=${dateTo}`)}
              />
            ) : (
              <div className="empty-state" style={{ padding: "var(--space-8)" }}>
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-text">Нет данных по группам</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Events feed */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔔 Последние события</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="event-list" style={{ maxHeight: 360, overflowY: "auto" }}>
              {/* AfiFarm events */}
              {farmData?.afimilk?.mastitisSuspects?.items?.map((item: any) => (
                <div key={`mast-${item.cow}`} className="event-item" style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${item.cow}`)}>
                  <span className="event-dot" style={{ background: "var(--danger)" }} />
                  <div className="event-content">
                    <div className="event-text"><strong>Подозрение на мастит</strong> — #{item.cow}</div>
                    <div className="event-time">Группа {item.group} · Дн.лакт. {item.dim}</div>
                  </div>
                </div>
              ))}
              {farmData?.afimilk?.ketosisSuspects?.items?.map((item: any) => (
                <div key={`ket-${item.cow}`} className="event-item" style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${item.cow}`)}>
                  <span className="event-dot" style={{ background: "var(--warning)" }} />
                  <div className="event-content">
                    <div className="event-text"><strong>Подозрение на кетоз</strong> — #{item.cow}</div>
                    <div className="event-time">Группа {item.group} · Дн.лакт. {item.dim}</div>
                  </div>
                </div>
              ))}
              {farmData?.afimilk?.heatSuspects?.items?.slice(0, 5).map((item: any) => (
                <div key={`heat-${item.cow}`} className="event-item" style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${item.cow}`)}>
                  <span className="event-dot" style={{ background: "var(--primary-400)" }} />
                  <div className="event-content">
                    <div className="event-text"><strong>Подозрение на охоту</strong> — #{item.cow}</div>
                    <div className="event-time">Группа {item.group} · Дн.лакт. {item.dim}</div>
                  </div>
                </div>
              ))}
              {farmData?.afimilk?.freshCows?.items?.map((item: any) => (
                <div key={`fresh-${item.cow}`} className="event-item" style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${item.cow}`)}>
                  <span className="event-dot" style={{ background: "var(--info)" }} />
                  <div className="event-content">
                    <div className="event-text"><strong>Новотельная корова</strong> — #{item.cow}</div>
                    <div className="event-time">Лактация {item.lactationNumber} · Дн.лакт. {item.dim}</div>
                  </div>
                </div>
              ))}
              {/* DB events */}
              {data?.events?.map((ev) => (
                <div key={ev.id} className="event-item" style={{ cursor: "pointer" }} onClick={() => router.push(`/events/${ev.id}`)}>
                  <span className="event-dot" style={{ background: ev.severity === "critical" ? "var(--danger)" : ev.severity === "warning" ? "var(--warning)" : "var(--info)" }} />
                  <div className="event-content">
                    <div className="event-text"><strong>{ev.title}</strong></div>
                    <div className="event-time">{ev.description} · {formatDate(ev.timestamp)}</div>
                  </div>
                </div>
              ))}
              {!farmData?.afimilk?.mastitisSuspects?.items?.length &&
               !farmData?.afimilk?.ketosisSuspects?.items?.length &&
               !data?.events?.length && (
                <div className="empty-state" style={{ padding: "var(--space-6)" }}>
                  <div className="empty-state-icon">✅</div>
                  <div className="empty-state-text">Нет активных тревог</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Additional cards */}
      <div className="grid-3" style={{ marginTop: "var(--space-4)" }}>
        {/* Сухое вещество */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📦 Сухое вещество</span>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Загружено СВ</span>
                <span style={{ fontWeight: 600 }}>{feed ? formatNum(feed.totalDryMatter) : "—"} кг</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Остаток корма</span>
                <span style={{ fontWeight: 600 }}>{feed ? formatNum(feed.totalRemainder) : "—"} кг</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Замесов всего</span>
                <span style={{ fontWeight: 600 }}>{data?.mixBatches || 0}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Ингредиентов</span>
                <span style={{ fontWeight: 600 }}>{data?.ingredients || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SCC */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🧪 Соматические клетки</span>
          </div>
          <div className="card-body">
            {farmData?.milkingSummary?.bySCC ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>&lt;200 (Норма)</span>
                  <span className="badge badge-success">{farmData.milkingSummary.bySCC.normal}</span>
                </div>
                <div style={{ width: "100%", height: 6, background: "var(--bg-elevated)", borderRadius: "var(--radius-full)" }}>
                  <div style={{
                    width: `${(farmData.milkingSummary.bySCC.normal / Math.max(farmData.milkingSummary.totalCows, 1)) * 100}%`,
                    height: "100%", background: "var(--success)", borderRadius: "var(--radius-full)", transition: "width 0.5s ease"
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>200-400 (Повышенная)</span>
                  <span className="badge badge-warning">{farmData.milkingSummary.bySCC.elevated}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>&gt;400 (Высокая)</span>
                  <span className="badge badge-danger">{farmData.milkingSummary.bySCC.high}</span>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "var(--space-4)" }}>
                <div className="empty-state-text" style={{ fontSize: 12 }}>Нет данных по сом. клеткам</div>
              </div>
            )}
          </div>
        </div>

        {/* Воспроизводство */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🧬 Воспроизводство</span>
          </div>
          <div className="card-body">
            {kpi ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Подозрение на охоту</span>
                  <span className="badge badge-primary">{kpi.heatSuspects}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>К осеменению</span>
                  <span className="badge badge-info">{kpi.toBreed}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Ожидают отёл</span>
                  <span className="badge badge-neutral">{kpi.calving}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Новотельные коровы</span>
                  <span className="badge badge-success">{kpi.freshCows}</span>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "var(--space-4)" }}>
                <div className="empty-state-text" style={{ fontSize: 12 }}>Нет данных AfiFarm</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Groups table */}
      {data?.groups && data.groups.length > 0 && (
        <div className="card" style={{ marginTop: "var(--space-4)" }}>
          <div className="card-header">
            <span className="card-title">📋 Группы / Эффективность кормления</span>
            <span className="badge badge-info">{data.groups.length} групп</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Группа</th>
                    <th>Тип</th>
                    <th>Голов</th>
                    <th>План (кг)</th>
                    <th>Факт (кг)</th>
                    <th>Остаток (кг)</th>
                    <th>Эфф-ть</th>
                    <th>Дох−корм, ₽</th>
                    <th>₽/голову</th>
                    <th>Записей</th>
                  </tr>
                </thead>
                <tbody>
                  {data.groups.map((g) => (
                    <tr key={g.name}>
                      <td>
                        {g.id ? (
                          <Link href={`/groups/${g.id}?from=${dateFrom}&to=${dateTo}`} className="text-blue-600 hover:underline"><strong>{g.name}</strong></Link>
                        ) : (
                          <strong>{g.name}</strong>
                        )}
                      </td>
                      <td><span className="badge badge-neutral">{g.groupType || "—"}</span></td>
                      <td>{g.headCount || "—"}</td>
                      <td>{formatNum(g.planned)}</td>
                      <td>{formatNum(g.actual)}</td>
                      <td>{formatNum(g.remainder)}</td>
                      <td>
                        <span className={`badge ${g.efficiency >= 95 ? "badge-success" : g.efficiency > 80 ? "badge-warning" : "badge-danger"}`}>
                          {g.efficiency}%
                        </span>
                      </td>
                      <td>{g.iofc != null ? `${g.iofc > 0 ? "+" : ""}${g.iofc.toFixed(0)}` : "—"}</td>
                      <td>{g.feedCost != null ? `${g.feedCost.toFixed(0)}` : "—"}</td>
                      <td>{g.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
