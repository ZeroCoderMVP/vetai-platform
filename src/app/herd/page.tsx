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

  const lactationData = useMemo(() => {
    const counts = { '1': 0, '2': 0, '3': 0, '4': 0, '5+': 0 };
    filteredAnimals.forEach(a => {
      const l = a.lactation || 0;
      if (l === 1) counts['1']++;
      else if (l === 2) counts['2']++;
      else if (l === 3) counts['3']++;
      else if (l === 4) counts['4']++;
      else if (l >= 5) counts['5+']++;
    });
    return [
      {
        name: 'Состав стада',
        '1 лактация': counts['1'],
        '2 лактация': counts['2'],
        '3 лактация': counts['3'],
        '4 лактация': counts['4'],
        '5+ лактация': counts['5+'],
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
          <span className="card-title">📊 Структура стада по возрасту (лактациям)</span>
        </div>
        <div className="card-body" style={{ height: 200, padding: "var(--space-4)" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={lactationData}
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
              <Bar dataKey="1 лактация" stackId="a" fill="#3b82f6" />
              <Bar dataKey="2 лактация" stackId="a" fill="#10b981" />
              <Bar dataKey="3 лактация" stackId="a" fill="#f59e0b" />
              <Bar dataKey="4 лактация" stackId="a" fill="#ef4444" />
              <Bar dataKey="5+ лактация" stackId="a" fill="#8b5cf6" />
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
