"use client";
import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";

export default function ReportDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reporting/instances/${resolvedParams.id}`);
      if (!res.ok) throw new Error("Failed to load report");
      const data = await res.json();
      
      // Parse JSON strings to objects for UI rendering if they exist
      if (data.payloadJson) data.payload = JSON.parse(data.payloadJson);
      if (data.summaryJson) data.summary = JSON.parse(data.summaryJson);
      
      setReport(data);
    } catch (err) {
      console.error(err);
      alert("Ошибка загрузки отчета");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [resolvedParams.id]);

  if (loading) return <AppLayout title="Загрузка..."><div style={{padding: "var(--space-4)"}}>Загрузка данных отчета...</div></AppLayout>;

  if (!report) return <AppLayout title="Ошибка"><div style={{padding: "var(--space-4)"}}>Отчет не найден или произошла ошибка при загрузке.</div></AppLayout>;

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
            <span>Сформирован: {report.reportDate ? new Date(report.reportDate).toLocaleString("ru-RU") : "Черновик"}</span>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
          <button 
            className="btn btn-outline" 
            disabled={loading}
            onClick={async () => {
              try {
                setLoading(true);
                const res = await fetch(`/api/reporting/reports/${report.id}/generate`, { method: "POST" });
                if (!res.ok) throw new Error("Ошибка генерации");
                await fetchReport(); // refresh data
              } catch (err) {
                alert("Ошибка генерации отчета");
              } finally {
                setLoading(false);
              }
            }}
          >
            Сгенерировать
          </button>
          
          <button 
            className="btn btn-outline"
            disabled={report.status !== "GENERATED" && report.status !== "READY_FOR_REVIEW" && report.status !== "APPROVED"}
            onClick={async () => {
              try {
                setLoading(true);
                const res = await fetch(`/api/reporting/reports/${report.id}/export`, { 
                  method: "POST", 
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ format: "CSV" }) // Hardcoded CSV for now
                });
                
                if (!res.ok) throw new Error("Ошибка экспорта");
                
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `report_${report.id}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch (err) {
                alert("Ошибка получения файла экспорта");
              } finally {
                setLoading(false);
              }
            }}
          >
            Скачать CSV
          </button>
          
          <button 
            className="btn btn-primary"
            disabled={report.status === "APPROVED"}
            onClick={() => alert("Утверждение пока не реализовано.")}
          >
            Утвердить
          </button>
        </div>
      </div>

      <div className="grid-3" style={{ gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Итоговое значение (Сводка)</span></div>
          <div className="card-body" style={{ fontSize: 24, fontWeight: 600 }}>
            {report.summary?.totalHead || report.summary?.totalYield || report.summary?.totalPeriodEvents || 0}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Ошибок генерации</span></div>
          <div className="card-body" style={{ fontSize: 24, fontWeight: 600, color: report.status === "VALIDATION_ERROR" ? "#ef4444" : "var(--text-secondary)" }}>
            {report.status === "VALIDATION_ERROR" ? "Есть ошибки" : "0"}
          </div>
        </div>
      </div>

      {report.validationIssues?.length > 0 && (
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
        <div className="card-body">
          {report.payload ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
              {Object.entries(report.payload).map(([key, value]) => {
                // Formatting key names for better display
                const labelMap: Record<string, string> = {
                  totalAnimals: "Всего животных",
                  groupsDistribution: "Распределение по группам",
                  periodEvents: "События за период"
                };
                const displayKey = labelMap[key] || key;

                if (Array.isArray(value)) {
                   if (value.length === 0) return <div key={key}><b>{displayKey}</b>: Нет данных</div>;
                   const headers = Object.keys(value[0]);
                   return (
                     <div key={key} style={{ overflowX: "auto" }}>
                       <h4 style={{ marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                          <span style={{ width: 4, height: 16, background: "var(--brand-primary)", borderRadius: 2 }}></span>
                          {displayKey}
                       </h4>
                       <table className="table w-full" style={{ fontSize: 13, textAlign: "left", width: "100%", borderCollapse: "collapse" }}>
                         <thead>
                           <tr style={{ borderBottom: "2px solid var(--border-subtle)", background: "var(--surface-sunken)" }}>
                             {headers.map(h => <th key={h} style={{ padding: "var(--space-2) var(--space-3)" }}>{h === "groupName" ? "Группа" : h === "headCount" ? "Головы" : h}</th>)}
                           </tr>
                         </thead>
                         <tbody>
                           {value.map((row, i) => (
                             <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                               {headers.map(h => <td key={h} style={{ padding: "var(--space-2) var(--space-3)" }}>{String(row[h])}</td>)}
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   );
                } else if (typeof value === "object" && value !== null) {
                   return (
                     <div key={key}>
                       <h4 style={{ marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                          <span style={{ width: 4, height: 16, background: "var(--brand-primary)", borderRadius: 2 }}></span>
                          {displayKey}
                       </h4>
                       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--space-3)" }}>
                         {Object.entries(value).map(([k, v]) => {
                            const nestedLabelMap: Record<string, string> = {
                               calvings: "Отелы",
                               inseminations: "Осеменения",
                               healthIssues: "Заболевания",
                               milkYield: "Надой (л)"
                            };
                            return (
                              <div key={k} style={{ padding: "var(--space-3)", background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                                <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: "var(--space-1)" }}>{nestedLabelMap[k] || k}</div>
                                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>{String(v)}</div>
                              </div>
                            );
                         })}
                       </div>
                     </div>
                   );
                } else {
                   return (
                     <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-3)", background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                       <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{displayKey}</span>
                       <span style={{ fontSize: 18, fontWeight: 600 }}>{String(value)}</span>
                     </div>
                   )
                }
              })}
            </div>
          ) : (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)" }}>
              Данные недоступны. Нажмите "Сгенерировать".
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
