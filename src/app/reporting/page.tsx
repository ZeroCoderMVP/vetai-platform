"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";

type ReportTemplate = {
  id: string;
  code: string;
  name: string;
  description: string;
  reportType: string;
  periodicity: string;
  kpis: string[];
  defaultFormat: string;
  status: "active" | "draft" | "disabled";
};

// Hardcoded MVP templates if DB is empty
const MVPTemplates: ReportTemplate[] = [
  {
    id: "mvp-morning-brief",
    code: "RPT_MORNING_BRIEF",
    name: "Утренний бриф",
    description: "Сводка за прошедшие сутки: надои, отклонения здоровья, проблемы с доением.",
    reportType: "DAILY",
    periodicity: "Ежедневно (утро)",
    kpis: ["Удой за сутки", "Больные новотельные", "Охота"],
    defaultFormat: "PDF",
    status: "active"
  },
  {
    id: "mvp-shift-parlor",
    code: "RPT_SHIFT_PARLOR",
    name: "Сменный отчет по доению",
    description: "Результаты смены в доильном зале: пропускная способность, промывки, маститные коровы.",
    reportType: "SHIFT",
    periodicity: "Каждую смену",
    kpis: ["Эффективность зала", "Сброшенное молоко", "Снятие аппаратов"],
    defaultFormat: "PDF",
    status: "active"
  },
  {
    id: "mvp-weekly-herd",
    code: "RPT_WEEKLY_HERD",
    name: "Недельный свод по стаду",
    description: "Динамика стада за неделю: перемещения, осеменения, запуски, отелы.",
    reportType: "WEEKLY",
    periodicity: "Еженедельно",
    kpis: ["% Сохранности", "Стельность", "Выбытия"],
    defaultFormat: "XLSX",
    status: "active"
  },
  {
    id: "mvp-monthly-management",
    code: "RPT_MONTHLY_MANAGEMENT",
    name: "Месячный управленческий отчет",
    description: "Комплексный анализ: экономика, конверсия корма, итоги по молоку и ремонту стада.",
    reportType: "MONTHLY",
    periodicity: "Ежемесячно",
    kpis: ["IOFC", "Стоимость рациона", "Выручка"],
    defaultFormat: "XLSX",
    status: "active"
  }
];

export default function ReportingPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Загрузка...</div>}>
      <ReportingContent />
    </Suspense>
  );
}

function ReportingContent() {
  const [activeTab, setActiveTab] = useState("all");
  const [templates, setTemplates] = useState<ReportTemplate[]>(MVPTemplates);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // We start with MVPTemplates and attempt to fetch DB ones to merge
    fetch("/api/reporting/templates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Merge logic if needed, or just append generic db ones
          const dbMapped: ReportTemplate[] = data.map((d: any) => ({
            id: d.id, code: d.code, name: d.name, description: d.description,
            reportType: d.reportType || "REGULATORY", periodicity: "По требованию",
            kpis: ["Стандартные KPI"], defaultFormat: d.defaultFormat || "PDF", status: "active"
          }));
          setTemplates([...MVPTemplates, ...dbMapped]);
        }
      })
      .catch((err) => console.error("Error fetching templates", err));
  }, []);

  const tabs = [
    { id: "all", label: "Все" },
    { id: "DAILY", label: "Дневные" },
    { id: "SHIFT", label: "Сменные" },
    { id: "WEEKLY", label: "Недельные" },
    { id: "MONTHLY", label: "Месячные" },
    { id: "REGULATORY", label: "Регламентные" }
  ];

  const filtered = activeTab === "all" ? templates : templates.filter(t => t.reportType === activeTab);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <span className="badge" style={{ background: "var(--status-healthy)", color: "white" }}>Активен</span>;
      case "draft": return <span className="badge" style={{ background: "var(--status-warning)", color: "white" }}>Черновик</span>;
      case "disabled": return <span className="badge" style={{ background: "var(--text-tertiary)", color: "white" }}>Отключен</span>;
      default: return null;
    }
  };

  return (
    <AppLayout title="Отчеты">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>Отчёты</h2>
          <p className="page-subtitle" style={{ margin: "4px 0 0 0" }}>Шаблоны и экземпляры отчётов</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn btn-secondary">История</button>
          <button className="btn btn-primary">Создать отчёт</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "16px" }}>
        {tabs.map((tab) => (
           <button
             key={tab.id}
             className={`btn ${activeTab === tab.id ? "btn-primary" : ""}`}
             style={{ 
               borderRadius: "20px", padding: "6px 16px", border: "none", cursor: "pointer",
               background: activeTab === tab.id ? "var(--primary-600)" : "var(--bg-secondary)",
               color: activeTab === tab.id ? "white" : "var(--text-secondary)"
             }}
             onClick={() => setActiveTab(tab.id)}
           >
             {tab.label}
           </button>
        ))}
      </div>

      <div className="grid-3" style={{ gap: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
        {filtered.map(template => (
          <div key={template.id} className="card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="card-header" style={{ padding: "20px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ fontSize: "28px" }}>
                  {template.defaultFormat === "XLSX" ? "📊" : "📝"}
                </span>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "var(--text-primary)" }}>{template.name}</h3>
                  <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: "var(--text-tertiary)", fontFamily: "monospace" }}>
                    <span>{template.code}</span>
                  </div>
                </div>
              </div>
              {getStatusBadge(template.status)}
            </div>
            
            <div className="card-body" style={{ padding: "20px", flexGrow: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {template.description}
              </p>
              
              <div style={{ marginTop: "auto", background: "var(--bg-secondary)", padding: "12px", borderRadius: "6px", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "var(--text-tertiary)" }}>Периодичность:</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{template.periodicity}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "var(--text-tertiary)" }}>Ключевые KPI:</span>
                  <span style={{ color: "var(--text-primary)", textAlign: "right", maxWidth: "160px" }}>{template.kpis.join(", ")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-tertiary)" }}>Формат:</span>
                  <span className="badge" style={{ background: "transparent", border: "1px solid var(--border-color)" }}>{template.defaultFormat}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", borderTop: "1px solid var(--border-color)", background: "var(--bg-elevated)", borderBottomLeftRadius: "var(--radius-lg)", borderBottomRightRadius: "var(--radius-lg)" }}>
              <Link href={`/reporting/templates/${template.id}`} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", fontSize: "13px" }}>
                Открыть
              </Link>
              <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: "13px" }}>
                Сформировать
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
