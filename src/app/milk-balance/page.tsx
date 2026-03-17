"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { useDateParams } from "@/hooks/useDateParams";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";



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
  };
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">⚖️ Баланс молока</h1>
          <p className="text-sm text-gray-500 mt-1">Отслеживание распределения валового надоя и выручки</p>
        </div>
        <div className="flex items-center space-x-4">
          <DateRangePicker from={dateFrom} to={dateTo} onChange={handleDateChange} />
          <button 
            onClick={loadData}
            className="p-2 border rounded-md hover:bg-gray-50 bg-white shadow-sm flex items-center justify-center transition-colors"
            title="Обновить"
          >
            🔄
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-500 flex flex-col items-center">
            <span className="text-3xl mb-4 animate-spin">⏳</span>
            <span>Загрузка данных баланса...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm">
          <h3 className="text-lg font-medium text-red-800">Ошибка загрузки</h3>
          <p className="text-red-700 mt-2">{error}</p>
          <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors">
            Попробовать снова
          </button>
        </div>
      ) : data ? (
        <div className="space-y-6">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Distribution Bar */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <span className="bg-blue-100 text-blue-800 p-1.5 rounded-lg mr-2">📊</span>
                Структура распределения молока
              </h3>
              
              <div style={{ paddingBottom: 40, width: '100%', marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Svg Sankey Flow Diagram */}
                {data.totalYield > 0 ? (
                  <div style={{ width: '100%', maxWidth: 800, margin: '0 auto', padding: '20px 0' }}>
                    <svg viewBox="0 0 800 320" style={{ width: '100%', height: 'auto', overflow: 'visible', fontFamily: 'var(--font-family)' }}>
                       {/* Definitions */}
                       <defs>
                          {/* Main node gradient */}
                          <linearGradient id="main-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#282e42" /> {/* neutral-800 */}
                            <stop offset="100%" stopColor="#181c2e" /> {/* neutral-900 */}
                          </linearGradient>
                       </defs>

                       {/* Calculate path weights based on percentages, max height is roughly 160px for paths total space */}
                       {(() => {
                          const soldRatio = data.flows.milkSold / data.totalYield;
                          const calvesRatio = data.flows.milkCalves / data.totalYield;
                          const lossRatio = data.flows.milkLoss / data.totalYield;
                          
                          // Minimum thickness for visibility
                          const T_SOLD = Math.max(soldRatio * 160, 4);
                          const T_CALV = Math.max(calvesRatio * 160, 4);
                          const T_LOSS = Math.max(lossRatio * 160, 4);
                          
                          // Origin box parameters 
                          const oX = 260; 
                          const oY = 80;
                          const oW = 160;
                          const oH = 160;
                          const pathStartX = oX + oW;
                          
                          // Target box parameters
                          const tX = 600;
                          const tW = 180;
                          const gap = 30; // space between right boxes
                          
                          // Box sizes (must be big enough to fit the two lines of text comfortably)
                          const minBoxHeight = 56;
                          const H_SOLD = Math.max(T_SOLD, minBoxHeight);
                          const H_CALV = Math.max(T_CALV, minBoxHeight);
                          const H_LOSS = Math.max(T_LOSS, minBoxHeight);

                          // Target Y positions relative to their box sizes layout
                          // We center the whole right block around Y=160
                          const totalRightH = H_SOLD + gap + H_CALV + gap + H_LOSS;
                          let currentRightY = 160 - totalRightH / 2;
                          
                          // Sold Path (Origin is calculated just by thickness so they stack seamlessly on the left)
                          const sStartY = oY + (oH / 2) - ((T_SOLD + T_CALV + T_LOSS) / 2) + (T_SOLD / 2);
                          // The target point is exactly in the middle of its corresponding box
                          const sEndY = currentRightY + H_SOLD / 2; 
                          const dSold = `M ${pathStartX} ${sStartY} C ${pathStartX + 100} ${sStartY}, ${tX - 100} ${sEndY}, ${tX} ${sEndY}`;
                          // Advance the layout pointer by the bounding box and gap
                          currentRightY += H_SOLD + gap;
                          
                          // Calves Path
                          const cStartY = sStartY + T_SOLD / 2 + T_CALV / 2;
                          const cEndY = currentRightY + H_CALV / 2;
                          const dCalv = `M ${pathStartX} ${cStartY} C ${pathStartX + 100} ${cStartY}, ${tX - 100} ${cEndY}, ${tX} ${cEndY}`;
                          currentRightY += H_CALV + gap;
                          
                          // Loss Path
                          const lStartY = cStartY + T_CALV / 2 + T_LOSS / 2;
                          const lEndY = currentRightY + H_LOSS / 2;
                          const dLoss = `M ${pathStartX} ${lStartY} C ${pathStartX + 100} ${lStartY}, ${tX - 100} ${lEndY}, ${tX} ${lEndY}`;
                          
                          return (
                            <>
                              {/* Background grid lines for aesthetic like the mock */}
                              <g stroke="rgba(0,0,0,0.05)" strokeWidth="1" strokeDasharray="4 4" fill="none">
                                 <line x1="0" y1="50" x2="800" y2="50" />
                                 <line x1="0" y1="160" x2="800" y2="160" />
                                 <line x1="0" y1="270" x2="800" y2="270" />
                              </g>
                              
                              <line x1="220" y1="160" x2="250" y2="160" stroke="#a0aabf" strokeWidth="2" strokeDasharray="3 3"/>
                              <path d="M 245 155 L 252 160 L 245 165" fill="none" stroke="#a0aabf" strokeWidth="2"/>

                              {/* Paths */}
                              <path d={dSold} fill="none" stroke="#22c55e" strokeWidth={T_SOLD} strokeOpacity="0.85" />
                              <path d={dCalv} fill="none" stroke="#64748b" strokeWidth={T_CALV} strokeOpacity="0.85" />
                              <path d={dLoss} fill="none" stroke="#f97316" strokeWidth={T_LOSS} strokeOpacity="0.85" />
                              
                              {/* Main Root Node */}
                              <rect x={oX} y={oY} width={oW} height={oH} rx="8" fill="url(#main-grad)" />
                              <text x={oX + oW/2} y={oY + oH/2 - 10} textAnchor="middle" fill="#9ba3b9" fontSize="14" fontWeight="600">Валовый надой</text>
                              <text x={oX + oW/2} y={oY + oH/2 + 20} textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="700">{data.totalYield.toLocaleString("ru-RU")} кг</text>
                              
                              {/* Node 1: Sold */}
                              <rect x={tX} y={sEndY - H_SOLD / 2} width={tW} height={H_SOLD} rx="6" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1" />
                              <text x={tX + 16} y={sEndY - 4} fill="#166534" fontSize="14" fontWeight="600">Товарное молоко</text>
                              <text x={tX + 16} y={sEndY + 16} fill="#15803d" fontSize="16" fontWeight="700">{(data.flows.milkSold/1000).toFixed(1)} т <tspan fontSize="12" fill="#22c55e">({calculatePercentage(data.flows.milkSold, data.totalYield)}%)</tspan></text>
                              
                              {/* Node 2: Calves */}
                              <rect x={tX} y={cEndY - H_CALV / 2} width={tW} height={H_CALV} rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                              <text x={tX + 16} y={cEndY - 4} fill="#334155" fontSize="14" fontWeight="600">Выпойка телятам</text>
                              <text x={tX + 16} y={cEndY + 16} fill="#475569" fontSize="16" fontWeight="700">{(data.flows.milkCalves/1000).toFixed(1)} т <tspan fontSize="12" fill="#64748b">({calculatePercentage(data.flows.milkCalves, data.totalYield)}%)</tspan></text>
                              
                              {/* Node 3: Loss */}
                              <rect x={tX} y={lEndY - H_LOSS / 2} width={tW} height={H_LOSS} rx="6" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1" />
                              <text x={tX + 16} y={lEndY - 4} fill="#9a3412" fontSize="14" fontWeight="600">Утилизация / Брак</text>
                              <text x={tX + 16} y={lEndY + 16} fill="#c2410c" fontSize="16" fontWeight="700">{(data.flows.milkLoss/1000).toFixed(1)} т <tspan fontSize="12" fill="#f97316">({calculatePercentage(data.flows.milkLoss, data.totalYield)}%)</tspan></text>
                              
                              {/* Virtual Inputs (left side) */}
                              {/* Adding fake virtual blocks mirroring the user design for presentation */}
                              <rect x="20" y="80" width="180" height="75" rx="6" fill="#282e42" />
                              <text x="36" y="115" fill="#f8f9fc" fontSize="13" fontWeight="600">Доильный зал (Afimilk)</text>
                              <text x="36" y="135" fill="#9ba3b9" fontSize="12">~ 85% поголовья</text>
                              
                              <path d="M 200 117 C 230 117, 230 140, 260 140" fill="none" stroke="#282e42" strokeWidth="20" opacity="0.4" />
                              
                              <rect x="20" y="165" width="180" height="75" rx="6" fill="#282e42" />
                              <text x="36" y="200" fill="#f8f9fc" fontSize="13" fontWeight="600">Родильное отделение</text>
                              <text x="36" y="220" fill="#9ba3b9" fontSize="12">~ 15% поголовья</text>

                              <path d="M 200 202 C 230 202, 230 180, 260 180" fill="none" stroke="#282e42" strokeWidth="10" opacity="0.4" />
                            </>
                          );
                       })()}
                    </svg>
                  </div>
                ) : (
                  <div style={{ width: '100%', textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)', padding: 32, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-strong)' }}>
                    Нет данных валового надоя за этот период для построения схемы распределения.
                  </div>
                )}
              </div>
              {data.unaccountedMilk > 0 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start">
                  <span className="text-xl mr-3">⚠️</span>
                  <div>
                    <h4 className="text-orange-800 font-medium">Обнаружено расхождение баланса</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Разница между валовым надоем ({data.totalYield} кг) и суммой введенных потоков распределения ({data.distributedMilk} кг) составляет <strong>{data.unaccountedMilk} кг</strong>. 
                      Пожалуйста, проверьте ручной ввод данных реализации.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Economics Info */}
            <div className="lg:col-span-1 bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <span className="bg-emerald-100 text-emerald-800 p-1.5 rounded-lg mr-2">💰</span>
                Экономика
              </h3>
              
              <div className="flex-1 space-y-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Выручка от реализации</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {data.economics.milkRevenue.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} 
                    <span className="text-lg font-normal text-gray-500 ml-1">₽</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500 mb-1">Средняя цена реализации</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.economics.averagePrice.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                    <span className="text-sm font-normal text-gray-500 ml-1">₽ / кг</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-gray-100">
                 <Link href={`/reports?type=economics&from=${dateFrom}&to=${dateTo}`} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center justify-center bg-blue-50 py-2 rounded-lg transition-colors">
                   Детализация по экономике →
                 </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Связанные разделы</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href={`/milking?from=${dateFrom}&to=${dateTo}`} className="flex items-center p-4 border rounded-xl hover:bg-gray-50 hover:border-blue-300 transition-all group">
                <div className="bg-blue-100 p-3 rounded-lg text-xl mr-4 group-hover:bg-blue-200 transition-colors">🥛</div>
                <div>
                  <h4 className="font-medium text-gray-900">Детализация доений (AIC)</h4>
                  <p className="text-sm text-gray-500">Посмотреть записи доения по отдельным коровам и сессиям</p>
                </div>
              </Link>
              <Link href={`/groups?from=${dateFrom}&to=${dateTo}`} className="flex items-center p-4 border rounded-xl hover:bg-gray-50 hover:border-green-300 transition-all group">
                <div className="bg-green-100 p-3 rounded-lg text-xl mr-4 group-hover:bg-green-200 transition-colors">🐄</div>
                <div>
                  <h4 className="font-medium text-gray-900">Производственные группы</h4>
                  <p className="text-sm text-gray-500">Посмотреть группы дойных коров и телят</p>
                </div>
              </Link>
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
