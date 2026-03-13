"use client";
import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function OperationsPage() {
  const [operations, setOperations] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [opsRes, sumRes] = await Promise.all([
          fetch("/api/operations"),
          fetch("/api/operations/summary")
        ]);
        
        const [ops, sum] = await Promise.all([
          opsRes.json(),
          sumRes.json()
        ]);

        setOperations(Array.isArray(ops) ? ops : []);
        setSummary(sum);
      } catch (e) {
        console.error("Failed to load operations", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "OVERDUE": return "bg-red-500/20 text-red-400";
      case "VERIFIED": return "bg-green-500/20 text-green-400";
      case "IN_PROGRESS": return "bg-blue-500/20 text-blue-400";
      case "ENTERED_IN_AFIMILK": return "bg-purple-500/20 text-purple-400";
      case "PENDING_AFIMILK_ENTRY": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case "CRITICAL": return <span className="text-red-600">🔴</span>;
      case "HIGH": return <span className="text-orange-500">🟠</span>;
      case "MEDIUM": return <span className="text-yellow-500">🟡</span>;
      default: return <span className="text-green-500">🟢</span>;
    }
  };

  return (
    <AppLayout title="АфиМилк: Контроль внесения">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">📋 Очередь операций AfiMilk</h2>
          <p className="page-subtitle">Контроль управленческих задач</p>
        </div>
        <div className="page-header-actions">
          <Link href="/operations/performance" className="btn btn-outline" style={{ textDecoration: 'none' }}>Дисциплина персонала</Link>
          <button className="btn btn-primary" onClick={() => alert("Добавление через API пока")}>+ Создать операцию</button>
        </div>
      </div>

      {summary && (
        <div className="kpi-grid mb-6">
          <div className="kpi-card yellow">
            <div className="kpi-header">
              <span className="kpi-label">Ожидают внесения</span>
              <div className="kpi-icon yellow">⏳</div>
            </div>
            <div className="kpi-value text-3xl">
              {summary.pendingCount || 0}
            </div>
          </div>
          <div className="kpi-card red">
            <div className="kpi-header">
              <span className="kpi-label">Просрочено</span>
              <div className="kpi-icon red">🚨</div>
            </div>
            <div className="kpi-value text-3xl">
              {summary.overdueCount || 0}
            </div>
          </div>
          <div className="kpi-card green">
            <div className="kpi-header">
              <span className="kpi-label">Внесено</span>
              <div className="kpi-icon green">✅</div>
            </div>
            <div className="kpi-value text-3xl">
              {summary.verifiedCount || 0}
            </div>
          </div>
          <div className="kpi-card blue">
            <div className="kpi-header">
              <span className="kpi-label">Ср. время внесения</span>
              <div className="kpi-icon blue">⏱️</div>
            </div>
            <div className="kpi-value text-3xl">
              {(summary.avgConfirmationTimeHours || 0).toFixed(1)} <span className="unit">ч</span>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header flex justify-between">
          <span className="card-title">Очередь задач</span>
          <div className="flex gap-2 text-sm">
            <span className="text-gray-500">Фильтры: Все</span>
          </div>
        </div>
        <div className="card-body p-0">
          <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: 13 }}>
                <th className="p-3 font-medium">Приоритет</th>
                <th className="p-3 font-medium">Корова (Номер)</th>
                <th className="p-3 font-medium">Тип операции</th>
                <th className="p-3 font-medium">Название</th>
                <th className="p-3 font-medium">Дата события</th>
                <th className="p-3 font-medium">Дедлайн</th>
                <th className="p-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center p-6" style={{ color: 'var(--text-tertiary)' }}>Загрузка...</td></tr>
              ) : operations.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-6" style={{ color: 'var(--text-tertiary)' }}>Нет активных операций. Выполните сидирование БД или вызовите POST /api/operations.</td></tr>
              ) : operations.map((op: any) => (
                <tr key={op.id} className="cursor-pointer transition-colors" style={{ borderBottom: '1px solid var(--border-default)' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={() => window.location.href = `/operations/${op.id}`}>
                  <td className="p-3 text-center">{getPriorityIcon(op.priority)}</td>
                  <td className="p-3 font-medium text-blue-600">{op.cow?.number || op.cowId}</td>
                  <td className="p-3 font-medium">{op.operationType}</td>
                  <td className="p-3 truncate max-w-[200px]" title={op.title}>{op.title}</td>
                  <td className="p-3 text-sm">{format(new Date(op.eventDate), 'dd MMM yyyy, HH:mm', { locale: ru })}</td>
                  <td className="p-3 text-sm">
                    {op.dueDate ? (
                      <span className={new Date(op.dueDate) < new Date() && op.status !== 'VERIFIED' ? 'text-red-500 font-bold' : ''}>
                        {format(new Date(op.dueDate), 'dd MMM, HH:mm', { locale: ru })}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(op.status)}`}>
                      {op.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
