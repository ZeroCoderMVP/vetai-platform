"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";

type SectionItem = {
  id: string;
  name: string;
  type: string;
  _count: { currentCows: number };
};

type BarnItem = {
  id: string;
  name: string;
  sections: SectionItem[];
  _count: { cows: number };
};

export default function SectionsPage() {
  const [barns, setBarns] = useState<BarnItem[]>([]);
  const [timeline, setTimeline] = useState<Record<string, Record<string, { arrivals: number, departures: number }>> | null>(null);
  const [sysDate, setSysDate] = useState<string>("");
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSections() {
      try {
        const res = await fetch("/api/sections");
        const json = await res.json();
        if (json.success) {
          setBarns(json.data);
          if (json.timeline) setTimeline(json.timeline);
          if (json.sysDate) setSysDate(json.sysDate);
        } else {
          setError(json.error || "Ошибка загрузки списка секций");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSections();
  }, []);

  if (loading) return <div className="p-8">Загрузка секций...</div>;
  if (error) return <div className="p-8 text-red-500">Ошибка: {error}</div>;

  const getCurrentDateStr = () => {
    if (!sysDate) return "";
    const d = new Date(sysDate);
    d.setDate(d.getDate() - offset);
    return d.toISOString().split("T")[0];
  };

  const viewDateStr = getCurrentDateStr();

  return (
    <AppLayout title="Размещение">
      <div className="space-y-8">
      <div className="page-header" style={{ flexWrap: 'wrap' }}>
        <div className="page-header-left">
          <h2 className="page-title">Карта местности (Размещение)</h2>
          <p className="page-subtitle">Здания и секции для распределения животных</p>
        </div>
        
        {sysDate && timeline && (
           <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--bg-elevated)", padding: "12px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", minWidth: 300 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "var(--text-secondary)" }}>
                 <span>Движение: {offset === 0 ? "Сегодня (" + sysDate + ")" : offset + " дней назад"}</span>
                 <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{viewDateStr}</span>
              </div>
              <input 
                 type="range" 
                 min="-30" max="0" 
                 value={-offset} 
                 onChange={e => setOffset(-parseInt(e.target.value))} 
                 style={{ width: "100%", cursor: "pointer", accentColor: "var(--primary-400)" }}
              />
           </div>
        )}
      </div>

      {barns.length === 0 ? (
        <div className="empty-state">
           <div className="empty-state-icon">🛖</div>
           <div className="empty-state-text">В системе пока нет зданий или секций.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "var(--space-6)", alignItems: "start" }}>
          {barns.map((barn) => (
            <div key={barn.id} className="card">
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{ fontSize: 20 }}>🛖</span>
                <h2 className="card-title" style={{ fontSize: 18, flex: 1, margin: 0 }}>{barn.name}</h2>
                <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  Всего: {barn._count.cows} гол.
                </span>
              </div>

              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-4)" }}>
                {barn.sections.length === 0 ? (
                  <div style={{ gridColumn: "1 / -1", fontSize: 13, color: "var(--text-tertiary)", fontStyle: "italic" }}>Секций пока нет</div>
                ) : (
                  barn.sections.map((section) => {
                    const typeStr = (section.type || "").toLowerCase();
                    let hexColor = "var(--text-secondary)";
                    let bgColor = "var(--bg-elevated)";
                    let icon = "🐄";
                    
                    if (typeStr.includes("родильн") || typeStr.includes("отел") || typeStr.includes("calving") || typeStr.includes("maternity")) {
                      hexColor = "var(--primary-400)";
                      bgColor = "rgba(15, 168, 122, 0.08)";
                      icon = "🤰";
                    } else if (typeStr.includes("дойная") || typeStr.includes("milk")) {
                      hexColor = "var(--accent-blue)";
                      bgColor = "rgba(59, 130, 246, 0.08)";
                      icon = "🥛";
                    } else if (typeStr.includes("сухостой") || typeStr.includes("dry")) {
                      hexColor = "var(--accent-amber)";
                      bgColor = "rgba(245, 158, 11, 0.08)";
                      icon = "💤";
                    } else if (typeStr.includes("телят") || typeStr.includes("calf") || typeStr.includes("heifers")) {
                      hexColor = "var(--accent-purple)";
                      bgColor = "rgba(139, 92, 246, 0.08)";
                      icon = "🍼";
                    }

                    const dayData = timeline && timeline[section.id] && timeline[section.id][viewDateStr] 
                       ? timeline[section.id][viewDateStr] 
                       : { arrivals: 0, departures: 0 };

                    return (
                      <Link href={`/sections/${section.id}`} key={section.id} style={{ textDecoration: 'none', display: 'block' }}>
                        <div style={{
                          height: "100%",
                          borderRadius: "var(--radius-lg)",
                          border: `1px solid ${hexColor}`,
                          background: bgColor,
                          padding: "var(--space-4)",
                          transition: "var(--transition-fast)",
                          display: "flex",
                          flexDirection: "column"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-3)" }}>
                            <div style={{ 
                               fontSize: 24, 
                               background: "var(--bg-surface)", 
                               borderRadius: "var(--radius-md)", 
                               width: 36, height: 36, 
                               display: "flex", alignItems: "center", justifyContent: "center",
                               border: `1px solid rgba(155, 163, 185, 0.1)` 
                            }}>
                               {icon}
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 20, fontWeight: 700, color: hexColor, lineHeight: 1 }}>
                                {section._count.currentCows}
                              </div>
                              <div style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 600, marginTop: 4, letterSpacing: 0.5 }}>
                                Голов
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                             {dayData.arrivals > 0 && <span style={{ color: "var(--success)", fontSize: 12, fontWeight: 700, background: "rgba(34, 197, 94, 0.12)", padding: "2px 6px", borderRadius: 4 }}>+{dayData.arrivals} прибыло</span>}
                             {dayData.departures > 0 && <span style={{ color: "var(--danger)", fontSize: 12, fontWeight: 700, background: "rgba(239, 68, 68, 0.12)", padding: "2px 6px", borderRadius: 4 }}>-{dayData.departures} убыло</span>}
                             {dayData.arrivals === 0 && dayData.departures === 0 && offset > 0 && <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>Без движений</span>}
                          </div>

                          <div style={{ marginTop: 'auto' }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {section.name}
                            </h3>
                            <span className="badge" style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", fontSize: 10, border: "1px solid var(--border-subtle)" }}>
                              {section.type || "Стандартная секция"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </AppLayout>
  );
}
