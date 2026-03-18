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
            {/* Visual Distribution Bar */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <span className="bg-indigo-100 text-indigo-800 p-1.5 rounded-lg mr-2">📊</span>
                Структура распределения молока
              </h3>
              
              <div style={{ width: '100%', height: 350, flex: 1 }}>
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
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start mt-4">
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
              
              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Выручка от реализации</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {data.economics.milkRevenue.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} 
                      <span className="text-base font-normal text-gray-500 ml-1">₽</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Средняя цена</div>
                    <div className="text-lg font-semibold text-gray-700">
                      {data.economics.averagePrice.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                      <span className="text-xs font-normal text-gray-500 ml-1">₽/кг</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 mt-4" style={{ minHeight: 180 }}>
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-800 p-1.5 rounded-lg mr-2">📋</span>
              Журнал движения молока
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left align-middle mt-2 border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50 text-gray-500 font-medium">
                    <th className="py-3 px-4 rounded-tl-lg">Дата</th>
                    <th className="py-3 px-4">Валовый надой</th>
                    <th className="py-3 px-4">Реализация 🟢</th>
                    <th className="py-3 px-4">Выпойка 🔵</th>
                    <th className="py-3 px-4">Потери 🔴</th>
                    <th className="py-3 px-4 text-right rounded-tr-lg">Выручка</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!data.journal || data.journal.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 italic">
                        Данных о движении молока за выбранный период не найдено.
                      </td>
                    </tr>
                  ) : (
                    data.journal.map((row) => (
                      <tr key={row.date} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-700">
                          {new Date(row.date).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-900 drop-shadow-sm">
                          {row.yield > 0 ? `${row.yield.toLocaleString("ru-RU")} кг` : '-'}
                        </td>
                        <td className="py-3 px-4 text-[#10b981] font-semibold">
                          {row.sold > 0 ? `${row.sold.toLocaleString("ru-RU")} кг` : '-'}
                        </td>
                        <td className="py-3 px-4 text-[#64748b]">
                          {row.calves > 0 ? `${row.calves.toLocaleString("ru-RU")} кг` : '-'}
                        </td>
                        <td className="py-3 px-4 text-[#ef4444]">
                          {row.loss > 0 ? `${row.loss.toLocaleString("ru-RU")} кг` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900 font-mono">
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
      ) : null}
      
      <style dangerouslySetInnerHTML={{__html: `
        .stripe-pattern {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px);
        }
      `}} />
    </AppLayout>
  );
}
