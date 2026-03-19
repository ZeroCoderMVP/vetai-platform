"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import Link from "next/link";

export default function HerdStructurePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/herd-structure");
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || "Ошибка загрузки структуры стада");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <AppLayout title="Структура стада">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>📊 Структура стада</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>
            Аналитика состава животных по возрасту и лактациям
          </p>
        </div>
        <div>
          <button 
            onClick={loadData}
            className="btn btn-secondary"
            title="Обновить"
          >
            🔄 Обновить данные
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
          <div style={{ color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 32, marginBottom: 16 }}>⏳</span>
            <span>Загрузка демографии стада...</span>
          </div>
        </div>
      ) : error ? (
        <div className="card" style={{ borderLeft: "4px solid var(--danger)", padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--danger)" }}>Ошибка загрузки</h3>
          <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>{error}</p>
          <button onClick={loadData} className="btn btn-primary" style={{ marginTop: 16 }}>Попробовать снова</button>
        </div>
      ) : data ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "stretch" }}>
          <div className="card" style={{ flex: "1 1 600px", display: "flex", flexDirection: "column" }}>
            <div className="card-header">
              <span className="card-title">Распределение по группам</span>
            </div>
            <div className="card-body" style={{ flex: 1, minHeight: 450, paddingTop: 32, paddingRight: 40 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.chartData}
                  margin={{ top: 0, right: 0, left: -10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 20 }} iconType="circle" />
                  <Bar dataKey="Дойные" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Сухостойные" stackId="a" fill="#7dd3fc" />
                  <Bar dataKey="Нетели" stackId="a" fill="#34d399" />
                  <Bar dataKey="Тёлки" stackId="a" fill="#22c55e" />
                  <Bar dataKey="Быки" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ flex: "0 0 350px", display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Сводка по стаду</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div style={{ padding: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-subtle)", textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
                    Всего голов
                  </div>
                  <div style={{ fontSize: 42, fontWeight: 800, color: "var(--text-primary)", marginTop: 8 }}>
                    {data.stats.total.toLocaleString("ru-RU")}
                  </div>
                </div>

                <div style={{ padding: "16px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Фуражные</span>
                    <span style={{ fontWeight: 700 }}>
                      {data.stats.milkingStock.count} <span style={{ color: "var(--text-tertiary)", fontWeight: 400, fontSize: 13 }}>({Math.round((data.stats.milkingStock.count / data.stats.total) * 100) || 0}%)</span>
                    </span>
                  </div>
                  
                  <div style={{ paddingLeft: 12, borderLeft: "2px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 14 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6" }}></span>
                        Дойные
                      </span>
                      <span style={{ fontWeight: 500 }}>{data.stats.milkingStock.active}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 14 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#7dd3fc" }}></span>
                        Сухостойные
                      </span>
                      <span style={{ fontWeight: 500 }}>{data.stats.milkingStock.dry}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Молодняк</span>
                    <span style={{ fontWeight: 700 }}>
                      {data.stats.young.count} <span style={{ color: "var(--text-tertiary)", fontWeight: 400, fontSize: 13 }}>({Math.round((data.stats.young.count / data.stats.total) * 100) || 0}%)</span>
                    </span>
                  </div>

                  <div style={{ paddingLeft: 12, borderLeft: "2px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 14 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#34d399" }}></span>
                        Нетели
                      </span>
                      <span style={{ fontWeight: 500 }}>{data.stats.young.pregnantHeifers}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 14 }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }}></span>
                        Тёлки
                      </span>
                      <span style={{ fontWeight: 500 }}>{data.stats.young.heifers}</span>
                    </div>
                    {data.stats.young.bulls > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 14 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f97316" }}></span>
                          Быки
                        </span>
                        <span style={{ fontWeight: 500 }}>{data.stats.young.bulls}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px dashed var(--border-subtle)" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>Средняя лактация фуражных</span>
                    <span style={{ fontWeight: 600, color: "var(--primary)" }}>{data.stats.averageLactation}</span>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/groups" style={{ display: "block", textDecoration: "none" }}>
              <div className="card" style={{ transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.borderColor = "var(--primary)"} onMouseOut={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}>
                 <div className="card-body" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                   <div style={{ background: "rgba(59,130,246,0.1)", padding: 12, borderRadius: 12, fontSize: 24 }}>
                     🐄
                   </div>
                   <div>
                     <h4 style={{ margin: "0 0 4px 0", color: "var(--text-primary)", fontWeight: 600 }}>Группы и секции</h4>
                     <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>Перейти к детальному размещению животных</p>
                   </div>
                 </div>
              </div>
            </Link>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}
