"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import ExportButton from "@/components/ui/ExportButton";

type TabId = "health" | "mastitis" | "ketosis" | "digestion" | "abortion" | "lameness";

const TAB_CONFIG: { id: TabId; label: string; icon: string; color: string; colorVar: string }[] = [
  { id: "health",    label: "Общее здоровье", icon: "💊", color: "danger",  colorVar: "var(--danger)" },
  { id: "mastitis",  label: "Мастит",         icon: "🔴", color: "danger",  colorVar: "var(--danger)" },
  { id: "ketosis",   label: "Кетоз",          icon: "🟡", color: "amber",   colorVar: "var(--warning)" },
  { id: "digestion", label: "Пищеварение",    icon: "🟠", color: "orange",  colorVar: "var(--accent-orange, #f97316)" },
  { id: "abortion",  label: "Аборты",         icon: "⚠️", color: "danger",  colorVar: "var(--danger)" },
  { id: "lameness",  label: "Хромота",        icon: "🦿", color: "purple",  colorVar: "var(--primary-400)" },
];

export default function HealthPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("health");

  useEffect(() => {
    fetch("/api/farm")
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <AppLayout title="Здоровье">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">Загрузка...</div>
        </div>
      </AppLayout>
    );
  }

  const { afimilk, kpi } = data;

  const counts: Record<TabId, number> = {
    health:    afimilk.healthIssues?.items.length || 0,
    mastitis:  afimilk.mastitisSuspects?.items.length || 0,
    ketosis:   afimilk.ketosisSuspects?.items.length || 0,
    digestion: afimilk.digestionProblems?.items.length || 0,
    abortion:  afimilk.abortionSuspects?.items.length || 0,
    lameness:  afimilk.lamenessSuspects?.items?.length || 0,
  };

  return (
    <AppLayout title="Здоровье" alertCount={kpi.herdAlerts}>
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">💊 Здоровье стада</h2>
          <p className="page-subtitle">Данные Afimilk Health Analytics · {kpi.herdAlerts} тревог</p>
        </div>
        <div className="page-header-actions">
          <ExportButton
            data={[
              ...(afimilk.healthIssues?.items || []).map((i: any) => ({ Корова: i.cow, Тип: "Здоровье", Группа: i.group, Лактация: i.lactationNumber, DIM: i.dim, Отклонение: i.yieldLast24HPercent })),
              ...(afimilk.mastitisSuspects?.items || []).map((i: any) => ({ Корова: i.cow, Тип: "Мастит", Группа: i.group, Лактация: i.lactationNumber, DIM: i.dim, Отклонение: "" })),
              ...(afimilk.ketosisSuspects?.items || []).map((i: any) => ({ Корова: i.cow, Тип: "Кетоз", Группа: i.group, Лактация: i.lactationNumber, DIM: i.dim, Отклонение: "" })),
            ]}
            filename="здоровье"
          />
        </div>
      </div>

      {/* KPI-кнопки — кликабельные */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "var(--space-3)",
        marginBottom: "var(--space-4)"
      }}>
        {TAB_CONFIG.map(tab => {
          const isActive = activeTab === tab.id;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-lg)",
                border: isActive ? `2px solid ${tab.colorVar}` : "2px solid var(--border-secondary)",
                background: isActive ? "var(--bg-elevated)" : "var(--bg-card)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isActive ? `0 0 12px ${tab.colorVar}33` : "none",
                textAlign: "left",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Top color bar */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: isActive ? tab.colorVar : "var(--border-secondary)",
                transition: "background 0.2s ease",
              }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 16 }}>{tab.icon}</span>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {tab.label}
                </span>
              </div>
              <div style={{
                fontSize: 28, fontWeight: 700,
                color: count > 0 ? tab.colorVar : "var(--text-muted)",
                lineHeight: 1,
              }}>
                {count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Контент */}
      {activeTab === "health" && afimilk.healthIssues && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">💊 Общее здоровье — проблемные коровы</span>
            <span className="badge badge-danger">{counts.health} голов</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container" style={{ maxHeight: 500, overflowY: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Корова</th>
                    <th>Группа</th>
                    <th>Статус</th>
                    <th>Лактация</th>
                    <th>DIM</th>
                    <th>Ср. надой</th>
                    <th>Надой 24ч</th>
                    <th>Откл. 24ч</th>
                    <th>Откл. прод. S1</th>
                    <th>Откл. отдыха S3</th>
                  </tr>
                </thead>
                <tbody>
                  {afimilk.healthIssues.items
                    .sort((a: any, b: any) => (a.yieldLast24HPercent ?? 0) - (b.yieldLast24HPercent ?? 0))
                    .map((item: any) => (
                    <tr key={item.cow} style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${item.cow}`)}>
                      <td><strong>#{item.cow}</strong></td>
                      <td>{item.group}</td>
                      <td><span className={`badge ${item.status === "Дойная" ? "badge-success" : "badge-info"}`}>{item.status}</span></td>
                      <td>{item.lactationNumber}</td>
                      <td>{item.dim}</td>
                      <td>{item.dailyAverageYield ? `${(item.dailyAverageYield / 1000).toFixed(1)}` : "—"}</td>
                      <td>{item.yieldLast24H ? `${(item.yieldLast24H / 1000).toFixed(1)}` : "—"}</td>
                      <td>
                        {item.yieldLast24HPercent !== null ? (
                          <span className={`badge ${item.yieldLast24HPercent < -30 ? "badge-danger" : item.yieldLast24HPercent < -15 ? "badge-warning" : "badge-success"}`}>
                            {item.yieldLast24HPercent > 0 ? "+" : ""}{item.yieldLast24HPercent}%
                          </span>
                        ) : "—"}
                      </td>
                      <td>{item.productionRateDeviationS1 !== null ? `${item.productionRateDeviationS1}%` : "—"}</td>
                      <td>{item.restTimeDeviationS3 !== null ? `${item.restTimeDeviationS3}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "mastitis" && afimilk.mastitisSuspects && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔴 Подозрение на клинический мастит</span>
            <span className="badge badge-danger">{counts.mastitis} голов</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Корова</th><th>Группа</th><th>Лактация</th><th>DIM</th></tr>
                </thead>
                <tbody>
                  {afimilk.mastitisSuspects.items.map((item: any) => (
                    <tr key={item.cow} style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${item.cow}`)}>
                      <td><strong>#{item.cow}</strong></td>
                      <td>{item.group}</td>
                      <td>{item.lactationNumber}</td>
                      <td>{item.dim}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "ketosis" && afimilk.ketosisSuspects && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">🟡 Подозрение на кетоз</span>
            <span className="badge badge-warning">{counts.ketosis} голов</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Корова</th><th>Группа</th><th>Лактация</th><th>DIM</th><th>Ср. надой</th></tr>
                </thead>
                <tbody>
                  {afimilk.ketosisSuspects.items.map((item: any) => (
                    <tr key={item.cow} style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${item.cow}`)}>
                      <td><strong>#{item.cow}</strong></td>
                      <td>{item.group}</td>
                      <td>{item.lactationNumber}</td>
                      <td>{item.dim}</td>
                      <td>{item.dailyAverageYield ? `${(item.dailyAverageYield / 1000).toFixed(1)} кг` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "digestion" && afimilk.digestionProblems && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">🟠 Проблемы пищеварения</span>
            <span className="badge badge-warning">{counts.digestion} голов</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Корова</th><th>Группа</th><th>Статус</th><th>Лактация</th><th>DIM</th></tr>
                </thead>
                <tbody>
                  {afimilk.digestionProblems.items.map((item: any) => (
                    <tr key={item.cow} style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${item.cow}`)}>
                      <td><strong>#{item.cow}</strong></td>
                      <td>{item.group}</td>
                      <td><span className="badge badge-neutral">{item.status}</span></td>
                      <td>{item.lactationNumber}</td>
                      <td>{item.dim}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "abortion" && afimilk.abortionSuspects && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚠️ Подозрение на аборт</span>
            <span className="badge badge-danger">{counts.abortion} голов</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Корова</th><th>Группа</th><th>Гин. статус</th><th>Лактация</th><th>DIM</th><th>Осеменений</th></tr>
                </thead>
                <tbody>
                  {afimilk.abortionSuspects.items.map((item: any) => (
                    <tr key={item.cow} style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${item.cow}`)}>
                      <td><strong>#{item.cow}</strong></td>
                      <td>{item.group}</td>
                      <td>{item.gynStatus}</td>
                      <td>{item.lactationNumber}</td>
                      <td>{item.dim}</td>
                      <td>{item.inseminationNumber ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "lameness" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">🦿 Хромота</span>
            <span className="badge badge-info">{counts.lameness} голов</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {afimilk.lamenessSuspects?.items?.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Корова</th><th>Группа</th><th>Статус</th><th>Лактация</th><th>DIM</th></tr>
                  </thead>
                  <tbody>
                    {afimilk.lamenessSuspects.items.map((item: any) => (
                      <tr key={item.cow} style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${item.cow}`)}>
                        <td><strong>#{item.cow}</strong></td>
                        <td>{item.group}</td>
                        <td><span className="badge badge-neutral">{item.status}</span></td>
                        <td>{item.lactationNumber}</td>
                        <td>{item.dim}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "var(--space-6)" }}>
                <div className="empty-state-icon">✅</div>
                <div className="empty-state-text">Хромых коров не обнаружено</div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
