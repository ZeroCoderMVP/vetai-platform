"use client";
import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";

export default function ReportDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We would fetch real report by params.id here
    setTimeout(() => {
      setReport({
        id: resolvedParams.id,
        title: "Отчет по молочной продуктивности — март 2026",
        status: "READY_FOR_REVIEW",
        format: "XLSX",
        periodStart: "2026-03-01T00:00:00.000Z",
        periodEnd: "2026-03-31T23:59:59.000Z",
        generatedAt: "2026-03-13T09:15:00.000Z",
        template: {
          name: "Отчет по молочной продуктивности",
          authority: "INTERNAL"
        },
        farm: {
          name: "АО «Гатчинское»"
        },
        validationIssues: [
          { severity: "WARNING", code: "DATA_GAP", message: "Отсутствуют данные за 10 марта для 3х коров" }
        ],
        summary: {
          totalRows: 1450,
          totalMilk: 45670,
        }
      });
      setLoading(false);
    }, 500);
  }, [resolvedParams.id]);

  if (loading) return <AppLayout title="Загрузка..."><div style={{padding: "var(--space-4)"}}>Загрузка данных отчета...</div></AppLayout>;

  return (
    <AppLayout title={report.title}>
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: "var(--space-2)" }}>
            <Link href="/reporting" style={{ color: "var(--brand-primary)", textDecoration: "none" }}>← Отчетность</Link> / {report.template.name}
          </div>
          <h2 className="page-title" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            {report.title}
            <span className={`badge`} style={{
              background: report.status === "READY_FOR_REVIEW" ? "rgba(245, 158, 11, 0.1)" : "rgba(34, 197, 94, 0.1)",
              color: report.status === "READY_FOR_REVIEW" ? "#f59e0b" : "#22c55e",
            }}>
              {report.status}
            </span>
          </h2>
          <div style={{ display: "flex", gap: "var(--space-4)", fontSize: 13, color: "var(--text-secondary)", marginTop: "var(--space-2)" }}>
            <span>Хозяйство: <b>{report.farm.name}</b></span>
            <span>Период: {new Date(report.periodStart).toLocaleDateString("ru-RU")} — {new Date(report.periodEnd).toLocaleDateString("ru-RU")}</span>
            <span>Сформирован: {new Date(report.generatedAt).toLocaleString("ru-RU")}</span>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
          <button 
            className="btn btn-outline" 
            onClick={async () => {
              alert("Запуск генерации и проверки...");
              await fetch(`/api/reporting/reports/${report.id}/generate`, { method: "POST" });
              alert("Отчет сгенерирован (mock)");
            }}
          >
            Сгенерировать / Проверить
          </button>
          
          <button 
            className="btn btn-outline"
            onClick={async () => {
              alert(`Запуск экспорта в ${report.format}...`);
              await fetch(`/api/reporting/reports/${report.id}/export`, { 
                method: "POST", 
                body: JSON.stringify({ format: report.format }) 
              });
              alert("Файл экспортирован (mock)");
            }}
          >
            Экспорт ({report.format})
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={() => alert("Отчет утвержден и отправлен (mock)")}
          >
            Утвердить
          </button>
        </div>
      </div>

      <div className="grid-3" style={{ gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Строк в отчете</span></div>
          <div className="card-body" style={{ fontSize: 24, fontWeight: 600 }}>{report.summary.totalRows}</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Предупреждений</span></div>
          <div className="card-body" style={{ fontSize: 24, fontWeight: 600, color: "#f59e0b" }}>{report.validationIssues.length}</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Ошибок</span></div>
          <div className="card-body" style={{ fontSize: 24, fontWeight: 600, color: "#ef4444" }}>0</div>
        </div>
      </div>

      {report.validationIssues.length > 0 && (
        <div className="card" style={{ marginBottom: "var(--space-6)", borderColor: "rgba(245, 158, 11, 0.3)" }}>
          <div className="card-header" style={{ background: "rgba(245, 158, 11, 0.05)" }}>
            <span className="card-title" style={{ color: "#f59e0b" }}>⚠️ Результаты проверки качества данных</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {report.validationIssues.map((issue: any, idx: number) => (
              <div key={idx} style={{ padding: "var(--space-3)", borderBottom: "1px solid var(--border-subtle)", fontSize: 13 }}>
                <span style={{ fontWeight: 500, color: "#f59e0b", marginRight: "var(--space-2)" }}>[{issue.code}]</span>
                {issue.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><span className="card-title">Содержимое отчета (Предпросмотр)</span></div>
        <div className="card-body" style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)" }}>
          Таблица предварительного просмотра данных будет доступна после завершения обработки строк...
        </div>
      </div>
    </AppLayout>
  );
}
