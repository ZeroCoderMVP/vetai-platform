"use client";

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DateRangePicker from "@/components/ui/DateRangePicker";

// ==========================================
// Типы
// ==========================================

interface FeedingSummary {
  totalPlanned: number;
  totalActual: number;
  totalRemainder: number;
  totalDryMatter: number;
  efficiency: number;
  remainderPercent: number;
  avgIOFC: number;
  avgFeedCostPerHead: number;
  recordCount: number;
  groupCount: number;
}

interface GroupStat {
  groupName: string;
  totalPlanned: number;
  totalActual: number;
  avgPlanned: number;
  avgActual: number;
  avgRemainder: number;
  recordCount: number;
  efficiency: number;
}

interface DailyPoint {
  date: string;
  planned: number;
  actual: number;
  remainder: number;
  avgIOFC: number;
  count: number;
}

interface MixRecord {
  id: string;
  dtmBatchId: number | null;
  recipeName: string;
  groupCode: string | null;
  headCount: number | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  loadDuration: string | null;
  mixDuration: string | null;
  mixer: string | null;
  totalDuration: string | null;
}

interface IngredientStat {
  ingredientName: string;
  totalTarget: number;
  totalActual: number;
  totalDM: number;
  totalConsumption: number;
  avgError: number;
  avgErrorAbs: number;
  count: number;
}

interface FeedRecord {
  id: string;
  groupName: string;
  date: string;
  recipe: string | null;
  planned: number | null;
  actual: number | null;
  remainder: number | null;
  dryMatter: number | null;
  headCount: number | null;
  iofc: number | null;
  groupType: string | null;
}

// ==========================================
// Утилиты
// ==========================================

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  } catch {
    return dateStr;
  }
}

// ==========================================
// Компонент мини-графика (SVG bar chart)
// ==========================================

function MiniBarChart({ data, maxVal }: { data: { label: string; value: number; color: string }[]; maxVal: number }) {
  const barHeight = 22;
  const gap = 4;
  const height = data.length * (barHeight + gap);
  const maxWidth = 180;

  return (
    <svg width="100%" height={height} viewBox={`0 0 300 ${height}`} style={{ display: "block" }}>
      {data.map((d, i) => {
        const w = maxVal > 0 ? (d.value / maxVal) * maxWidth : 0;
        const y = i * (barHeight + gap);
        return (
          <g key={i}>
            <rect x="0" y={y} width={w} height={barHeight} rx="4" fill={d.color} opacity="0.85" />
            <text x={w + 6} y={y + 15} fontSize="11" fill="var(--text-secondary)">{d.value.toLocaleString("ru-RU")} кг</text>
            <text x="300" y={y + 15} fontSize="10" fill="var(--text-muted)" textAnchor="end">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ==========================================
// Компонент графика линейного (SVG)
// ==========================================

function LineChart({ daily, height = 200 }: { daily: DailyPoint[]; height?: number }) {
  if (!daily || daily.length === 0) {
    return <div className="empty-state" style={{ padding: "var(--space-6)" }}><div className="empty-state-text">Нет данных за период</div></div>;
  }

  const width = 600;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...daily.map(d => Math.max(d.planned, d.actual)));
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const xScale = (i: number) => padding.left + (i / (daily.length - 1 || 1)) * chartW;
  const yScale = (v: number) => padding.top + chartH - ((v - minVal) / range) * chartH;

  const plannedPath = daily.map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.planned)}`).join(" ");
  const actualPath = daily.map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.actual)}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = padding.top + chartH * (1 - f);
        const val = minVal + range * f;
        return (
          <g key={f}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--border-secondary)" strokeWidth="0.5" />
            <text x={padding.left - 6} y={y + 4} fontSize="10" fill="var(--text-muted)" textAnchor="end">{Math.round(val)}</text>
          </g>
        );
      })}

      {/* Lines */}
      <path d={plannedPath} fill="none" stroke="var(--primary-400)" strokeWidth="2" strokeDasharray="6,3" />
      <path d={actualPath} fill="none" stroke="var(--success)" strokeWidth="2.5" />

      {/* Dots */}
      {daily.map((d, i) => (
        <g key={i}>
          <circle cx={xScale(i)} cy={yScale(d.actual)} r="3" fill="var(--success)" />
          {i % Math.max(1, Math.floor(daily.length / 8)) === 0 && (
            <text x={xScale(i)} y={height - 8} fontSize="9" fill="var(--text-muted)" textAnchor="middle">{formatDate(d.date)}</text>
          )}
        </g>
      ))}

      {/* Legend */}
      <g transform={`translate(${padding.left + 10}, ${padding.top})`}>
        <line x1="0" y1="0" x2="16" y2="0" stroke="var(--primary-400)" strokeWidth="2" strokeDasharray="6,3" />
        <text x="20" y="4" fontSize="10" fill="var(--text-secondary)">План</text>
        <line x1="60" y1="0" x2="76" y2="0" stroke="var(--success)" strokeWidth="2.5" />
        <text x="80" y="4" fontSize="10" fill="var(--text-secondary)">Факт</text>
      </g>
    </svg>
  );
}

// ==========================================
// Tabs
// ==========================================

type TabName = "overview" | "groups" | "mixes" | "ingredients";

const TABS: { id: TabName; label: string; icon: string }[] = [
  { id: "overview", label: "Обзор", icon: "📊" },
  { id: "groups", label: "Группы", icon: "🏠" },
  { id: "mixes", label: "Замесы", icon: "🔄" },
  { id: "ingredients", label: "Ингредиенты", icon: "🧪" },
];

// ==========================================
// Главный компонент
// ==========================================

export default function FeedingPage() {
  const [activeTab, setActiveTab] = useState<TabName>("overview");
  const [dateFrom, setDateFrom] = useState(getDaysAgo(30));
  const [dateTo, setDateTo] = useState(getToday());
  const [loading, setLoading] = useState(true);

  // Data
  const [summary, setSummary] = useState<FeedingSummary | null>(null);
  const [groups, setGroups] = useState<GroupStat[]>([]);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [records, setRecords] = useState<FeedRecord[]>([]);
  const [mixes, setMixes] = useState<MixRecord[]>([]);
  const [ingredients, setIngredients] = useState<IngredientStat[]>([]);
  const [ingredientsByGroup, setIngredientsByGroup] = useState<IngredientStat[]>([]);

  const loadData = useCallback(() => {
    setLoading(true);

    const feedingPromise = fetch(`/api/feeding?from=${dateFrom}&to=${dateTo}`)
      .then((res) => res.json())
      .catch(() => null);

    const mixesPromise = fetch(`/api/feeding/mixes?from=${dateFrom}&to=${dateTo}&limit=100`)
      .then((res) => res.json())
      .catch(() => null);

    const ingredientsPromise = fetch(`/api/feeding/ingredients?from=${dateFrom}&to=${dateTo}`)
      .then((res) => res.json())
      .catch(() => null);

    Promise.all([feedingPromise, mixesPromise, ingredientsPromise]).then(
      ([feedData, mixData, ingredientData]) => {
        if (feedData) {
          setSummary(feedData.summary);
          setGroups(feedData.groups || []);
          setDaily(feedData.daily || []);
          setRecords(feedData.records || []);
        }
        if (mixData) {
          setMixes(mixData.records || []);
        }
        if (ingredientData) {
          setIngredients(ingredientData.byIngredient || []);
          setIngredientsByGroup(ingredientData.byGroup || []);
        }
        setLoading(false);
      }
    );
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDateChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  return (
    <AppLayout title="Кормление">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">🌾 Кормление</h2>
          <p className="page-subtitle">Рационы, потребление, себестоимость, доход минус корм</p>
        </div>
        <div className="page-header-actions">
          <DateRangePicker from={dateFrom} to={dateTo} onChange={handleDateChange} />
          <button className="btn btn-secondary" onClick={() => loadData()}>🔄 Обновить</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: "var(--space-4)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">Загрузка данных кормления...</div>
        </div>
      ) : (
        <>
          {activeTab === "overview" && <OverviewTab summary={summary} daily={daily} groups={groups} />}
          {activeTab === "groups" && <GroupsTab groups={groups} records={records} />}
          {activeTab === "mixes" && <MixesTab mixes={mixes} />}
          {activeTab === "ingredients" && <IngredientsTab ingredients={ingredients} byGroup={ingredientsByGroup} />}
        </>
      )}
    </AppLayout>
  );
}

// ==========================================
// Tab: Обзор
// ==========================================

function OverviewTab({ summary, daily, groups }: { summary: FeedingSummary | null; daily: DailyPoint[]; groups: GroupStat[] }) {
  if (!summary || summary.recordCount === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📭</div>
        <div className="empty-state-text">Нет данных кормления за выбранный период</div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: "var(--space-2)" }}>
          Импортируйте DTM Excel файлы через INBOX/dtm/ или на странице Администрирование
        </p>
      </div>
    );
  }

  const maxGroupActual = Math.max(...groups.map(g => g.totalActual), 1);

  return (
    <>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card green">
          <div className="kpi-header">
            <span className="kpi-label">Подано всего</span>
            <div className="kpi-icon green">🌾</div>
          </div>
          <div className="kpi-value">
            {summary.totalActual.toLocaleString("ru-RU")}
            <span className="kpi-unit">кг</span>
          </div>
          <span className="kpi-change neutral">
            План: {summary.totalPlanned.toLocaleString("ru-RU")} кг
          </span>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-header">
            <span className="kpi-label">Эффективность</span>
            <div className="kpi-icon blue">📈</div>
          </div>
          <div className="kpi-value">
            {summary.efficiency}
            <span className="kpi-unit">%</span>
          </div>
          <span className={`kpi-change ${summary.efficiency >= 95 && summary.efficiency <= 105 ? "positive" : "negative"}`}>
            {summary.efficiency >= 95 && summary.efficiency <= 105 ? "✅ В норме" : "⚠️ Отклонение"}
          </span>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-header">
            <span className="kpi-label">Остаток средний</span>
            <div className="kpi-icon" style={{ background: "rgba(245,158,11,0.12)", color: "var(--warning)" }}>🗑️</div>
          </div>
          <div className="kpi-value">
            {summary.remainderPercent}
            <span className="kpi-unit">%</span>
          </div>
          <span className={`kpi-change ${summary.remainderPercent <= 5 ? "positive" : "negative"}`}>
            {summary.totalRemainder.toLocaleString("ru-RU")} кг остаток
          </span>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-header">
            <span className="kpi-label">Доход минус корм (ср.)</span>
            <div className="kpi-icon purple">💰</div>
          </div>
          <div className="kpi-value">
            {summary.avgIOFC !== 0 ? summary.avgIOFC.toLocaleString("ru-RU") : "—"}
            <span className="kpi-unit">{summary.avgIOFC !== 0 ? "₽" : ""}</span>
          </div>
          <span className="kpi-change neutral">
            {summary.groupCount} групп · {summary.recordCount} записей
          </span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-dashboard" style={{ marginTop: "var(--space-4)" }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">📈 План vs Факт по дням</span>
          </div>
          <div className="card-body">
            <LineChart daily={daily} height={220} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">🏠 Кормление по группам</span>
            <span className="badge badge-neutral">{groups.length} групп</span>
          </div>
          <div className="card-body">
            <MiniBarChart
              data={groups.slice(0, 10).map((g) => ({
                label: g.groupName.length > 12 ? g.groupName.substring(0, 12) + "…" : g.groupName,
                value: g.totalActual,
                color: g.efficiency >= 95 && g.efficiency <= 105 ? "var(--success)" : "var(--warning)",
              }))}
              maxVal={maxGroupActual}
            />
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div className="card" style={{ marginTop: "var(--space-4)" }}>
        <div className="card-header">
          <span className="card-title">📋 Сводка по сухому веществу</span>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--space-4)" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Сухое вещество</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                {summary.totalDryMatter.toLocaleString("ru-RU")} <span style={{ fontSize: 12, fontWeight: 400 }}>кг</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Стоимость на голову</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                {summary.avgFeedCostPerHead !== 0 ? `${summary.avgFeedCostPerHead} ₽` : "—"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Групп в системе</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                {summary.groupCount}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Записей</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                {summary.recordCount.toLocaleString("ru-RU")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ==========================================
// Tab: Группы
// ==========================================

function GroupsTab({ groups, records }: { groups: GroupStat[]; records: FeedRecord[] }) {
  if (groups.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🏠</div>
        <div className="empty-state-text">Нет данных по группам за период</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">🏠 Эффективность по группам / загонам</span>
        <span className="badge badge-neutral">{groups.length} групп</span>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div className="table-container" style={{ maxHeight: 600, overflowY: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Группа / Загон</th>
                <th style={{ textAlign: "right" }}>План (кг)</th>
                <th style={{ textAlign: "right" }}>Факт (кг)</th>
                <th style={{ textAlign: "right" }}>Остаток (кг)</th>
                <th style={{ textAlign: "right" }}>Эфф-ть (%)</th>
                <th style={{ textAlign: "right" }}>Записей</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const isNormal = g.efficiency >= 95 && g.efficiency <= 105;
                return (
                  <tr key={g.groupName}>
                    <td><strong>{g.groupName}</strong></td>
                    <td style={{ textAlign: "right" }}>{g.totalPlanned.toLocaleString("ru-RU")}</td>
                    <td style={{ textAlign: "right" }}>{g.totalActual.toLocaleString("ru-RU")}</td>
                    <td style={{ textAlign: "right" }}>{g.avgRemainder}</td>
                    <td style={{ textAlign: "right" }}>
                      <span className={`badge ${isNormal ? "badge-success" : g.efficiency < 95 ? "badge-danger" : "badge-warning"}`}>
                        {g.efficiency}%
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>{g.recordCount}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 700, borderTop: "2px solid var(--border-primary)" }}>
                <td>Итого</td>
                <td style={{ textAlign: "right" }}>{groups.reduce((s, g) => s + g.totalPlanned, 0).toLocaleString("ru-RU")}</td>
                <td style={{ textAlign: "right" }}>{groups.reduce((s, g) => s + g.totalActual, 0).toLocaleString("ru-RU")}</td>
                <td style={{ textAlign: "right" }}>—</td>
                <td style={{ textAlign: "right" }}>—</td>
                <td style={{ textAlign: "right" }}>{groups.reduce((s, g) => s + g.recordCount, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Tab: Замесы
// ==========================================

function MixesTab({ mixes }: { mixes: MixRecord[] }) {
  if (mixes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔄</div>
        <div className="empty-state-text">Нет данных о замесах за период</div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: "var(--space-2)" }}>
          Импортируйте файл «история замеса» из DTM
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">🔄 История замесов (DTM)</span>
        <span className="badge badge-neutral">{mixes.length} замесов</span>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div className="table-container" style={{ maxHeight: 600, overflowY: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Рецепт</th>
                <th>Код загона</th>
                <th>Дата</th>
                <th>Начало</th>
                <th>Конец</th>
                <th>Загрузка</th>
                <th>Замешивание</th>
                <th>Трактор</th>
                <th>Итого</th>
              </tr>
            </thead>
            <tbody>
              {mixes.map((m, i) => (
                <tr key={m.id}>
                  <td>{m.dtmBatchId || i + 1}</td>
                  <td><strong>{m.recipeName}</strong></td>
                  <td>{m.groupCode || "—"}</td>
                  <td>{formatDate(m.date)}</td>
                  <td>{m.startTime || "—"}</td>
                  <td>{m.endTime || "—"}</td>
                  <td>{m.loadDuration || "—"}</td>
                  <td>{m.mixDuration || "—"}</td>
                  <td>
                    {m.mixer ? (
                      <span className="badge badge-info">{m.mixer}</span>
                    ) : "—"}
                  </td>
                  <td>{m.totalDuration || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Tab: Ингредиенты
// ==========================================

function IngredientsTab({ ingredients, byGroup }: { ingredients: IngredientStat[]; byGroup: IngredientStat[] }) {
  const [subView, setSubView] = useState<"byIngredient" | "byGroup">("byIngredient");

  if (ingredients.length === 0 && byGroup.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🧪</div>
        <div className="empty-state-text">Нет данных о потреблении ингредиентов за период</div>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: "var(--space-2)" }}>
          Импортируйте файл «потребление ингредиентов» из DTM
        </p>
      </div>
    );
  }

  const data = subView === "byIngredient" ? ingredients : byGroup;
  const maxActual = Math.max(...data.map(i => i.totalActual), 1);

  return (
    <>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
        <button
          className={`btn ${subView === "byIngredient" ? "btn-primary" : "btn-secondary"} btn-sm`}
          onClick={() => setSubView("byIngredient")}
        >
          🧪 По ингредиентам ({ingredients.length})
        </button>
        <button
          className={`btn ${subView === "byGroup" ? "btn-primary" : "btn-secondary"} btn-sm`}
          onClick={() => setSubView("byGroup")}
        >
          🏠 По группам / ковшам ({byGroup.length})
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            {subView === "byIngredient" ? "🧪 Потребление по ингредиентам" : "🏠 Потребление по группам / ковшам"}
          </span>
          <span className="badge badge-neutral">{data.length} {subView === "byIngredient" ? "ингредиентов" : "групп"}</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container" style={{ maxHeight: 600, overflowY: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{subView === "byIngredient" ? "Ингредиент" : "Группа / Ковш"}</th>
                  <th style={{ textAlign: "right" }}>Целевой (кг)</th>
                  <th style={{ textAlign: "right" }}>Загружено (кг)</th>
                  <th style={{ textAlign: "right" }}>СВ (кг)</th>
                  <th style={{ textAlign: "right" }}>Ошибка (%)</th>
                  <th style={{ textAlign: "right" }}>Погрешность</th>
                  <th>Загрузка</th>
                </tr>
              </thead>
              <tbody>
                {data.map((ing) => {
                  const errorClass = Math.abs(ing.avgError) <= 3 ? "badge-success" : Math.abs(ing.avgError) <= 10 ? "badge-warning" : "badge-danger";
                  const barWidth = (ing.totalActual / maxActual) * 100;
                  const name = subView === "byIngredient" ? ing.ingredientName : (ing as any).groupName || ing.ingredientName;
                  return (
                    <tr key={name}>
                      <td><strong>{name}</strong></td>
                      <td style={{ textAlign: "right" }}>{ing.totalTarget.toLocaleString("ru-RU")}</td>
                      <td style={{ textAlign: "right" }}>{ing.totalActual.toLocaleString("ru-RU")}</td>
                      <td style={{ textAlign: "right" }}>{ing.totalDM.toLocaleString("ru-RU")}</td>
                      <td style={{ textAlign: "right" }}>
                        <span className={`badge ${errorClass}`}>
                          {ing.avgError > 0 ? "+" : ""}{ing.avgError}%
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>{ing.avgErrorAbs}%</td>
                      <td style={{ width: 120 }}>
                        <div style={{
                          width: "100%", height: 8, background: "var(--bg-elevated)",
                          borderRadius: "var(--radius-full)", overflow: "hidden"
                        }}>
                          <div style={{
                            width: `${barWidth}%`, height: "100%",
                            background: Math.abs(ing.avgError) <= 3 ? "var(--success)" : Math.abs(ing.avgError) <= 10 ? "var(--warning)" : "var(--danger)",
                            borderRadius: "var(--radius-full)", transition: "width 0.5s ease"
                          }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, borderTop: "2px solid var(--border-primary)" }}>
                  <td>Итого</td>
                  <td style={{ textAlign: "right" }}>{data.reduce((s, i) => s + i.totalTarget, 0).toLocaleString("ru-RU")}</td>
                  <td style={{ textAlign: "right" }}>{data.reduce((s, i) => s + i.totalActual, 0).toLocaleString("ru-RU")}</td>
                  <td style={{ textAlign: "right" }}>{data.reduce((s, i) => s + i.totalDM, 0).toLocaleString("ru-RU")}</td>
                  <td style={{ textAlign: "right" }}>Средн: {(data.reduce((s, i) => s + i.avgError, 0) / data.length || 0).toFixed(2)}%</td>
                  <td style={{ textAlign: "right" }}>Средн: {(data.reduce((s, i) => s + i.avgErrorAbs, 0) / data.length || 0).toFixed(2)}%</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
