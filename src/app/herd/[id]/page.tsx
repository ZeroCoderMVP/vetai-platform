"use client";
import { useState, useEffect } from "react";
import { useParams, useSearchParams, notFound } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import type { DigitalTwinData } from "@/lib/cow21twin";
import { getSystemDate } from "@/lib/systemDate";

// ---- Reusable micro-components ----

function InfoRow({ label, value, badge }: { label: string; value: any; badge?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-subtle)" }}>
      <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{label}</span>
      {badge ? <span className={`badge badge-${badge}`}>{value}</span> : <strong style={{ fontSize: 13 }}>{value}</strong>}
    </div>
  );
}

function DonutChart({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const r = 36, stroke = 7, c = 2 * Math.PI * r, pct = Math.min(value / max, 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={r * 2 + stroke} height={r * 2 + stroke} viewBox={`0 0 ${r * 2 + stroke} ${r * 2 + stroke}`}>
        <circle cx={r + stroke / 2} cy={r + stroke / 2} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={stroke} />
        <circle cx={r + stroke / 2} cy={r + stroke / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${r + stroke / 2} ${r + stroke / 2})`} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
        <text x={r + stroke / 2} y={r + stroke / 2 + 1} textAnchor="middle" dominantBaseline="central"
          fontSize="15" fontWeight="700" fill="var(--text-primary)">{Math.round(value)}</text>
      </svg>
      <span style={{ fontSize: 10, color: "var(--text-secondary)", textAlign: "center", maxWidth: 80 }}>{label}</span>
    </div>
  );
}

function MiniSparkline({ data, color, h = 40, w = 120 }: { data: number[]; color: string; h?: number; w?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data) * 1.1, min = Math.min(...data) * 0.9, range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return <svg width={w} height={h} style={{ display: "block" }}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ProgressBar({ value, max, color = "var(--primary-400)" }: { value: number; max: number; color?: string }) {
  return (
    <div style={{ height: 6, background: "var(--bg-elevated)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(value / max * 100, 100)}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
    </div>
  );
}

function SeverityDot({ s }: { s?: string }) {
  const c = s === "critical" ? "var(--danger)" : s === "warning" ? "var(--warning)" : "var(--info)";
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />;
}

// ---- Tab definitions ----
const TABS = [
  { id: "overview", label: "Обзор", icon: "📊" },
  { id: "milking", label: "Доение", icon: "🥛" },
  { id: "health", label: "Здоровье", icon: "💊" },
  { id: "reproduction", label: "Воспроизводство", icon: "🧬" },
  { id: "breeding", label: "Племработа", icon: "🐄" },
  { id: "genetics", label: "Генетика", icon: "🧪" },
  { id: "history", label: "История", icon: "📋" },
  { id: "infographics", label: "Инфографика", icon: "📈" },
];

export default function AnimalCardPage() {
  // Adding a random comment to ensure file hash changes!
  // Force Update: 2026-03-19T14:26:00
  const params = useParams();
  const searchParams = useSearchParams();
  const cowId = params.id as string;
  const opId = searchParams.get("op");
  const [data, setData] = useState<any>(null);
  const [twin, setTwin] = useState<DigitalTwinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (opId) {
      setActiveTab("history");
    }
  }, [opId]);

  useEffect(() => {
    Promise.all([
      fetch("/api/farm").then(r => r.json()),
      fetch(`/api/herd/${cowId}`).then(r => {
        if (!r.ok) return null;
        return r.json();
      })
    ]).then(([farmData, twinData]) => {
      setData(farmData);
      setTwin(twinData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [cowId]);

  if (loading) return <AppLayout title={`Корова #${cowId}`}><div className="empty-state"><div className="empty-state-icon">⏳</div><div className="empty-state-text">Загрузка цифрового двойника...</div></div></AppLayout>;

  // Fallback if not found in db
  if (!twin || (twin as any).error || !data) {
    notFound();
  }

  const p = twin.profile;
  const alerts = twin.healthEvents.filter(e => !e.resolvedDate);
  const dailySummary = twin.dailyMilkSummary;
  const todayYield = dailySummary.length > 0 ? dailySummary[dailySummary.length - 1].totalYield : 0;
  const todaySCC = dailySummary.length > 0 ? dailySummary[dailySummary.length - 1].avgSCC : 0;
  const yieldTrend = dailySummary.map(d => d.totalYield);
  const sccTrend = dailySummary.map(d => d.avgSCC);

  return (
    <AppLayout title={`Корова #${p.number}`}>
      {/* ══════ PROFILE HEADER ══════ */}
      <div className="card" style={{ marginBottom: "var(--space-4)", overflow: "hidden" }}>
        <div style={{ height: 4, background: alerts.length > 0 ? "var(--warning)" : "var(--success)" }} />
        <div className="card-body" style={{ padding: "var(--space-5)" }}>
          <div style={{ display: "flex", gap: "var(--space-5)", alignItems: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "var(--radius-xl)", flexShrink: 0, background: "linear-gradient(135deg, var(--primary-500), var(--primary-300))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, color: "#fff", boxShadow: "0 4px 20px rgba(15,168,122,0.3)" }}>
              🐄
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: 6 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Корова #{p.number}</h2>
                <span style={{ fontSize: 12, color: "var(--text-tertiary)", background: "var(--bg-elevated)", padding: "2px 8px", borderRadius: "var(--radius-sm)" }}>{p.regNumber}</span>
                <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{p.electronicId}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span className="badge badge-success">{p.status === "active" ? "Активная" : p.status === "dry" ? "Сухостойная" : p.status}</span>
                <span className="badge badge-primary">Лактация {p.lactation}</span>
                <span className="badge badge-info">Дни лакт. {p.dim}</span>
                <Link href={`/groups/${p.group.id}`}><span className="badge badge-neutral hover:bg-gray-200 transition-colors cursor-pointer">{p.group.name}</span></Link>
                <span className="badge badge-primary">{p.gynStatus}</span>
                <span className="badge badge-neutral">{p.breed === "Holstein" ? "Голштинская" : p.breed}</span>
                {alerts.length > 0 && <span className="badge badge-warning">⚠️ {alerts.length} активных тревог</span>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Link href="/herd" className="btn btn-secondary btn-sm">← К стаду</Link>
            </div>
          </div>
          {/* Manager summary */}
          <div style={{ marginTop: "var(--space-3)", padding: "var(--space-3)", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, borderLeft: "3px solid var(--primary-400)" }}>
            💡 {p.managementSummary}
          </div>
        </div>
      </div>

      {/* ══════ TABS ══════ */}
      <div className="tabs" style={{ marginBottom: "var(--space-5)" }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══════ TAB: OVERVIEW ══════ */}
      {activeTab === "overview" && <OverviewTab twin={twin} todayYield={todayYield} todaySCC={todaySCC} yieldTrend={yieldTrend} sccTrend={sccTrend} alerts={alerts} />}

      {/* ══════ TAB: MILKING ══════ */}
      {activeTab === "milking" && <MilkingTab twin={twin} dailySummary={dailySummary} />}

      {/* ══════ TAB: HEALTH ══════ */}
      {activeTab === "health" && <HealthTab twin={twin} />}

      {/* ══════ TAB: REPRODUCTION ══════ */}
      {activeTab === "reproduction" && <ReproductionTab twin={twin} />}

      {/* ══════ TAB: BREEDING ══════ */}
      {activeTab === "breeding" && <BreedingTab twin={twin} />}

      {/* ══════ TAB: GENETICS ══════ */}
      {activeTab === "genetics" && <GeneticsTab twin={twin} />}

      {/* ══════ TAB: HISTORY ══════ */}
      {activeTab === "history" && <HistoryTab twin={twin} />}

      {/* ══════ TAB: INFOGRAPHICS ══════ */}
      {activeTab === "infographics" && <InfographicsTab twin={twin} />}
    </AppLayout>
  );
}

// ═══════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════

function OverviewTab({ twin, todayYield, todaySCC, yieldTrend, sccTrend, alerts }: { twin: DigitalTwinData; todayYield: number; todaySCC: number; yieldTrend: number[]; sccTrend: number[]; alerts: any[] }) {
  const p = twin.profile;
  const inf = twin.infographics;
  return (
    <>
      {/* KPI row */}
      <div className="kpi-grid">
        <div className="kpi-card green">
          <div className="kpi-header"><span className="kpi-label">Надой сегодня</span><div className="kpi-icon green">🥛</div></div>
          <div className="kpi-value">{todayYield}<span className="kpi-unit"> кг</span></div>
          <MiniSparkline data={yieldTrend} color="var(--success)" />
        </div>
        <div className="kpi-card amber">
          <div className="kpi-header"><span className="kpi-label">Сом. клетки ср.</span><div className="kpi-icon amber">🔬</div></div>
          <div className="kpi-value">{todaySCC}</div>
          <span className={`kpi-change ${todaySCC < 200 ? "positive" : "neutral"}`}>{todaySCC < 200 ? "✅ Норма" : "⚠️ Наблюдение"}</span>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-header"><span className="kpi-label">Вес / Упитанн.</span><div className="kpi-icon blue">⚖️</div></div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{p.weight} кг / {p.bcs}</div>
          <span className="kpi-change neutral">Пик лактации пройден</span>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-header"><span className="kpi-label">Стельность</span><div className="kpi-icon purple">🤰</div></div>
          <div className="kpi-value" style={{ fontSize: 20 }}>60 дн</div>
          <span className="kpi-change positive">Подтверждена УЗИ</span>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-header"><span className="kpi-label">Тревоги</span><div className="kpi-icon" style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}>⚠️</div></div>
          <div className="kpi-value">{alerts.length}</div>
          <span className="kpi-change negative">{alerts.map(a => a.title.split(' ')[0]).join(', ') || '—'}</span>
        </div>
      </div>

      {/* Row 2: Radar + Rankings + BCS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        {/* Radar */}
        <div className="card">
          <div className="card-header"><span className="card-title">🎯 Индексы животного</span></div>
          <div className="card-body" style={{ display: "flex", justifyContent: "center", padding: "var(--space-3)" }}>
            <RadarChart scores={inf.radarScores} />
          </div>
        </div>

        {/* Herd rankings */}
        <div className="card">
          <div className="card-header"><span className="card-title">🏆 Рейтинг в стаде</span></div>
          <div className="card-body">
            {inf.herdRankings.map((r, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: "var(--text-secondary)" }}>{r.metric}</span>
                  <strong>#{r.rank}<span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}> / {r.total}</span></strong>
                </div>
                <ProgressBar value={r.percentile} max={100} color={r.percentile >= 80 ? "var(--success)" : r.percentile >= 50 ? "var(--warning)" : "var(--danger)"} />
              </div>
            ))}
          </div>
        </div>

        {/* Active alerts */}
        <div className="card">
          <div className="card-header"><span className="card-title">⚠️ Активные тревоги</span><span className={`badge ${alerts.length === 0 ? "badge-success" : "badge-warning"}`}>{alerts.length}</span></div>
          <div className="card-body">
            {alerts.length > 0 ? alerts.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "start", gap: 10, padding: "8px 10px", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", marginBottom: 8, borderLeft: `3px solid ${a.severity === "critical" ? "var(--danger)" : "var(--warning)"}` }}>
                <SeverityDot s={a.severity} />
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</div><div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{a.description}</div></div>
              </div>
            )) : <div style={{ textAlign: "center", color: "var(--success)", padding: "var(--space-4)" }}>✅ Всё в порядке</div>}
            {/* Lifetime stats */}
            <div style={{ marginTop: "var(--space-3)", padding: "var(--space-3)", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>📊 Пожизненная статистика</div>
              <InfoRow label="Всего молока" value={`${(inf.lifetimeStats.totalMilk / 1000).toFixed(1)} т`} />
              <InfoRow label="Отёлов" value={inf.lifetimeStats.totalCalvings} />
              <InfoRow label="Дней в стаде" value={inf.lifetimeStats.daysInHerd} />
              <InfoRow label="Выручка" value={`${(inf.lifetimeStats.revenue / 1000).toFixed(0)} тыс ₽`} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ---- Radar chart (SVG) ----
function RadarChart({ scores }: { scores: { axis: string; value: number; max: number }[] }) {
  const n = scores.length, r = 80, cx = 100, cy = 100;
  const angleStep = (2 * Math.PI) / n;
  const levels = [0.25, 0.5, 0.75, 1];
  const getXY = (i: number, pct: number) => ({
    x: cx + r * pct * Math.sin(i * angleStep - Math.PI / 2),
    y: cy - r * pct * Math.cos(i * angleStep - Math.PI / 2),
  });
  const dataPoints = scores.map((s, i) => getXY(i, s.value / s.max));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";

  return (
    <svg width={200} height={200} viewBox="0 0 200 200">
      {levels.map((l, li) => (
        <polygon key={li} points={Array.from({ length: n }, (_, i) => { const p = getXY(i, l); return `${p.x},${p.y}`; }).join(" ")}
          fill="none" stroke="var(--border-subtle)" strokeWidth="0.5" />
      ))}
      {scores.map((_, i) => { const p = getXY(i, 1); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border-subtle)" strokeWidth="0.5" />; })}
      <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(" ")} fill="rgba(15,168,122,0.15)" stroke="var(--primary-400)" strokeWidth="2" />
      {scores.map((s, i) => {
        const p = getXY(i, 1.18);
        return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="var(--text-secondary)">{s.axis}</text>;
      })}
      {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--primary-400)" />)}
    </svg>
  );
}

// ---- MILKING TAB ----
function MilkingTab({ twin, dailySummary }: { twin: DigitalTwinData; dailySummary: any[] }) {
  const sessions = twin.milkingSessions;
  const latestDate = sessions.length > 0 ? sessions[sessions.length - 1].date : getSystemDate().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.date === latestDate);
  const h = 180, w = 560, pad = 45;
  const yields = dailySummary.map(d => d.totalYield);
  const maxY = Math.max(...yields) * 1.1, minY = Math.min(...yields) * 0.9, range = maxY - minY || 1;

  return (
    <>
      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        {[
          { l: "Надой сегодня", v: `${dailySummary[dailySummary.length - 1]?.totalYield || 0} кг`, c: "green" },
          { l: "Ср. жир", v: `${dailySummary[dailySummary.length - 1]?.avgFat || 0}%`, c: "amber" },
          { l: "Ср. белок", v: `${dailySummary[dailySummary.length - 1]?.avgProtein || 0}%`, c: "blue" },
          { l: "Сом. клетки", v: dailySummary[dailySummary.length - 1]?.avgSCC || 0, c: "purple" },
          { l: "Доений", v: sessions.length, c: "neutral" },
        ].map((k, i) => (
          <div key={i} className={`kpi-card ${k.c}`} style={{ padding: "var(--space-3)" }}>
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{k.l}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Lactation curve */}
      <div className="card" style={{ marginBottom: "var(--space-4)" }}>
        <div className="card-header"><span className="card-title">📈 Кривая суточного надоя (30 дней)</span></div>
        <div className="card-body">
          <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", maxHeight: 200 }}>
            <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary-400)" stopOpacity="0.2" /><stop offset="100%" stopColor="var(--primary-400)" stopOpacity="0" /></linearGradient></defs>
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = pad + pct * (h - pad * 2); const val = Math.round(maxY - pct * range);
              return <g key={i}><line x1={pad} y1={y} x2={w - pad} y2={y} stroke="var(--border-subtle)" strokeWidth="1" /><text x={pad - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-tertiary)">{val}</text></g>;
            })}
            <polygon points={`${pad},${h - pad} ${dailySummary.map((d, i) => `${pad + (i / (dailySummary.length - 1)) * (w - pad * 2)},${pad + (1 - (d.totalYield - minY) / range) * (h - pad * 2)}`).join(" ")} ${pad + (w - pad * 2)},${h - pad}`} fill="url(#cg)" />
            <polyline points={dailySummary.map((d, i) => `${pad + (i / (dailySummary.length - 1)) * (w - pad * 2)},${pad + (1 - (d.totalYield - minY) / range) * (h - pad * 2)}`).join(" ")} fill="none" stroke="var(--primary-400)" strokeWidth="2.5" strokeLinecap="round" />
            {dailySummary.filter((_, i) => i % 5 === 0 || i === dailySummary.length - 1).map((d, i) => {
              const idx = dailySummary.indexOf(d);
              return <text key={i} x={pad + (idx / (dailySummary.length - 1)) * (w - pad * 2)} y={h - pad + 15} textAnchor="middle" fontSize="9" fill="var(--text-tertiary)">{d.date.slice(5)}</text>;
            })}
          </svg>
        </div>
      </div>

      {/* Today's sessions */}
      <div className="card">
        <div className="card-header"><span className="card-title">🥛 Доения сегодня</span><span className="badge badge-neutral">{todaySessions.length} сеанс.</span></div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead><tr><th>Сеанс</th><th>Надой</th><th>Длит.</th><th>Полнота</th><th>Провод.</th><th>Сом.кл.</th><th>Жир</th><th>Белок</th><th>Лактоза</th></tr></thead>
              <tbody>
                {todaySessions.map((s, i) => (
                  <tr key={i}>
                    <td>{s.session === 1 ? "🌅 Утро" : s.session === 2 ? "☀️ День" : "🌙 Вечер"}</td>
                    <td><strong>{s.yield} кг</strong></td><td>{s.duration} мин</td><td>{s.completeness}%</td>
                    <td>{s.conductivity}</td>
                    <td><span className={`badge ${s.scc < 200 ? "badge-success" : "badge-warning"}`}>{s.scc}</span></td>
                    <td>{s.fatPercent}%</td><td>{s.proteinPercent}%</td><td>{s.lactosePercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ---- HEALTH TAB ----
function HealthTab({ twin }: { twin: DigitalTwinData }) {
  const bcs = twin.bcsHistory;
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
        {/* Health events timeline */}
        <div className="card">
          <div className="card-header"><span className="card-title">🩺 Медицинская карта</span><span className="badge badge-neutral">{twin.healthEvents.length}</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="event-list">
              {twin.healthEvents.map(e => (
                <div key={e.id} className="event-item">
                  <SeverityDot s={e.severity} />
                  <div className="event-content">
                    <div className="event-text"><strong>{e.title}</strong></div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0" }}>{e.description}</div>
                    {e.treatment && <div style={{ fontSize: 11, color: "var(--primary-500)", background: "rgba(15,168,122,0.08)", padding: "4px 8px", borderRadius: "var(--radius-sm)", marginTop: 4 }}>💊 {e.treatment}</div>}
                    <div className="event-time">{e.date}{e.veterinarian ? ` · ${e.veterinarian}` : ""}{e.resolvedDate ? ` · ✅ ${e.resolvedDate}` : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BCS curve + Vitals */}
        <div>
          <div className="card" style={{ marginBottom: "var(--space-4)" }}>
            <div className="card-header"><span className="card-title">📏 Кривая упитанности</span></div>
            <div className="card-body">
              <BCSChart data={bcs} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--text-tertiary)" }}>
                <span>Целевой: 2.75–3.50</span><span>Текущий: <strong style={{ color: "var(--text-primary)" }}>{bcs[bcs.length - 1]?.score}</strong></span>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">📋 Сводка здоровья</span></div>
            <div className="card-body">
              <InfoRow label="Вес" value={`${twin.profile.weight} кг`} />
              <InfoRow label="Упитанность" value={twin.profile.bcs} />
              <InfoRow label="Последняя вакцинация" value="20.01.2026" />
              <InfoRow label="Дегельминтизация" value="30.11.2025" />
              <InfoRow label="Обрезка копыт" value="15.02.2026" />
              <InfoRow label="Кетоз в анамнезе" value="Да (лакт. 2)" badge="warning" />
              <InfoRow label="Мастит в анамнезе" value="Да (лакт. 1)" badge="warning" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function BCSChart({ data }: { data: { date: string; score: number; dim: number }[] }) {
  const w = 300, h = 100, padX = 15, padY = 20;
  // Calculate dynamic range with some padding, but keep the 2.75-3.50 zone visible
  const minVal = Math.min(...data.map(d => d.score), 2.7);
  const maxVal = Math.max(...data.map(d => d.score), 3.6);
  const minS = minVal - 0.1, maxS = maxVal + 0.1, range = maxS - minS;
  
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", maxHeight: 120 }}>
      {/* Target zone 2.75 - 3.50 green background */}
      <rect x={padX} y={padY + (1 - (3.5 - minS) / range) * (h - padY * 2)} width={w - padX * 2} height={((3.5 - 2.75) / range) * (h - padY * 2)} fill="rgba(15,168,122,0.08)" />
      {data.map((d, i) => {
        if (i === 0) return null;
        const x1 = padX + ((i - 1) / (data.length - 1)) * (w - padX * 2), y1 = padY + (1 - (data[i - 1].score - minS) / range) * (h - padY * 2);
        const x2 = padX + (i / (data.length - 1)) * (w - padX * 2), y2 = padY + (1 - (d.score - minS) / range) * (h - padY * 2);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--warning)" strokeWidth="2.5" strokeLinecap="round" />;
      })}
      {data.map((d, i) => {
        const x = padX + (i / (data.length - 1)) * (w - padX * 2), y = padY + (1 - (d.score - minS) / range) * (h - padY * 2);
        return <g key={i}>
          <circle cx={x} cy={y} r="4.5" fill="var(--warning)" stroke="var(--bg-surface)" strokeWidth="2" />
          <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="var(--text-primary)" fontWeight="700">{d.score.toFixed(2)}</text>
        </g>;
      })}
    </svg>
  );
}

// ---- REPRODUCTION TAB ----
// Helper component for horizontal timeline
function HorizontalTimeline({ events, profile }: { events: any[], profile: any }) {
  const stages = [
    { key: "insemination", label: "Осеменение", expected: true },
    { key: "pregnancy_check", label: "Стельная", expected: true },
    { key: "dry_off", label: "Сухостой", expected: true },
    { key: "late_dry_off", label: "Поздний сухостой", expected: true },
    { key: "calving", label: "Отёл", expected: true }
  ];

  // Map events to stages
  const resolvedStages = stages.map((s, i) => {
    // try to find event matching type
    const found = events.find(e => 
      e.type === s.key || 
      (s.key === "pregnancy_check" && (e.title.toLowerCase().includes("стельная") || e.title.includes("УЗИ"))) ||
      (s.key === "insemination" && e.title.toLowerCase().includes("осеменен")) ||
      (s.key === "calving" && e.title.toLowerCase().includes("отел")) ||
      (s.key === "dry_off" && e.title.toLowerCase().includes("сухостой") && !e.title.toLowerCase().includes("поздн")) ||
      (s.key === "late_dry_off" && e.title.toLowerCase().includes("поздний сухостой"))
    );
    
    // Fallback based on profile state (very naive approach for MVP if events are sparse)
    const isCompleted = !!found || (i === 1 && profile.gynStatus === 'Стельная');

    return {
      ...s,
      completed: isCompleted,
      date: found?.date || (isCompleted ? '✓' : ''),
    };
  });

  // Calculate progress
  return (
    <div style={{ marginBottom: "var(--space-4)" }}>
      <div className="card-header"><span className="card-title">⏳ Жизненный цикл лактации</span></div>
      <div className="card-body" style={{ display: "flex", justifyContent: "space-between", position: "relative", padding: "var(--space-5) 20px" }}>
        {/* Connecting line */}
        <div style={{ position: "absolute", top: "50%", left: "40px", right: "40px", height: "4px", background: "var(--bg-elevated)", transform: "translateY(-50%)", zIndex: 0 }} />
        
        {resolvedStages.map((st, i) => (
          <div key={st.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1, width: "100px" }}>
            <div style={{
              width: "24px", height: "24px", borderRadius: "50%",
              background: st.completed ? "var(--success)" : "var(--bg-surface)",
              border: `4px solid ${st.completed ? "var(--success)" : "var(--border-subtle)"}`,
              marginBottom: "8px", transition: "all 0.3s ease"
            }} />
            <div style={{ fontSize: "12px", fontWeight: st.completed ? 600 : 400, color: st.completed ? "var(--text-primary)" : "var(--text-tertiary)", textAlign: "center" }}>
              {st.label}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "2px" }}>
              {st.date || "Ожидается"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReproductionTab({ twin }: { twin: DigitalTwinData }) {
  return (
    <>
      {/* 9.4 MVP Map Horizontal Timeline */}
      <div className="card" style={{ marginBottom: "var(--space-4)" }}>
        <HorizontalTimeline events={twin.reproductionEvents} profile={twin.profile} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
      {/* Reproduction timeline */}
      <div className="card">
        <div className="card-header"><span className="card-title">🧬 Репродуктивная история</span></div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="event-list">
            {twin.reproductionEvents.length === 0 ? (
              <div style={{ padding: "var(--space-4) 20px", color: "var(--text-secondary)", textAlign: "center", fontStyle: "italic" }}>
                Нет записей о репродуктивных событиях
              </div>
            ) : (
              twin.reproductionEvents.map(e => (
                <div key={e.id} className="event-item">
                  <span className="event-dot" style={{ background: e.type === "calving" ? "var(--success)" : e.type === "insemination" ? "var(--primary-400)" : e.type === "pregnancy_check" ? "var(--info)" : "var(--warning)" }} />
                  <div className="event-content">
                    <div className="event-text"><strong>{e.title}</strong></div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{e.description}</div>
                    {e.result && <span className={`badge ${e.result === "Успех" || e.result === "Стельная" ? "badge-success" : "badge-danger"}`} style={{ marginTop: 4 }}>{e.result}</span>}
                    <div className="event-time">{e.date}{e.sireName ? ` · 🐂 ${e.sireName}` : ""}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Calving history + Status */}
      <div>
        <div className="card" style={{ marginBottom: "var(--space-4)" }}>
          <div className="card-header"><span className="card-title">🤰 Текущая стельность</span></div>
          <div className="card-body">
            <InfoRow label="Статус" value="Стельная" badge="success" />
            <InfoRow label="Дней стельности" value="60" />
            <InfoRow label="Ожидаемый отёл" value="~15.10.2026" />
            <InfoRow label="Бык-отец" value="LIGHTNING RIDGE" />
            <InfoRow label="Метод" value="Искусственное осеменение" />
            <InfoRow label="Осеменений в эту лакт." value="1" />
            <InfoRow label="Оплодотворяемость" value="100%" badge="success" />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">🐄 История отёлов</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead><tr><th>Дата</th><th>Лакт.</th><th>Пол</th><th>Вес</th><th>Лёгкость</th><th>Тёленок</th></tr></thead>
                <tbody>
                  {twin.calvingHistory.map((c, i) => (
                    <tr key={i}>
                      <td>{c.date}</td><td>{c.lactation}</td><td>{c.calfSex}</td>
                      <td><strong>{c.calfWeight} кг</strong></td>
                      <td><span className={`badge ${c.easeScore <= 2 ? "badge-success" : "badge-warning"}`}>{c.easeScore}/5</span></td>
                      <td>{c.calfId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// ---- BREEDING TAB ----
function BreedingTab({ twin }: { twin: DigitalTwinData }) {
  const bp = twin.breedingPlan;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
      <div>
        <div className="card" style={{ marginBottom: "var(--space-4)" }}>
          <div className="card-header"><span className="card-title">🎯 Племенной план</span></div>
          <div className="card-body">
            <InfoRow label="Текущий статус" value={bp.status} badge="success" />
            <InfoRow label="След. действие" value={bp.nextAction} />
            <InfoRow label="Дата" value={bp.nextActionDate} />
            <InfoRow label="Племенная ценность" value={bp.breedingValue} />
            <InfoRow label="Коэфф. инбридинга" value={`${bp.inbreedingCoeff}%`} badge={bp.inbreedingCoeff < 6.25 ? "success" : "warning"} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">📋 История осеменений</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead><tr><th>Дата</th><th>Бык</th><th>Результат</th><th>Техник</th></tr></thead>
                <tbody>
                  {bp.inseminationHistory.map((ins, i) => (
                    <tr key={i}>
                      <td>{ins.date}</td><td>{ins.sireName}</td>
                      <td><span className={`badge ${ins.result === "Стельная" ? "badge-success" : "badge-danger"}`}>{ins.result}</span></td>
                      <td>{ins.technicianName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">🐂 Рекомендованные быки</span></div>
        <div className="card-body">
          {bp.preferredSires.map((s, i) => (
            <div key={i} style={{ padding: "var(--space-3)", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-3)", borderLeft: `3px solid ${i === 0 ? "var(--success)" : "var(--primary-300)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <strong style={{ fontSize: 14 }}>{i === 0 ? "⭐ " : ""}{s.name}</strong>
                <span className="badge badge-primary">Инд. прод. {s.proof}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>{s.id}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>💡 {s.reason}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- GENETICS TAB ----
function GeneticsTab({ twin }: { twin: DigitalTwinData }) {
  const g = twin.genetics;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
      {/* Pedigree */}
      <div className="card">
        <div className="card-header"><span className="card-title">🌳 Родословная</span></div>
        <div className="card-body">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {/* Sire side */}
            <div style={{ padding: "var(--space-3)", background: "rgba(59,130,246,0.06)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--info)" }}>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>🐂 Отец</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{g.sire.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{g.sire.id} · {g.sire.country} · Инд. прод. {g.sire.proof}</div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: 8 }}>
                <div style={{ flex: 1, padding: 6, background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", fontSize: 11 }}>
                  <div style={{ color: "var(--text-tertiary)" }}>Отец отца</div><strong>{g.sireOfSire.name}</strong>
                </div>
                <div style={{ flex: 1, padding: 6, background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", fontSize: 11 }}>
                  <div style={{ color: "var(--text-tertiary)" }}>Мать отца</div><strong>{g.damOfSire.name}</strong>
                </div>
              </div>
            </div>
            {/* Dam side */}
            <div style={{ padding: "var(--space-3)", background: "rgba(245,158,11,0.06)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--warning)" }}>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>🐄 Мать</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{g.dam.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{g.dam.id} · Надой: {(g.dam.milkYield / 1000).toFixed(1)} т/лакт.</div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: 8 }}>
                <div style={{ flex: 1, padding: 6, background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", fontSize: 11 }}>
                  <div style={{ color: "var(--text-tertiary)" }}>Отец матери</div><strong>{g.sireOfDam.name}</strong>
                </div>
                <div style={{ flex: 1, padding: 6, background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", fontSize: 11 }}>
                  <div style={{ color: "var(--text-tertiary)" }}>Мать матери</div><strong>{g.damOfDam.name}</strong>
                </div>
              </div>
            </div>
            {/* Breed composition */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Породный состав</div>
              {g.breedComposition.map((b, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                    <span>{b.breed}</span><strong>{b.percent}%</strong>
                  </div>
                  <ProgressBar value={b.percent} max={100} color={i === 0 ? "var(--primary-400)" : "var(--warning)"} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Genomic indices */}
      <div className="card">
        <div className="card-header"><span className="card-title">🧬 Геномные индексы</span></div>
        <div className="card-body">
          {g.genomicIndices.map((idx, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                <span style={{ color: "var(--text-secondary)" }}>{idx.name}</span>
                <strong>{idx.value}</strong>
              </div>
              <ProgressBar value={idx.percentile} max={100} color={idx.percentile >= 80 ? "var(--success)" : idx.percentile >= 50 ? "var(--primary-400)" : "var(--warning)"} />
              <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>{idx.description} · Перцентиль: {idx.percentile}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const translateAfiEvent = (title: string) => {
  const t: Record<string, string> = {
    "AnimalSuspectedHeat": "Подозрение на охоту",
    "AnimalsSuspectedHeat": "Подозрение на охоту",
    "AnimalSuspectedAbortion": "Подозрение на аборт",
    "AnimalsSuspectedAbortion": "Подозрение на аборт",
    "AnimalCalved": "Отёл",
    "AnimalsCalved": "Отёл",
    "AnimalCalving": "Отёл",
    "AnimalsCalving": "Отёл",
    "AnimalInseminated": "Осеменение",
    "AnimalsInseminated": "Осеменение",
    "AnimalDry": "Запуск (Сухостой)",
    "AnimalsDry": "Запуск (Сухостой)",
    "AnimalTreatment": "Лечение",
    "AnimalsTreatment": "Лечение",
    "AnimalDisease": "Заболевание",
    "AnimalsDisease": "Заболевание",
    "AnimalSick": "Заболевание",
    "AnimalsSick": "Заболевание",
    "HoofTrim": "Расчистка копыт",
    "AnimalVaccination": "Вакцинация",
    "AnimalsVaccination": "Вакцинация"
  };
  for (const key of Object.keys(t)) {
     if (title.startsWith(key)) return title.replace(key, t[key]);
  }
  return t[title] || title;
};

// ---- HISTORY TAB ----
function HistoryTab({ twin }: { twin: DigitalTwinData }) {
  const catColors: Record<string, string> = { milking: "var(--primary-400)", health: "var(--danger)", reproduction: "var(--info)", management: "var(--warning)", genetics: "var(--purple-400, #a855f7)" };
  const catLabels: Record<string, string> = { milking: "Доение", health: "Здоровье", reproduction: "Воспроизводство", management: "Менеджмент", genetics: "Генетика" };
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const filtered = filter === "all" ? twin.timeline : twin.timeline.filter(e => e.category === filter);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">📋 Полная история</span>
        <div style={{ display: "flex", gap: 4 }}>
          {["all", "health", "reproduction", "management"].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilter(f)}>
              {f === "all" ? "Все" : catLabels[f]}
            </button>
          ))}
        </div>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div className="event-list">
          {filtered.map(e => {
            const isClickable = e.description && e.description.trim().startsWith('{');
            const isExpanded = expandedId === e.id;
            
            const content = (
              <>
                <span className="event-dot" style={{ background: catColors[e.category] || "var(--text-tertiary)" }} />
                <div className="event-content" style={{ width: "100%", paddingRight: 16 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", width: "100%", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span>{e.icon}</span>
                      <strong style={{ fontSize: 13, textDecoration: isClickable ? "underline" : "none", textDecorationStyle: "dashed", cursor: isClickable ? "pointer" : "default" }}>
                        {translateAfiEvent(e.title)}
                      </strong>
                      {e.severity && <SeverityDot s={e.severity} />}
                    </div>
                    {isClickable && (
                      <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 500, cursor: "pointer" }}>
                         {isExpanded ? "Скрыть" : "Раскрыть"}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                    {isClickable && !isExpanded
                      ? "📊 Системная запись (нажмите чтобы открыть raw данные)" 
                      : (!isClickable ? e.description : null)}
                  </div>
                  <div className="event-time">{e.date} · {catLabels[e.category] || e.category}</div>
                  
                  {isExpanded && isClickable && (
                    <div style={{ marginTop: 12, padding: 12, backgroundColor: "var(--bg-elevated)", borderRadius: 6, border: "1px solid var(--border-subtle)", fontSize: 11, fontFamily: "monospace", overflowX: "auto", whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>
                      {e.description}
                    </div>
                  )}
                </div>
              </>
            );

            return isClickable ? (
              <div 
                key={`${e.id}-${e.category}`} 
                onClick={() => setExpandedId(prev => prev === e.id ? null : e.id)}
                className="event-item hover:bg-gray-50 transition-colors" 
              >
                {content}
              </div>
            ) : (
              <div key={`${e.id}-${e.category}`} className="event-item">
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
