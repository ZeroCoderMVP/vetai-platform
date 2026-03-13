"use client";
import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function ExecutiveDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [milkTrend, setMilkTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, trendRes] = await Promise.all([
          fetch("/api/dashboard/executive?period=7"),
          fetch("/api/analytics/milk-trend?period=30")
        ]);
        
        setSummary(await sumRes.json());
        setMilkTrend(await trendRes.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  if (loading) return <AppLayout title="Инфографика..."><div className="p-4">Загрузка дашборда руководителя...</div></AppLayout>;
  if (!summary) return <AppLayout title="Ошибка"><div className="p-4">Не удалось загрузить данные</div></AppLayout>;

  return (
    <AppLayout title="Главный дашборд руководителя">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">👑 Главный дашборд руководителя</h2>
          <p className="page-subtitle">Данные AfiMilk и статус управленческих задач</p>
        </div>
        <div className="page-header-actions">
          <select style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '6px 12px' }}><option>За 7 дней</option><option>За 30 дней</option></select>
          <button className="btn btn-outline">Экспорт (PDF)</button>
        </div>
      </div>

      <div className="kpi-grid mb-6">
        <div className="kpi-card purple">
          <div className="kpi-header">
            <span className="kpi-label">Общее стадо (голов)</span>
            <div className="kpi-icon purple">🐄</div>
          </div>
          <div className="kpi-value text-3xl">
            {summary.population?.totalCows || 0}
          </div>
          <div className="kpi-trend">
            <span className="text-secondary">{summary.population?.milkingCows || 0} дойных / {summary.population?.dryCows || 0} сух.</span>
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-header">
            <span className="kpi-label">Надой на голову</span>
            <div className="kpi-icon green">🥛</div>
          </div>
          <div className="kpi-value text-3xl">
            {summary.production?.avgMilkPerCow || 0} <span className="unit">кг</span>
          </div>
          <div className="kpi-trend">
            <span className="text-secondary">Суточный вал: {summary.production?.totalMilkPerDay || 0} кг</span>
          </div>
        </div>

        <div className="kpi-card red" style={{ cursor: "pointer" }} onClick={() => alert("Переход к списку тревог")}>
          <div className="kpi-header">
            <span className="kpi-label">Тревоги (Критичные)</span>
            <div className="kpi-icon red">🚨</div>
          </div>
          <div className="kpi-value text-3xl">
            {summary.events?.alertCount || 0} 
            {summary.events?.criticalAlertCount > 0 && <span className="unit" style={{ color: 'var(--danger)' }}>({summary.events?.criticalAlertCount})</span>}
          </div>
          <div className="kpi-trend">
            <span className="text-secondary">Осеменений: {summary.events?.inseminationCount || 0} | Лечений: {summary.events?.treatmentCount || 0}</span>
          </div>
        </div>

        <Link href="/operations" className="kpi-card orange" style={{ textDecoration: 'none' }}>
          <div className="kpi-header">
            <span className="kpi-label">Задачи AfiMilk (Внесение)</span>
            <div className="kpi-icon orange">📋</div>
          </div>
          <div className="kpi-value text-3xl">
            {summary.operations?.pendingOperations || 0} 
            {summary.operations?.overdueOperations > 0 && <span className="unit" style={{ color: 'var(--danger)' }}>({summary.operations?.overdueOperations} проср.)</span>}
          </div>
          <div className="kpi-trend" style={{ color: 'var(--success)' }}>
            Успешность внесения: {summary.operations?.confirmationRate || 0}%
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 card">
          <div className="card-header flex justify-between items-center">
            <span className="card-title">Тренд валового надоя (30 дней)</span>
          </div>
          <div className="card-body" style={{ height: 320 }}>
            {milkTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={milkTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMilk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={(val) => format(new Date(val), 'dd MMM', { locale: ru })} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} dx={-10} width={60} />
                  <Tooltip 
                    labelFormatter={(val) => format(new Date(val), 'dd MMMM yyyy', { locale: ru })}
                    formatter={(val: any) => [`${val} кг`, 'Надой']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="totalYield" stroke="var(--brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorMilk)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Нет данных о надоях за период</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card h-full flex flex-col">
            <div className="card-header"><span className="card-title">Критичные задачи контроля внесения</span></div>
            <div className="card-body p-0 flex-1 flex flex-col justify-center items-center text-center p-6 text-gray-500">
              <span className="text-4xl mb-4">⚠️</span>
              <p className="text-sm">Здесь будет отображаться живая лента просроченных операций и критичных тревог AfiFarm, требующих управленческого вмешательства.</p>
              <Link href="/operations" className="btn btn-outline" style={{ marginTop: '20px' }}>Перейти в очередь</Link>
            </div>
          </div>
        </div>
      </div>
      
    </AppLayout>
  );
}
