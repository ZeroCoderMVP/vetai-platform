"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";

export default function ReproductionPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("heat");

  useEffect(() => {
    fetch("/api/farm")
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <AppLayout title="Воспроизводство">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">Загрузка...</div>
        </div>
      </AppLayout>
    );
  }

  const { afimilk, kpi } = data;

  const tabs = [
    { id: "heat", label: "Подозрение на охоту", count: afimilk.heatSuspects?.items.length || 0 },
    { id: "breed", label: "К осеменению", count: afimilk.animalsToBreed?.items.length || 0 },
    { id: "calving", label: "Ожидают отёл", count: afimilk.calvingAnimals?.items.length || 0 },
    { id: "fresh", label: "Свежие коровы", count: afimilk.freshCows?.items.length || 0 },
  ];

  return (
    <AppLayout title="Воспроизводство" alertCount={kpi.herdAlerts}>
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">🧬 Воспроизводство</h2>
          <p className="page-subtitle">Данные Afimilk · Охота, осеменение, отёлы</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card amber">
          <div className="kpi-header">
            <span className="kpi-label">В охоте</span>
          </div>
          <div className="kpi-value">{kpi.heatSuspects}</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-header">
            <span className="kpi-label">К осеменению</span>
          </div>
          <div className="kpi-value">{kpi.toBreed}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-header">
            <span className="kpi-label">Ожидают отёл</span>
          </div>
          <div className="kpi-value">{kpi.calving}</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-header">
            <span className="kpi-label">Свежие коровы</span>
          </div>
          <div className="kpi-value">{kpi.freshCows}</div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button key={tab.id} className={`tab ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Охота */}
      {activeTab === "heat" && afimilk.heatSuspects && (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container" style={{ maxHeight: 500, overflowY: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Корова</th>
                    <th>Группа</th>
                    <th>Гин. статус</th>
                    <th>Лактация</th>
                    <th>DIM</th>
                    <th>Возраст (мес)</th>
                    <th>Дней после охоты</th>
                    <th>Дней после осем.</th>
                    <th>Инд. охоты S1</th>
                    <th>Инд. охоты S3</th>
                  </tr>
                </thead>
                <tbody>
                  {afimilk.heatSuspects.items
                    .sort((a: any, b: any) => (b.heatIndicatorS1 ?? 0) - (a.heatIndicatorS1 ?? 0))
                    .map((item: any, i: number) => (
                    <tr key={`${item.cow}-${i}`} style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${item.cowId || item.cow}`)}>
                      <td><strong>#{item.cow}</strong></td>
                      <td>{item.group}</td>
                      <td>
                        <span className={`badge ${
                          item.gynStatus === "Охота" ? "badge-warning" :
                          item.gynStatus === "Стельная" ? "badge-primary" :
                          "badge-neutral"
                        }`}>{item.gynStatus}</span>
                      </td>
                      <td>{item.lactationNumber}</td>
                      <td>{item.dim}</td>
                      <td>{item.ageInMonths?.toFixed(1)}</td>
                      <td>{item.daysAfterHeat ?? "—"}</td>
                      <td>{item.daysAfterInsemination ?? "—"}</td>
                      <td>
                        <span className={`badge ${(item.heatIndicatorS1 ?? 0) > 100 ? "badge-danger" : (item.heatIndicatorS1 ?? 0) > 50 ? "badge-warning" : "badge-neutral"}`}>
                          {item.heatIndicatorS1 ?? "—"}
                        </span>
                      </td>
                      <td>{item.heatIndicatorS3 ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* К осеменению */}
      {activeTab === "breed" && afimilk.animalsToBreed && (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container" style={{ maxHeight: 500, overflowY: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Корова</th>
                    <th>Группа</th>
                    <th>Лактация</th>
                    <th>DIM</th>
                    <th>Ср. надой, кг</th>
                    <th>Осеменений</th>
                    <th>Дней после охоты</th>
                    <th>В охоте с</th>
                    <th>Инд. S1</th>
                    <th>Инд. S3</th>
                  </tr>
                </thead>
                <tbody>
                  {afimilk.animalsToBreed.items.map((item: any, i: number) => (
                    <tr key={`${item.cow}-${i}`} style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${item.cowId || item.cow}`)}>
                      <td><strong>#{item.cow}</strong></td>
                      <td>{item.group}</td>
                      <td>{item.lactationNumber}</td>
                      <td>{item.dim}</td>
                      <td>{item.dailyAverageYield}</td>
                      <td>{item.inseminationNumber ?? "—"}</td>
                      <td>{item.daysAfterHeat ?? "—"}</td>
                      <td>{item.inHeatStarted ?? "—"}</td>
                      <td><span className={`badge ${(item.heatIndicatorS1 ?? 0) > 100 ? "badge-danger" : "badge-neutral"}`}>{item.heatIndicatorS1 ?? "—"}</span></td>
                      <td>{item.heatIndicatorS3 ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Отёл */}
      {activeTab === "calving" && afimilk.calvingAnimals && (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Корова</th><th>Группа</th><th>Лактация</th></tr>
                </thead>
                <tbody>
                  {afimilk.calvingAnimals.items.map((item: any, i: number) => (
                    <tr key={`${item.cow}-${i}`} style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${item.cowId || item.cow}`)}>
                      <td><strong>#{item.cow}</strong></td>
                      <td>{item.group}</td>
                      <td>{item.lactationNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Свежие */}
      {activeTab === "fresh" && afimilk.freshCows && (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Корова</th><th>Группа</th><th>Лактация</th><th>DIM</th></tr>
                </thead>
                <tbody>
                  {afimilk.freshCows.items.map((item: any, i: number) => (
                    <tr key={`${item.cow}-${i}`} style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${item.cowId || item.cow}`)}>
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
    </AppLayout>
  );
}
