"use client";

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DateRangePicker from "@/components/ui/DateRangePicker";
import ExportButton from "@/components/ui/ExportButton";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export default function MilkingPage() {
  const [data, setData] = useState<any>(null);
  const [dbData, setDbData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(getToday());
  const [dateTo, setDateTo] = useState(getToday());
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");

  const loadData = useCallback(() => {
    setLoading(true);

    const farmPromise = fetch("/api/farm")
      .then((res) => res.json())
      .catch(() => null);

    const dbPromise = fetch(`/api/milking?from=${dateFrom}&to=${dateTo}&limit=500`)
      .then((res) => res.json())
      .catch(() => null);

    Promise.all([farmPromise, dbPromise]).then(([farmData, milkingDB]) => {
      if (farmData) setData(farmData);
      if (milkingDB) setDbData(milkingDB);
      setLoading(false);
    });
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDateChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    setActiveTab("history");
  };

  if (loading || !data) {
    return (
      <AppLayout title="Учёт молока">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">Загрузка...</div>
        </div>
      </AppLayout>
    );
  }

  const { milkingSummary, milkingRecords, kpi } = data;

  if (data?.status === "no_data" && dbData?.status === "no_data") {
    return (
      <AppLayout title="Учёт молока">
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">Данные не загружены. Импортируйте AIC в SQLite.</div>
        </div>
      </AppLayout>
    );
  }

  // Группируем файловые записи по номеру доения
  const byMilking: Record<number, any[]> = {};
  for (const r of milkingRecords) {
    if (r.cowNumber === "0" || r.yield <= 0) continue;
    if (!byMilking[r.milkingNumber]) byMilking[r.milkingNumber] = [];
    byMilking[r.milkingNumber].push(r);
  }

  const milkingLabels: Record<number, string> = { 1: "Утренняя", 2: "Дневная", 3: "Вечерняя" };

  return (
    <AppLayout title="Учёт молока" alertCount={kpi.herdAlerts}>
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">🥛 Учёт молока</h2>
          <p className="page-subtitle">Данные AIC Waikato DairyTRACE · {milkingSummary.date}</p>
        </div>
        <div className="page-header-actions">
          <DateRangePicker from={dateFrom} to={dateTo} onChange={handleDateChange} />
          <ExportButton
            data={milkingRecords.filter((r: any) => r.cowNumber !== "0" && r.yield > 0).map((r: any) => ({ Корова: r.cowNumber, Стойло: r.stall, Надой: r.yield, SCC: r.scc, Проводимость: r.conductivity, Полнота: r.completeness }))}
            filename="доение"
          />
          <button className="btn btn-secondary" onClick={() => loadData()}>
            🔄
          </button>
        </div>
      </div>

      {/* Табы: Текущая сессия / История */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "live" ? "active" : ""}`}
          onClick={() => setActiveTab("live")}
        >
          📡 Текущая сессия
        </button>
        <button
          className={`tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          📊 По периоду{dbData?.summary?.recordCount > 0 ? ` (${dbData.summary.recordCount})` : ""}
        </button>
      </div>

      {/* KPI — всегда показываем файловые (текущая сессия) */}
      <div className="kpi-grid">
        <div className="kpi-card green">
          <div className="kpi-header">
            <span className="kpi-label">
              {activeTab === "live" ? "Общий надой (сессия)" : "Надой за период"}
            </span>
            <div className="kpi-icon green">🥛</div>
          </div>
          <div className="kpi-value">
            {activeTab === "live"
              ? milkingSummary.totalYield.toLocaleString("ru-RU")
              : (dbData?.summary?.totalYield || 0).toLocaleString("ru-RU")}
            <span className="kpi-unit">кг</span>
          </div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-header">
            <span className="kpi-label">Среднее на доение</span>
            <div className="kpi-icon blue">📊</div>
          </div>
          <div className="kpi-value">
            {activeTab === "live"
              ? milkingSummary.averageYield.toFixed(1)
              : (dbData?.summary?.avgYield || 0).toFixed(1)}
            <span className="kpi-unit">кг</span>
          </div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-header">
            <span className="kpi-label">Коров подоено</span>
            <div className="kpi-icon purple">🐄</div>
          </div>
          <div className="kpi-value">
            {activeTab === "live" ? milkingSummary.totalCows : (dbData?.summary?.cowCount || 0)}
          </div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-header">
            <span className="kpi-label">SCC {'>'} 400</span>
            <div className="kpi-icon amber">🧪</div>
          </div>
          <div className="kpi-value">{milkingSummary.bySCC.high}</div>
          <span className={`kpi-change ${milkingSummary.bySCC.high > 3 ? "negative" : "positive"}`}>
            {milkingSummary.bySCC.high > 3 ? "⚠️ Повышено" : "✅ Норма"}
          </span>
        </div>
      </div>

      {activeTab === "live" ? (
        /* Текущая сессия — файловые данные */
        <>
          {Object.entries(byMilking).sort(([a], [b]) => Number(a) - Number(b)).map(([milkingNum, records]) => {
            const totalYield = records.reduce((s: number, r: any) => s + r.yield, 0);
            return (
              <div key={milkingNum} className="card" style={{ marginBottom: "var(--space-4)" }}>
                <div className="card-header">
                  <span className="card-title">
                    {milkingLabels[Number(milkingNum)] || `Доение #${milkingNum}`} дойка
                  </span>
                  <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                    <span className="badge badge-neutral">{records.length} коров</span>
                    <span className="badge badge-primary">{totalYield.toFixed(1)} кг</span>
                  </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <div className="table-container" style={{ maxHeight: 350, overflowY: "auto" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Корова</th>
                          <th>Стойло</th>
                          <th>Время</th>
                          <th>Надой, кг</th>
                          <th>Длительность, мин</th>
                          <th>Полнота, %</th>
                          <th>Проводимость</th>
                          <th>SCC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.sort((a: any, b: any) => b.yield - a.yield).map((r: any, i: number) => (
                          <tr key={i}>
                            <td><strong>#{r.cowNumber}</strong></td>
                            <td>{r.stall}</td>
                            <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                              {r.time.substring(0, 2)}:{r.time.substring(2, 4)}
                            </td>
                            <td><strong>{r.yield}</strong></td>
                            <td>{r.duration}</td>
                            <td>{r.completeness}%</td>
                            <td>{r.conductivity}</td>
                            <td>
                              <span className={`badge ${r.scc < 200 ? "badge-success" : r.scc < 400 ? "badge-warning" : "badge-danger"}`}>
                                {r.scc}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      ) : (
        /* История — данные из БД */
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Записи доения за период {dateFrom} — {dateTo}</span>
            <span className="badge badge-neutral">{dbData?.pagination?.total || 0} записей</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {dbData?.records && dbData.records.length > 0 ? (
              <div className="table-container" style={{ maxHeight: 500, overflowY: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Корова</th>
                      <th>Доение</th>
                      <th>Надой, кг</th>
                      <th>SCC</th>
                      <th>Проводимость</th>
                      <th>Длительность</th>
                      <th>Источник</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbData.records.map((r: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                          {new Date(r.date).toLocaleDateString("ru-RU")}
                        </td>
                        <td><strong>#{r.cowNumber}</strong></td>
                        <td>{milkingLabels[r.session] || `#${r.session}`}</td>
                        <td><strong>{r.yield?.toFixed(1)}</strong></td>
                        <td>
                          {r.scc !== null ? (
                            <span className={`badge ${r.scc < 200 ? "badge-success" : r.scc < 400 ? "badge-warning" : "badge-danger"}`}>
                              {r.scc}
                            </span>
                          ) : "—"}
                        </td>
                        <td>{r.conductivity ?? "—"}</td>
                        <td>{r.duration ? `${r.duration} мин` : "—"}</td>
                        <td><span className="badge badge-neutral">{r.source}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "var(--space-8)" }}>
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-text">
                  Нет данных за выбранный период. Загрузите файлы через INBOX или запустите импорт.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
