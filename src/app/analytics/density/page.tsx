"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";

export default function SectionHeatmapPage() {
  const [barns, setBarns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For the UI demo, we'll generate some realistic dummy barn/section layout
    setTimeout(() => {
      setBarns([
        {
          id: "b1",
          name: "Корпус 1 (Дойные)",
          capacity: 400,
          sections: [
            { id: "s1", name: "Секция 1А (Новотельные)", currentCows: 42, capacity: 40, status: "overcrowded", issues: 3 },
            { id: "s2", name: "Секция 1Б (Высокая пр.)", currentCows: 50, capacity: 60, status: "normal", issues: 1 },
            { id: "s3", name: "Секция 1В", currentCows: 58, capacity: 60, status: "normal", issues: 0 },
            { id: "s4", name: "Секция 1Г", currentCows: 61, capacity: 60, status: "warning", issues: 2 },
          ]
        },
        {
          id: "b2",
          name: "Корпус 2 (Сухостой и Родилка)",
          capacity: 200,
          sections: [
            { id: "s5", name: "Родильное отд.", currentCows: 12, capacity: 15, status: "normal", issues: 5 }, // 5 health issues (calving)
            { id: "s6", name: "Сухостой 1", currentCows: 80, capacity: 80, status: "warning", issues: 0 },
            { id: "s7", name: "Сухостой 2", currentCows: 60, capacity: 100, status: "normal", issues: 1 },
          ]
        },
        {
          id: "b3",
          name: "Изолятор / Лазарет",
          capacity: 50,
          sections: [
            { id: "s8", name: "Изолятор А (Мастит)", currentCows: 18, capacity: 20, status: "critical_health", issues: 18 },
            { id: "s9", name: "Изолятор Б (Хромота)", currentCows: 25, capacity: 20, status: "critical_health_overcrowded", issues: 25 },
          ]
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getBackgroundColor = (status: string) => {
    if (status.includes("overcrowded")) return "var(--danger)";
    if (status.includes("critical_health")) return "var(--warning)";
    if (status === "warning") return "#eab308";
    return "var(--success)";
  };

  const getStatusText = (status: string) => {
    if (status === "critical_health_overcrowded") return "Перенаселение + Инфекции";
    if (status === "overcrowded") return "Перенаселение (Угроза иерархии)";
    if (status === "critical_health") return "Концентрация больных";
    if (status === "warning") return "Плотность 95-100%";
    return "Норма (< 95%)";
  };

  return (
    <AppLayout title="Тепловая карта секций">
      <div className="page-header" style={{ borderLeft: "8px solid #8b5cf6", paddingLeft: 16 }}>
        <div className="page-header-left">
          <h2 className="page-title">🗺️ Section Heatmap</h2>
          <p className="page-subtitle">Топология фермы: перенаселение и очаги заболеваний.</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: "var(--success)" }} /> Норма</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: "#eab308" }} /> Плотность ~100%</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: "var(--danger)" }} /> Перенаселение (&gt;100%)</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 16, height: 16, borderRadius: 4, background: "var(--warning)" }} /> Очаг Здоровья</div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}>Рендеринг карты...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {barns.map(barn => (
            <div key={barn.id} className="card" style={{ background: "transparent", border: "2px dashed var(--border-secondary)", boxShadow: "none" }}>
              <div className="card-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <h3 className="card-title" style={{ fontSize: 18 }}>{barn.name}</h3>
              </div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                  {barn.sections.map((section: any) => {
                     const density = Math.round((section.currentCows / section.capacity) * 100);
                     return (
                       <div 
                         key={section.id} 
                         style={{ 
                           background: getBackgroundColor(section.status),
                           color: "white",
                           padding: 20,
                           borderRadius: 12,
                           boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                           position: "relative",
                           overflow: "hidden"
                         }}
                       >
                         {/* Subtle pattern overlay */}
                         <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: "radial-gradient(#fff 2px, transparent 2px)", backgroundSize: "16px 16px" }} />
                         
                         <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                           <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{section.name}</h4>
                           <div style={{ background: "rgba(0,0,0,0.2)", padding: "4px 8px", borderRadius: 16, fontSize: 12, fontWeight: 600 }}>
                             {density}%
                           </div>
                         </div>
                         
                         <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                           <div>
                             <span style={{ opacity: 0.8 }}>Головы: </span>
                             <strong style={{ fontSize: 16 }}>{section.currentCows} / {section.capacity}</strong>
                           </div>
                           {section.issues > 0 && (
                             <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 12 }}>
                               ⚠️ {section.issues}
                             </div>
                           )}
                         </div>

                         <div style={{ position: "relative", zIndex: 1, marginTop: 12, fontSize: 12, opacity: 0.9 }}>
                           {getStatusText(section.status)}
                         </div>
                       </div>
                     );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
