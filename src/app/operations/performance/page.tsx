"use client";
import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";

export default function OperationsPerformancePage() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/operations/summary");
        setSummary(await res.json());
      } catch (e) {
        console.error("Failed to load operations summary", e);
      }
    }
    fetchData();
  }, []);

  return (
    <AppLayout title="Дисциплина внесения данных">
      <div className="page-header items-start">
        <div className="page-header-left">
          <Link href="/operations" className="text-brand-primary no-underline flex items-center gap-1 text-sm mb-2 hover:opacity-80">
            <span>←</span> Вернуться к очереди
          </Link>
          <h2 className="page-title">📈 Аналитика дисциплины персонала</h2>
          <p className="page-subtitle">Отчет по скорости и своевременности внесения событий в систему AfiMilk.</p>
        </div>
      </div>

      <div className="grid-3 gap-6">
        <div className="col-span-2 card p-6 text-center" style={{ color: 'var(--text-secondary)' }}>
          <p className="mb-4">Здесь будет размещен подробный рейтинг сотрудников и график задержек.</p>
          <div className="h-48 rounded flex justify-center items-center" style={{ border: '1px dashed var(--border-default)' }}>График загружается... (MVP Mock)</div>
        </div>

        <div className="card p-0 flex flex-col gap-0 overflow-hidden">
          <div className="card-header px-4 py-3" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}><span className="card-title text-sm">Сводка по типам</span></div>
          <div className="p-4 flex flex-col gap-3">
            {summary?.byOperationType ? (
              summary.byOperationType.map((t: any) => (
                <div key={t.type} className="flex justify-between items-center text-sm pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="font-medium">{t.type}</span>
                  <span className="rounded px-2 py-0.5" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{t.count} шт.</span>
                </div>
              ))
            ) : (
              <span style={{ color: 'var(--text-tertiary)' }}>Нет данных...</span>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
