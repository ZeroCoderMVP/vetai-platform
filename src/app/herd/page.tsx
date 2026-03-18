"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import ExportButton from "@/components/ui/ExportButton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

type HerdItem = {
  id: string;
  cow: string;
  regNumber: string | null;
  group: string;
  status: string;
  lactation: number;
  dim: number;
  alerts: string[];
};

type HerdApiResponse = {
  status: "ok" | "no_data";
  total: number;
  items: HerdItem[];
};

export default function HerdPage() {
  const router = useRouter();
  const [data, setData] = useState<HerdApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/herd")
      .then((res) => res.json())
      .then((payload: HerdApiResponse) => {
        setData(payload);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredAnimals = useMemo(() => {
    if (!data) return [];

    return data.items.filter((animal) => {
      const matchesSearch =
        search.length === 0 ||
        animal.cow.includes(search) ||
        animal.regNumber?.toLowerCase().includes(search.toLowerCase()) ||
        animal.group.toLowerCase().includes(search.toLowerCase());

      const matchesGroup = groupFilter === "all" || animal.group === groupFilter;
      return Boolean(matchesSearch && matchesGroup);
    });
  }, [data, groupFilter, search]);

  const groups = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.items.map((animal) => animal.group))).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const herdStructureData = useMemo(() => {
    const counts = { 'Телки': 0, 'Нетели': 0, 'Быки': 0, 'Дойные': 0, 'Сухостойные': 0 };
    filteredAnimals.forEach(a => {
      const s = a.status?.toLowerCase() || "";
      if (s.includes("телка") || s.includes("тёлка") || s === "heifer") counts['Телки']++;
      else if (s.includes("нетел") || s === "pregnant heifer") counts['Нетели']++;
      else if (s.includes("бык") || s === "bull") counts['Быки']++;
      else if (s.includes("сухостой") || s === "dry") counts['Сухостойные']++;
      else if (s.includes("дойн") || s === "milk") counts['Дойные']++;
      else {
        // Fallback guess
        if (a.lactation && a.lactation > 0) counts['Дойные']++;
        else counts['Телки']++;
      }
    });
    return [
      {
        name: 'Состав стада',
        'Телки': counts['Телки'],
        'Нетели': counts['Нетели'],
        'Быки': counts['Быки'],
        'Дойные': counts['Дойные'],
        'Сухостойные': counts['Сухостойные'],
      }
    ];
  }, [filteredAnimals]);

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

  if (data.status === "no_data") {
    return (
      <AppLayout title="Стадо">
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">Данные не загружены. Сначала выполните импорт в SQLite.</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Стадо">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Управление стадом</h2>
          <p className="page-subtitle">
            {data.total} животных в системе · {filteredAnimals.length} отображается
          </p>
        </div>
        <div className="page-header-actions">
          <ExportButton
            data={filteredAnimals.map((a) => ({
              ID: a.id,
              Номер: a.cow,
              Рег_номер: a.regNumber || "—",
              Группа: a.group,
              Статус: a.status,
              Лактация: a.lactation,
              DIM: a.dim,
            }))}
            filename="стадо"
            columns={[
              { key: "ID", label: "ID" },
              { key: "Номер", label: "Номер" },
              { key: "Рег_номер", label: "Рег. номер" },
              { key: "Группа", label: "Группа" },
              { key: "Статус", label: "Статус" },
              { key: "Лактация", label: "Лактация" },
              { key: "DIM", label: "DIM" },
            ]}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
        <input
          type="text"
          className="input"
          placeholder="🔍 Поиск по номеру, рег. номеру, группе..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 320 }}
        />
        <select
          className="input"
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          style={{ width: 220 }}
        >
          <option value="all">Все группы</option>
          {groups.map((groupName) => (
            <option key={groupName} value={groupName}>
              {groupName}
            </option>
          ))}
        </select>
      </div>

      <div className="card" style={{ marginBottom: "var(--space-4)" }}>
        <div className="card-header">
          <span className="card-title">📊 Структура стада</span>
        </div>
        <div className="card-body" style={{ height: 200, padding: "var(--space-4)" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={herdStructureData}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" hide />
              <Tooltip 
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: any) => [value, 'голов']}
              />
              <Legend verticalAlign="top" height={36}/>
              <Bar dataKey="Дойные" stackId="a" fill="#3b82f6" />
              <Bar dataKey="Сухостойные" stackId="a" fill="#10b981" />
              <Bar dataKey="Телки" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Нетели" stackId="a" fill="#ef4444" />
              <Bar dataKey="Быки" stackId="a" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

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
                  <th>Тревоги</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnimals.map((animal) => (
                  <tr
                    key={animal.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => router.push(`/herd/${animal.id}`)}
                  >
                    <td>
                      <span style={{ fontWeight: 700, color: "var(--primary-400)" }}>#{animal.cow}</span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{animal.regNumber || "—"}</td>
                    <td>{animal.group}</td>
                    <td>
                      <span
                        className={`badge ${
                          animal.status === "Дойная" || animal.status === "Milk"
                            ? "badge-success"
                            : animal.status === "Сухостойная"
                              ? "badge-info"
                              : animal.status === "Стельная"
                                ? "badge-primary"
                                : animal.status === "Охота"
                                  ? "badge-warning"
                                  : "badge-neutral"
                        }`}
                      >
                        {animal.status}
                      </span>
                    </td>
                    <td>{animal.lactation}</td>
                    <td>{animal.dim}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {animal.alerts.length === 0 ? (
                          <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                            —
                          </span>
                        ) : (
                          animal.alerts.map((alert) => (
                            <span
                              key={`${animal.id}-${alert}`}
                              className={`badge ${
                                alert === "Мастит" || alert === "Аборт"
                                  ? "badge-danger"
                                  : alert === "Кетоз" || alert === "Охота"
                                    ? "badge-warning"
                                    : alert === "Здоровье" || alert === "Пищеварение"
                                      ? "badge-info"
                                      : "badge-neutral"
                              }`}
                              style={{ fontSize: 10 }}
                            >
                              {alert}
                            </span>
                          ))
                        )}
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
