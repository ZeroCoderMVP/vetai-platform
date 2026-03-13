"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import ExportButton from "@/components/ui/ExportButton";

interface AnimalData {
  cow: string;
  registrationNumber?: string;
  group: number;
  status?: string;
  gynStatus?: string;
  lactationNumber: number;
  dim: number;
  dailyAverageYield?: number | null;
  ageInMonths?: number;
  age?: number;
}

interface FarmData {
  totalAnimals: number;
  allCowNumbers: string[];
  afimilk: {
    healthIssues: { items: AnimalData[] } | null;
    heatSuspects: { items: AnimalData[] } | null;
    animalsToBreed: { items: AnimalData[] } | null;
    ketosisSuspects: { items: AnimalData[] } | null;
    mastitisSuspects: { items: AnimalData[] } | null;
    digestionProblems: { items: AnimalData[] } | null;
    freshCows: { items: AnimalData[] } | null;
    abortionSuspects: { items: AnimalData[] } | null;
  };
}

export default function HerdPage() {
  const router = useRouter();
  const [data, setData] = useState<FarmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/farm")
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <AppLayout title="Стадо">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">Загрузка данных стада...</div>
        </div>
      </AppLayout>
    );
  }

  // Собираем все данные по коровам воедино
  const cowMap = new Map<string, { 
    cow: string; regNumber: string; group: number; status: string;
    lactation: number; dim: number; yield24h: number | null; age: number | null;
    alerts: string[];
  }>();

  const processItems = (items: AnimalData[] | undefined, alertType: string) => {
    if (!items) return;
    for (const item of items) {
      const existing = cowMap.get(item.cow) || {
        cow: item.cow,
        regNumber: item.registrationNumber || "",
        group: item.group,
        status: item.status || item.gynStatus || "—",
        lactation: item.lactationNumber,
        dim: item.dim,
        yield24h: null,
        age: item.ageInMonths || item.age || null,
        alerts: [],
      };
      if (alertType) existing.alerts.push(alertType);
      if (item.dailyAverageYield && !existing.yield24h) {
        existing.yield24h = typeof item.dailyAverageYield === 'number' ? item.dailyAverageYield : null;
      }
      cowMap.set(item.cow, existing);
    }
  };

  processItems(data.afimilk.healthIssues?.items, "Здоровье");
  processItems(data.afimilk.heatSuspects?.items, "Охота");
  processItems(data.afimilk.animalsToBreed?.items, "Осеменение");
  processItems(data.afimilk.ketosisSuspects?.items, "Кетоз");
  processItems(data.afimilk.mastitisSuspects?.items, "Мастит");
  processItems(data.afimilk.digestionProblems?.items, "Пищеварение");
  processItems(data.afimilk.freshCows?.items, "Свежая");
  processItems(data.afimilk.abortionSuspects?.items, "Аборт");

  let animals = Array.from(cowMap.values());

  // Фильтрация
  if (search) {
    animals = animals.filter(a => 
      a.cow.includes(search) || a.regNumber.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (groupFilter !== "all") {
    animals = animals.filter(a => String(a.group) === groupFilter);
  }

  // Все группы для фильтра
  const groups = Array.from(new Set(Array.from(cowMap.values()).map(a => a.group))).sort((a, b) => a - b);

  return (
    <AppLayout title="Стадо">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Управление стадом</h2>
          <p className="page-subtitle">{data.totalAnimals} животных в системе · {animals.length} отображается</p>
        </div>
        <div className="page-header-actions">
          <ExportButton
            data={animals.map(a => ({ Номер: a.cow, Рег_номер: a.regNumber || "—", Группа: a.group, Статус: a.status, Лактация: a.lactation, DIM: a.dim }))}
            filename="стадо"
            columns={[{key: "Номер", label: "Номер"}, {key: "Рег_номер", label: "Рег. номер"}, {key: "Группа", label: "Группа"}, {key: "Статус", label: "Статус"}, {key: "Лактация", label: "Лактация"}, {key: "DIM", label: "DIM"}]}
          />
        </div>
      </div>

      {/* Фильтры */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
        <input
          type="text"
          className="input"
          placeholder="🔍 Поиск по номеру коровы..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 260 }}
        />
        <select className="input" value={groupFilter} onChange={e => setGroupFilter(e.target.value)} style={{ width: 180 }}>
          <option value="all">Все группы</option>
          {groups.map(g => <option key={g} value={String(g)}>Группа {g}</option>)}
        </select>
      </div>

      {/* Таблица */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Номер</th>
                  <th>Рег. номер</th>
                  <th>Группа</th>
                  <th>Статус</th>
                  <th>Лактация</th>
                  <th>DIM</th>
                  <th>Надой (ср. сут.)</th>
                  <th>Тревоги</th>
                </tr>
              </thead>
              <tbody>
                {animals.map((a) => (
                  <tr key={a.cow} style={{ cursor: "pointer" }} onClick={() => router.push(`/herd/${a.cow}`)}>
                    <td>
                      <span style={{ fontWeight: 700, color: "var(--primary-400)" }}>
                        #{a.cow}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{a.regNumber || "—"}</td>
                    <td>{a.group}</td>
                    <td>
                      <span className={`badge ${
                        a.status === "Дойная" || a.status === "Milk" ? "badge-success" :
                        a.status === "Сухостойная" ? "badge-info" :
                        a.status === "Стельная" ? "badge-primary" :
                        a.status === "Охота" ? "badge-warning" :
                        "badge-neutral"
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td>{a.lactation}</td>
                    <td>{a.dim}</td>
                    <td>
                      {a.yield24h !== null
                        ? `${(typeof a.yield24h === 'number' && a.yield24h > 1000 
                            ? (a.yield24h / 1000).toFixed(1) 
                            : a.yield24h?.toFixed?.(1) || "—")} кг`
                        : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {a.alerts.map((alert, i) => (
                          <span key={i} className={`badge ${
                            alert === "Мастит" || alert === "Аборт" ? "badge-danger" :
                            alert === "Кетоз" || alert === "Охота" ? "badge-warning" :
                            alert === "Здоровье" || alert === "Пищеварение" ? "badge-info" :
                            "badge-neutral"
                          }`} style={{ fontSize: 10 }}>
                            {alert}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
