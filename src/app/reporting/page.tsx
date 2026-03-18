"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";

type ReportTemplate = {
  id: string;
  code: string;
  name: string;
  description: string;
  reportType: string;
  authority: string;
  defaultFormat: string;
};

const getAuthorityLogo = (authority: string) => {
  switch (authority) {
    case 'BREEDING_REGISTRY': return 'C:\\Users\\sitek\\.gemini\\antigravity\\brain\\277bfee4-9ea3-4638-b954-cb4e3763e550\\breeding_registry_logo_1773390578227.png';
    case 'ROSSTAT': return 'C:\\Users\\sitek\\.gemini\\antigravity\\brain\\277bfee4-9ea3-4638-b954-cb4e3763e550\\rosstat_logo_1773390591463.png';
    case 'VET_SERVICE': return 'C:\\Users\\sitek\\.gemini\\antigravity\\brain\\277bfee4-9ea3-4638-b954-cb4e3763e550\\vetservice_logo_1773390605856.png';
    case 'INTERNAL': return 'C:\\Users\\sitek\\.gemini\\antigravity\\brain\\277bfee4-9ea3-4638-b954-cb4e3763e550\\internal_logo_1773390620334.png';
    default: return null;
  }
};

export default function ReportingPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Загрузка...</div>}>
      <ReportingContent />
    </Suspense>
  );
}

function ReportingContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type"); // e.g. 'economics'
  
  const [activeTab, setActiveTab] = useState("all");
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Map incoming type query to an appropriate tab
  useEffect(() => {
    if (typeParam === 'economics') {
      setActiveTab('MANAGEMENT');
    }
  }, [typeParam]);

  useEffect(() => {
    fetch("/api/reporting/templates")
      .then((res) => res.json())
      .then((data) => {
        setTemplates(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching templates", err);
        setLoading(false);
      });
  }, []);

  const tabs = [
    { id: "all", label: "Все отчеты" },
    { id: "REGULATORY", label: "Регламентные" },
    { id: "BREEDING", label: "Племенные" },
    { id: "VETERINARY", label: "Ветеринарные" },
    { id: "PRODUCTION", label: "Производственные" },
    { id: "MANAGEMENT", label: "Управленческие" },
    { id: "archive", label: "Архив" },
  ];

  const filtered = activeTab === "all" ? templates : templates.filter(t => t.reportType === activeTab);

  return (
    <AppLayout title="Отчетность">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">📄 Модуль отчетности</h2>
          <p className="page-subtitle">Формирование, проверка и экспорт регламентных и внутренних отчетов</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-6)", overflowX: "auto", paddingBottom: "4px" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`btn ${activeTab === tab.id ? "btn-primary" : "btn-outline"}`}
            style={{ borderRadius: "var(--radius-full)", whiteSpace: "nowrap" }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid-3" style={{ gap: "var(--space-4)" }}>
        {loading ? (
          <div>Загрузка шаблонов...</div>
        ) : filtered.length > 0 ? (
          filtered.map(template => (
            <div 
              key={template.id} 
              className="card" 
              style={{ display: "flex", flexDirection: "column", height: "100%", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
              onClick={async () => {
                try {
                  const res = await fetch("/api/reporting/instances", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ templateId: template.id })
                  });
                  if (!res.ok) throw new Error("Ошибка создания черновика");
                  const data = await res.json();
                  window.location.href = `/reporting/reports/${data.id}`;
                } catch (e: any) {
                  alert(e.message);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              <div className="card-header" style={{ borderBottom: "none", paddingBottom: "var(--space-2)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
                    {getAuthorityLogo(template.authority) ? (
                      <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", background: "var(--bg-secondary)", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.2)"}}>
                        <img src={`/api/local-image?path=${encodeURIComponent(getAuthorityLogo(template.authority) as string)}`} alt={template.authority} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ) : (
                      <span style={{ fontSize: 24 }}>
                        {template.defaultFormat === "XLSX" ? "📊" : template.defaultFormat === "PDF" ? "📝" : "🔗"}
                      </span>
                    )}
                    <span className="card-title" style={{ fontSize: 16, lineHeight: 1.3 }}>{template.name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                    <span style={{ padding: "2px 6px", background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)" }}>Код: {template.code}</span>
                    <span>Орган: {template.authority}</span>
                  </div>
                </div>
              </div>
              <div className="card-body" style={{ flexGrow: 1, color: "var(--text-secondary)", fontSize: 13, paddingTop: 0 }}>
                {template.description}
              </div>
              <div style={{ padding: "var(--space-3)", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-outline btn-sm">Создать новый</button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state" style={{ gridColumn: "1 / -1", padding: "var(--space-12)" }}>
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">В этой категории пока нет шаблонов отчетов.</div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
