"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useSearchParams } from "next/navigation";
import { Users, Hash, Calendar, Activity, ChevronRight } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

type GroupItem = {
  id: string;
  code?: string;
  name: string;
  type: string;
  category: string;
  cowCount: number;
  activityStatus: string;
  createdAt: string;
};

export default function GroupsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Загрузка...</div>}>
      <GroupsContent />
    </Suspense>
  );
}

function GroupsContent() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type"); // "calves" or null
  
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch("/api/groups");
        const json = await res.json();
        if (json.success) {
          setGroups(json.data);
        } else {
          setError(json.error || "Ошибка загрузки списка групп");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchGroups();
  }, []);

  if (loading) {
    return (
      <AppLayout title="Производственные группы">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Activity size={32} style={{ animation: 'spin 2s linear infinite', margin: '0 auto', marginBottom: 'var(--space-2)' }} />
            <p>Загрузка производственных групп...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Производственные группы">
        <div className="card" style={{ borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)', marginTop: 'var(--space-4)' }}>
          <div className="card-body" style={{ color: 'var(--danger)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <Activity size={24} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>Ошибка загрузки</div>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Pre-defined card colors
  const colors = ['blue', 'green', 'amber', 'purple'];
  
  // Apply calves filter if present
  const displayGroups = typeFilter === "calves" 
    ? groups.filter(g => g.category === "Молодняк / Нетели")
    : groups;

  // Extract unique categories from filtered groups
  const categories = Array.from(new Set(displayGroups.map((g) => g.category)));
  // Sort categories logically: Дойные -> Сухостойные -> Молодняк -> Прочие
  const categoryOrder: Record<string, number> = {
    "Дойное стадо": 1,
    "Сухостойные": 2,
    "Молодняк / Нетели": 3,
    "Прочие": 4
  };
  categories.sort((a, b) => (categoryOrder[a] || 99) - (categoryOrder[b] || 99));

  return (
    <AppLayout title={typeFilter === "calves" ? "Группы телят" : "Производственные группы"}>
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <div className="page-header-left">
          <h1 className="page-title">{typeFilter === "calves" ? "Группы телят" : "Производственные группы"}</h1>
          <p className="page-subtitle">Мониторинг фермы по категориям животных</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <div className="flex gap-2 bg-[var(--bg-elevated)] p-1 rounded-lg border border-[var(--border-subtle)]">
            <Link 
              href="/groups" 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${!typeFilter ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Все группы
            </Link>
            <Link 
              href="/groups?type=calves" 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${typeFilter === 'calves' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Только телята
            </Link>
          </div>
          <div className="badge" style={{ fontSize: '14px', padding: '6px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <Users size={16} />
            Всего: {displayGroups.length}
          </div>
        </div>
      </div>

      {displayGroups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-4)' }}>
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ width: '80px', height: '80px', background: 'var(--bg-elevated)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
              <Users size={40} color="var(--text-tertiary)" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Группы не найдены</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              В системе пока нет ни одной производственной группы для выбранного фильтра.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
          {categories.map((category) => {
            const categoryGroups = displayGroups.filter((g) => g.category === category);
            if (categoryGroups.length === 0) return null;
            
            // Icon mapping
            const icon = category === "Дойное стадо" ? "🥛" 
              : category === "Сухостойные" ? "🌾" 
              : category === "Молодняк / Нетели" ? "🌱" : "📁";

            return (
              <div key={category}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{icon}</span> {category} 
                  <span className="badge badge-neutral" style={{ fontSize: "14px", fontWeight: 600 }}>{categoryGroups.length}</span>
                </h2>
                <div className="grid-3">
                  {categoryGroups.map((group, index) => {
                    const isActive = group.activityStatus === "Active";
                    const colorClass = colors[index % colors.length];

                    return (
                      <Link href={`/groups/${group.id}`} key={group.id} style={{ textDecoration: 'none' }}>
                        <div className={`kpi-card ${colorClass}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', border: '1px solid var(--border-subtle)' }}>
                          <div className="kpi-header">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Группа {group.type && `• ${group.type}`}
                              </span>
                              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                                {group.name}
                              </h2>
                              {group.code && group.code !== group.name && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.7, fontSize: '12px', marginTop: '4px' }}>
                                  <Hash size={12} />
                                  <span>Код : {group.code}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className={`kpi-icon ${colorClass}`}>
                              <Users size={20} />
                            </div>
                          </div>

                          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 'var(--space-4)' }}>
                              <div className="kpi-value">
                                {group.cowCount}
                              </div>
                              <div className="kpi-unit">голов</div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                              <span className={`badge ${isActive ? 'badge-success' : 'badge-warning'}`}>
                                {isActive ? 'Активна' : 'Неактивна'}
                              </span>
                              
                              {group.createdAt && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6, fontSize: '11px' }}>
                                  <Calendar size={12} />
                                  {format(new Date(group.createdAt), "dd.MM.yy")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </AppLayout>
  );
}
