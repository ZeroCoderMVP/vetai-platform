"use client";
import React, { useEffect, useState, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { getSystemDate } from "@/lib/systemDate";

export default function OperationsPage() {
  const [operations, setOperations] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    cowNumber: "",
    operationType: "INSEMINATION",
    title: "",
    priority: "MEDIUM",
  });
  
  const [cowSuggestions, setCowSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!createForm.cowNumber || createForm.cowNumber.length < 2) {
      setCowSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cows/search?q=${createForm.cowNumber}`);
        const data = await res.json();
        setCowSuggestions(Array.isArray(data) ? data : []);
        setShowSuggestions(true);
      } catch (e) {
        console.error("Search err", e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [createForm.cowNumber]);

  const selectCow = (number: string) => {
    setCreateForm({ ...createForm, cowNumber: number });
    setShowSuggestions(false);
  };

  const handleCreate = async () => {
    if (!createForm.cowNumber || !createForm.title) {
       alert("Заполните номер животного и название задачи");
       return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка создания");
      setIsCreateOpen(false);
      
      const [opsRes, sumRes] = await Promise.all([
        fetch("/api/operations"),
        fetch("/api/operations/summary")
      ]);
      const ops = await opsRes.json();
      setOperations(Array.isArray(ops) ? ops : []);
      setSummary(await sumRes.json());
      setCreateForm({ cowNumber: "", operationType: "INSEMINATION", title: "", priority: "MEDIUM" });
    } catch(e: any) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  };

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

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "OVERDUE": return <span className="badge badge-danger">ПРОСРОЧЕНО</span>;
      case "VERIFIED": return <span className="badge badge-success">ВНЕСЕНО</span>;
      case "IN_PROGRESS": return <span className="badge badge-primary">В ПРОЦЕССЕ</span>;
      case "ENTERED_IN_AFIMILK": return <span className="badge badge-success" style={{ opacity: 0.8 }}>В АФИМИЛК</span>;
      case "PENDING_AFIMILK_ENTRY": return <span className="badge badge-warning">ОЖИДАЕТ ВНЕСЕНИЯ</span>;
      case "CREATED": return <span className="badge badge-neutral">СОЗДАНО</span>;
      default: return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case "CRITICAL": return <span className="badge badge-danger">🔴 Критично</span>;
      case "HIGH": return <span className="badge badge-warning">🟠 Высокий</span>;
      case "MEDIUM": return <span className="badge badge-primary">🟡 Средний</span>;
      default: return <span className="badge badge-neutral">🟢 Низкий</span>;
    }
  };

  const tabs = [
    { id: "ALL", label: "Все задачи" },
    { id: "TREATMENT", label: "Лечение" },
    { id: "REPRODUCTION", label: "Воспроизводство" },
    { id: "VACCINATION", label: "Вакцинация" },
    { id: "HOOF_TRIM", label: "Расчистка копыт" }
  ];

  return (
    <AppLayout title="АфиМилк: Контроль внесения">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>📋 Очередь операций AfiMilk</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 14 }}>Контроль управленческих задач</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/operations/performance" className="btn btn-ghost" style={{ border: '1px solid var(--border-subtle)', textDecoration: 'none' }}>
             Дисциплина персонала
          </Link>
          <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>+ Создать операцию</button>
        </div>
      </div>

      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ borderTop: "4px solid var(--warning)" }}>
            <div className="card-body" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                ОЖИДАЮТ ВНЕСЕНИЯ <span>⏳</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)" }}>{summary.pendingCount || 0}</div>
            </div>
          </div>
          
          <div className="card" style={{ borderTop: "4px solid var(--danger)" }}>
            <div className="card-body" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                ПРОСРОЧЕНО <span>🚨</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)" }}>{summary.overdueCount || 0}</div>
            </div>
          </div>
          
          <div className="card" style={{ borderTop: "4px solid var(--success)" }}>
            <div className="card-body" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                ВНЕСЕНО <span>✅</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)" }}>{summary.verifiedCount || 0}</div>
            </div>
          </div>
          
          <div className="card" style={{ borderTop: "4px solid var(--primary)" }}>
            <div className="card-body" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                СР. ВРЕМЯ ВНЕСЕНИЯ <span>⏱️</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)" }}>
                {(summary.avgConfirmationTimeHours || 0).toFixed(1)} <span style={{ fontSize: 18, color: "var(--text-secondary)" }}>ч</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "none", paddingBottom: 0 }}>
          <span className="card-title">Очередь задач</span>
        </div>
        
        <div style={{ display: "flex", gap: 24, padding: "0 24px", borderBottom: "1px solid var(--border-subtle)", overflowX: "auto" }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "16px 0",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid var(--primary)" : "2px solid transparent",
                color: activeTab === tab.id ? "var(--primary)" : "var(--text-secondary)",
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: "pointer",
                fontSize: 14,
                transition: "all 0.2s",
                whiteSpace: "nowrap"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
          
        <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 14, textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-surface-hover)", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "12px 24px", fontWeight: 500 }}>Приоритет</th>
                <th style={{ padding: "12px 16px", fontWeight: 500 }}>Животное</th>
                <th style={{ padding: "12px 16px", fontWeight: 500 }}>Тип операции</th>
                <th style={{ padding: "12px 16px", fontWeight: 500 }}>Название</th>
                <th style={{ padding: "12px 16px", fontWeight: 500 }}>Дата события</th>
                <th style={{ padding: "12px 16px", fontWeight: 500 }}>Дедлайн</th>
                <th style={{ padding: "12px 24px", fontWeight: 500 }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 64, color: 'var(--text-secondary)' }}>⏳ Загрузка задач...</td></tr>
              ) : operations.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 64, color: 'var(--text-secondary)' }}>Нет активных операций.</td></tr>
              ) : operations
                  .filter((op: any) => {
                    if (activeTab === "ALL") return true;
                    const ot = (op.operationType || "").toUpperCase();
                    if (activeTab === "TREATMENT") return ot.includes("TREATMENT") || ot.includes("HEALTH");
                    // Important: also account for INSEMINATION matching REPRODUCTION tab natively
                    if (activeTab === "REPRODUCTION") return ot.includes("INSEMINATION") || ot.includes("CHECK") || ot.includes("PREGNANCY") || ot.includes("CALVING") || ot.includes("REPRODUCTION");
                    if (activeTab === "VACCINATION") return ot.includes("VACCIN");
                    if (activeTab === "HOOF_TRIM") return ot.includes("HOOF");
                    return false;
                  })
                  .map((op: any) => (
                <tr 
                  key={op.id} 
                  style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background-color 0.2s' }} 
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'} 
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'} 
                  onClick={() => window.location.href = `/herd/${op.cowId}?op=${op.id}`}
                >
                  <td style={{ padding: "16px 24px" }}>{getPriorityBadge(op.priority)}</td>
                  <td style={{ padding: "16px", fontWeight: 600, color: "var(--primary)" }}>#{op.cow?.number || op.cowId}</td>
                  <td style={{ padding: "16px", color: "var(--text-secondary)", fontSize: 12 }}>{op.operationType}</td>
                  <td style={{ padding: "16px", color: "var(--text-primary)", maxWidth: 250, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={op.title}>{op.title}</td>
                  <td style={{ padding: "16px", color: "var(--text-secondary)" }}>{format(new Date(op.eventDate), 'dd MMM yyyy, HH:mm', { locale: ru })}</td>
                  <td style={{ padding: "16px" }}>
                    {op.dueDate ? (
                      <span style={{ color: new Date(op.dueDate) < getSystemDate() && op.status !== 'VERIFIED' ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: new Date(op.dueDate) < getSystemDate() && op.status !== 'VERIFIED' ? 600 : 400 }}>
                        {format(new Date(op.dueDate), 'dd MMM, HH:mm', { locale: ru })}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    {getStatusBadge(op.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: "90%", maxWidth: 500, padding: 32, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border-subtle)" }}>Добавить задачу</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ position: "relative" }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Номер животного</label>
                <input 
                  type="text" 
                  placeholder="Например: 1157" 
                  value={createForm.cowNumber} 
                  onChange={e => { setCreateForm({...createForm, cowNumber: e.target.value}); setShowSuggestions(true); }}
                  onFocus={() => { if (createForm.cowNumber.length >= 2) setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  style={{ width: "100%", padding: "12px", border: "1px solid var(--border-subtle)", borderRadius: 8, outline: "none", fontSize: 14 }} 
                />
                
                {showSuggestions && cowSuggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 8, marginTop: 4, zIndex: 100, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)", maxHeight: 200, overflowY: "auto" }}>
                    {cowSuggestions.map(cow => (
                      <div 
                        key={cow.id} 
                        onClick={() => selectCow(cow.number)} 
                        style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid var(--border-default)", transition: "background 0.2s" }} 
                        onMouseOver={e => e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)"} 
                        onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <div style={{ fontWeight: 600, color: "var(--primary)" }}>#{cow.number}</div>
                        {cow.group?.name && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Группа: {cow.group.name}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Тип операции</label>
                <select value={createForm.operationType} onChange={e => setCreateForm({...createForm, operationType: e.target.value})} style={{ width: "100%", padding: "12px", border: "1px solid var(--border-subtle)", borderRadius: 8, outline: "none", fontSize: 14, backgroundColor: "transparent" }}>
                  <option value="INSEMINATION">Воспроизводство (Осеменение)</option>
                  <option value="TREATMENT">Лечение</option>
                  <option value="VACCINATION">Вакцинация</option>
                  <option value="HOOF_TRIM">Расчистка копыт</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Краткое название</label>
                <input type="text" placeholder="Например: Вакцинация против ВРК" value={createForm.title} onChange={e => setCreateForm({...createForm, title: e.target.value})} style={{ width: "100%", padding: "12px", border: "1px solid var(--border-subtle)", borderRadius: 8, outline: "none", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Приоритет</label>
                <select value={createForm.priority} onChange={e => setCreateForm({...createForm, priority: e.target.value})} style={{ width: "100%", padding: "12px", border: "1px solid var(--border-subtle)", borderRadius: 8, outline: "none", fontSize: 14, backgroundColor: "transparent" }}>
                  <option value="LOW">Низкий</option>
                  <option value="MEDIUM">Средний</option>
                  <option value="HIGH">Высокий</option>
                  <option value="CRITICAL">Критичный 🔴</option>
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                <button className="btn btn-ghost" onClick={() => setIsCreateOpen(false)}>Отмена</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>{creating ? "⏳ Создание..." : "✨ Создать задачу"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
