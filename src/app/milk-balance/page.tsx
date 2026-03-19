"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { useDateParams } from "@/hooks/useDateParams";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  AreaChart, Area
} from 'recharts';

type MilkBalanceData = {
  totalYield: number;
  distributedMilk: number;
  unaccountedMilk: number;
  flows: {
    milkSold: number;
    milkCalves: number;
    milkLoss: number;
  };
  economics: {
    milkRevenue: number;
    averagePrice: number;
    daily?: {
      date: string;
      revenue: number;
      averagePrice: number;
    }[];
  };
  journal?: {
    date: string;
    yield: number;
    sold: number;
    calves: number;
    loss: number;
    revenue: number;
  }[];
};

export default function MilkBalancePage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Загрузка...</div>}>
      <MilkBalanceContent />
    </Suspense>
  );
}

function MilkBalanceContent() {
  const [data, setData] = useState<MilkBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { dateFrom, dateTo, setDateRange } = useDateParams(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/milk-balance?from=${dateFrom}&to=${dateTo}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Ошибка загрузки баланса молока");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDateChange = (from: string, to: string) => {
    setDateRange(from, to);
  };

  const calculatePercentage = (part: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.round((part / total) * 100);
  };

  return (
    <AppLayout title="Баланс молока">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>⚖️ Баланс молока</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>Отслеживание распределения валового надоя и выручки</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <DateRangePicker from={dateFrom} to={dateTo} onChange={handleDateChange} />
          <button 
            onClick={loadData}
            className="btn btn-ghost"
            style={{ padding: "8px 12px", border: "1px solid var(--border-subtle)" }}
            title="Обновить"
          >
            🔄
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 250 }}>
          <div style={{ color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 32, marginBottom: 16 }}>⏳</span>
            <span>Загрузка данных баланса...</span>
          </div>
        </div>
      ) : error ? (
        <div className="card" style={{ borderLeft: "4px solid var(--danger)", padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--danger)" }}>Ошибка загрузки</h3>
          <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>{error}</p>
          <button onClick={loadData} className="btn btn-primary" style={{ marginTop: 16 }}>
            Попробовать снова
          </button>
        </div>
      ) : data ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Main KPI Row */}
          <div className="kpi-grid">
            <div className="kpi-card blue">
              <div className="kpi-header">
                <span className="kpi-label">Валовый надой (AFI)</span>
                <div className="kpi-icon blue">🥛</div>
              </div>
              <div className="kpi-value">
                {data.totalYield.toLocaleString("ru-RU")}
                <span className="kpi-unit">кг</span>
              </div>
              <span className="kpi-change neutral">Всего по ферме</span>
            </div>

            <div className="kpi-card green">
              <div className="kpi-header">
                <span className="kpi-label">Товарное молоко</span>
                <div className="kpi-icon green">📦</div>
              </div>
              <div className="kpi-value">
                {data.flows.milkSold.toLocaleString("ru-RU")}
                <span className="kpi-unit">кг</span>
              </div>
              <span className="kpi-change positive">
                Товарность: {calculatePercentage(data.flows.milkSold, data.totalYield)}%
              </span>
            </div>

            <div className="kpi-card amber">
              <div className="kpi-header">
                <span className="kpi-label">Выпойка телятам</span>
                <div className="kpi-icon amber">🍼</div>
              </div>
              <div className="kpi-value">
                {data.flows.milkCalves.toLocaleString("ru-RU")}
                <span className="kpi-unit">кг</span>
              </div>
              <span className="kpi-change neutral">
                {calculatePercentage(data.flows.milkCalves, data.totalYield)}% от вала
              </span>
            </div>

            <div className="kpi-card danger">
              <div className="kpi-header">
                <span className="kpi-label">Утилизация / Потери</span>
                <div className="kpi-icon" style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}>⚠️</div>
              </div>
              <div className="kpi-value">
                {data.flows.milkLoss.toLocaleString("ru-RU")}
                <span className="kpi-unit">кг</span>
              </div>
              <span className="kpi-change negative">
                {calculatePercentage(data.flows.milkLoss, data.totalYield)}% от вала
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24, alignItems: "stretch" }}>
            {/* Visual Distribution Bar */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">📊 Структура распределения молока</span>
              </div>
              
              <div className="card-body" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={[
                      {
                        name: 'Распределение молока',
                        'Товарное': data.flows.milkSold,
                        'Выпойка телятам': data.flows.milkCalves,
                        'Утилизация / Брак': data.flows.milkLoss,
                        'Валовый надой': data.totalYield,
                      }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: any) => [Number(value).toLocaleString('ru-RU') + ' кг']}
                    />
                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                    <Bar dataKey="Валовый надой" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Товарное" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Выпойка телятам" fill="#64748b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Утилизация / Брак" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {data.unaccountedMilk > 0 && (
                <div style={{ padding: 16, backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid var(--warning)", borderRadius: 8, display: "flex", alignItems: "flex-start", marginTop: 16 }}>
                  <span style={{ fontSize: 20, marginRight: 12 }}>⚠️</span>
                  <div>
                    <h4 style={{ color: "var(--warning)", fontWeight: 600, margin: 0 }}>Обнаружено расхождение баланса</h4>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4, margin: 0 }}>
                      Разница между валовым надоем ({data.totalYield.toLocaleString("ru-RU")} кг) и суммой введенных потоков распределения ({data.distributedMilk.toLocaleString("ru-RU")} кг) составляет <strong>{data.unaccountedMilk.toLocaleString("ru-RU")} кг</strong>. 
                      Пожалуйста, проверьте ручной ввод данных реализации.
                    </p>
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Economics Info */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">💰 Экономика</span>
              </div>
              
              <div className="card-body" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Выручка от реализации</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
                      {data.economics.milkRevenue.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} 
                      <span style={{ fontSize: 16, fontWeight: 400, color: "var(--text-secondary)", marginLeft: 4 }}>₽</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Средняя цена</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
                      {data.economics.averagePrice.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                      <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-secondary)", marginLeft: 4 }}>₽/кг</span>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, minHeight: 180, marginTop: 16 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.economics.daily || []}
                      margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} 
                        axisLine={false} 
                        tickLine={false}
                        tickFormatter={(val) => {
                          const [_, m, d] = val.split('-');
                          return `${d}.${m}`;
                        }}
                      />
                      <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}
                        labelFormatter={(l) => new Date(l).toLocaleDateString('ru-RU')}
                        formatter={(value: any, name: any) => {
                          if (name === "revenue") return [Number(value).toLocaleString('ru-RU') + ' ₽', 'Выручка'];
                          if (name === "averagePrice") return [Number(value).toLocaleString('ru-RU') + ' ₽/кг', 'Цена'];
                          return [value, name];
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#revenueGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-subtle)", textAlign: "center" }}>
                 <Link href={`/reports?type=economics&from=${dateFrom}&to=${dateTo}`} style={{ fontSize: 14, fontWeight: 500, color: "var(--primary)", textDecoration: "none" }}>
                   Детализация по экономике →
                 </Link>
              </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 24, alignItems: "stretch" }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Связанные разделы</span>
              </div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Link href={`/milking?from=${dateFrom}&to=${dateTo}`} style={{ display: "flex", alignItems: "center", padding: 16, border: "1px solid var(--border-subtle)", borderRadius: 12, textDecoration: "none", color: "inherit", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.borderColor = "var(--primary)"} onMouseOut={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}>
                  <div style={{ backgroundColor: "rgba(59,130,246,0.1)", padding: 12, borderRadius: 8, fontSize: 24, marginRight: 16 }}>🥛</div>
                  <div>
                    <h4 style={{ fontWeight: 600, margin: "0 0 4px 0" }}>Детализация доений (AIC)</h4>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Посмотреть записи доения по отдельным коровам и сессиям</p>
                  </div>
                </Link>
                <Link href={`/groups?from=${dateFrom}&to=${dateTo}`} style={{ display: "flex", alignItems: "center", padding: 16, border: "1px solid var(--border-subtle)", borderRadius: 12, textDecoration: "none", color: "inherit", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.borderColor = "var(--success)"} onMouseOut={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}>
                  <div style={{ backgroundColor: "rgba(16,185,129,0.1)", padding: 12, borderRadius: 8, fontSize: 24, marginRight: 16 }}>🐄</div>
                  <div>
                    <h4 style={{ fontWeight: 600, margin: "0 0 4px 0" }}>Производственные группы</h4>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Посмотреть группы дойных коров и телят</p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">📋 Журнал движения молока</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: 13, textAlign: "left", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "var(--bg-surface-hover)", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-subtle)" }}>
                        <th style={{ padding: "12px 16px", fontWeight: 500 }}>Дата</th>
                        <th style={{ padding: "12px 16px", fontWeight: 500 }}>Надой</th>
                        <th style={{ padding: "12px 16px", fontWeight: 500 }}>Реал-я 🟢</th>
                        <th style={{ padding: "12px 16px", fontWeight: 500 }}>Выпойка 🔵</th>
                        <th style={{ padding: "12px 16px", fontWeight: 500 }}>Потери 🔴</th>
                        <th style={{ padding: "12px 16px", fontWeight: 500, textAlign: "right" }}>Выручка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!data.journal || data.journal.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-tertiary)" }}>
                            Данных о движении молока за выбранный период не найдено.
                          </td>
                        </tr>
                      ) : (
                        data.journal.map((row) => (
                          <tr key={row.date} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background-color 0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
                            <td style={{ padding: "12px 16px", fontWeight: 500, color: "var(--text-primary)" }}>
                              {new Date(row.date).toLocaleDateString('ru-RU')}
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                              {row.yield > 0 ? `${row.yield.toLocaleString("ru-RU")} кг` : '-'}
                            </td>
                            <td style={{ padding: "12px 16px", color: "var(--success)", fontWeight: 600 }}>
                              {row.sold > 0 ? `${row.sold.toLocaleString("ru-RU")} кг` : '-'}
                            </td>
                            <td style={{ padding: "12px 16px", color: "var(--info)" }}>
                              {row.calves > 0 ? `${row.calves.toLocaleString("ru-RU")} кг` : '-'}
                            </td>
                            <td style={{ padding: "12px 16px", color: "var(--danger)" }}>
                              {row.loss > 0 ? `${row.loss.toLocaleString("ru-RU")} кг` : '-'}
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", fontSize: 14 }}>
                              {row.revenue > 0 ? `${row.revenue.toLocaleString("ru-RU")} ₽` : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      
      <style dangerouslySetInnerHTML={{__html: `
        .stripe-pattern {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px);
        }
      `}} />
    </AppLayout>
  );
}
