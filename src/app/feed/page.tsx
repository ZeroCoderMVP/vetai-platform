"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";

export default function FeedWorkspacePage() {
  const [feedRecords, setFeedRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // For Stage 3 demo, we just fetch from the existing feed analytics (e.g., getting records directly or using mock)
  // Since we already have seed data in FeedRecord, we can just fetch it.
  
  useEffect(() => {
    // We can simulate fetching feed records from an API
    // Wait, let's just use some static demo data representing plan vs fact based on feedRecords to show the UI
    setTimeout(() => {
      setFeedRecords([
        { id: 1, groupName: "Новотельные 1", recipe: "MILK_EARLY", planned: 1250, actual: 1200, corrPercent: 96, milkYield: 2450 },
        { id: 2, groupName: "Высокопродуктивные", recipe: "MILK_HIGH", planned: 2400, actual: 2510, corrPercent: 104, milkYield: 3800 },
        { id: 3, groupName: "Сухостой 1", recipe: "DRY_1", planned: 800, actual: 650, corrPercent: 81, milkYield: 0 },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <AppLayout title="Рабочее место специалиста: Кормление">
      <div className="page-header" style={{ borderLeft: "8px solid #E57A00", paddingLeft: 16 }}>
        <div className="page-header-left">
          <h2 className="page-title">🌾 Кормление (Рационы и Раздача)</h2>
          <p className="page-subtitle">Оперативный контроль раздачи монокорма (DTM: План vs Факт).</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Точность раздачи (вчера)</span></div>
          <div className="card-body">
            <h2 style={{ fontSize: 32, margin: 0, color: "var(--success)" }}>96.5%</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>+2.1% к норме DTM</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Группы с отклонениями &gt; 10%</span></div>
          <div className="card-body">
            <h2 style={{ fontSize: 32, margin: 0, color: "var(--danger)" }}>1</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>Сухостой 1 (Недокорм)</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
           <h3 className="card-title">Анализ потребления (План / Факт)</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
             <div style={{ padding: 24, textAlign: "center" }}>Загрузка данных DTM...</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Секция / Группа</th>
                    <th>Рецепт</th>
                    <th>План раздачи (кг)</th>
                    <th>Факт раздача (кг)</th>
                    <th>Точность (%)</th>
                    <th>Надой группы (кг)</th>
                  </tr>
                </thead>
                <tbody>
                  {feedRecords.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 500 }}>{f.groupName}</td>
                      <td><span className="badge badge-neutral">{f.recipe}</span></td>
                      <td>{f.planned}</td>
                      <td style={{ fontWeight: 600 }}>{f.actual}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: f.corrPercent < 90 || f.corrPercent > 110 ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>
                            {f.corrPercent}%
                          </span>
                          <div style={{ width: 60, height: 6, background: "var(--bg-elevated)", borderRadius: 3, overflow: "hidden" }}>
                             <div style={{ height: "100%", width: `${Math.min(f.corrPercent, 100)}%`, background: f.corrPercent < 90 || f.corrPercent > 110 ? "var(--danger)" : "var(--success)" }} />
                          </div>
                        </div>
                      </td>
                      <td>{f.milkYield > 0 ? f.milkYield : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
