"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";

const roles = [
  { name: "Администратор", role: "Владелец", email: "admin@vetai.ru", status: "Активен" },
  { name: "Иванов И.И.", role: "Зоотехник", email: "ivanov@vetai.ru", status: "Активен" },
  { name: "Петрова М.А.", role: "Ветеринар", email: "petrova@vetai.ru", status: "Активен" },
  { name: "Сидоров К.В.", role: "Дояр", email: "sidorov@vetai.ru", status: "Активен" },
  { name: "Волков А.Б.", role: "ИТ-специалист", email: "volkov@vetai.ru", status: "Активен" },
];

const plannedIntegrations = [
  { name: "Видеонаблюдение (ONVIF)", type: "RTSP/ONVIF", status: "planned", lastSync: "—", records: "—" },
  { name: "IoT-датчики", type: "MQTT", status: "planned", lastSync: "—", records: "—" },
];

type IntegrationBatch = {
  id: string;
  status: string;
  recordsInserted: number;
  recordCount: number;
  createdAt: string;
};

type DataSource = {
  id: string;
  name: string;
  type: string;
  status: string;
  batches: IntegrationBatch[];
};

type ApiTotals = {
  records: number;
  cows: number;
  events: number;
};

export default function AdminPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [totals, setTotals] = useState<ApiTotals>({ records: 0, cows: 0, events: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/import")
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки данных интеграций");
        return res.json();
      })
      .then((data) => {
        setSources(data.sources || []);
        if (data.totals) setTotals(data.totals);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const dbActiveIntegrations = sources.map((source) => {
    const latestBatch = source.batches?.[0];
    const recordsText = latestBatch 
      ? `${latestBatch.recordsInserted} загружено` 
      : "0 загружено";

    let displayType = "Локальные файлы";
    if (source.name === "afimilk") displayType = "API JSON";
    if (source.name === "dtm") displayType = "Excel импорт";
    if (source.name === "aic") displayType = ".AIC файлы";

    const displayName = source.name === "afimilk" ? "Afimilk" :
                        source.name === "dtm" ? "DTM" :
                        source.name === "aic" ? "AIC Waikato DairyTRACE" : source.name;

    return {
      name: displayName,
      type: displayType,
      status: source.status === "active" ? "active" : "error",
      lastSync: formatDate(latestBatch?.createdAt),
      records: recordsText,
    };
  });

  const allIntegrations = [...dbActiveIntegrations, ...plannedIntegrations];

  return (
    <AppLayout title="Администрирование">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">⚙️ Администрирование</h2>
          <p className="page-subtitle">Управление системой, пользователями и интеграциями</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Информация о ферме */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🏠 Информация о ферме</span>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {[
                ["Организация", "АО «Гатчинское»"],
                ["Ферма", "Ферма №1"],
                ["Адрес", "Ленинградская обл."],
                ["Поголовье", loading ? "..." : `~${totals.cows} голов`],
                ["Всего записей доений", loading ? "..." : `${totals.records}`],
                ["Всего событий", loading ? "..." : `${totals.events}`],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{label}</span>
                  <strong style={{ fontSize: 13 }}>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Системная информация */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">💻 Система</span>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {[
                ["Платформа", "ВЕТАИ v1.0.0"],
                ["Стек", "Next.js 14 + TypeScript"],
                ["База данных", "SQLite (MVP)"],
                ["Последнее обновление БД", loading || !dbActiveIntegrations[0] ? "—" : (dbActiveIntegrations[0].lastSync || "—").split(' ')[0]],
                ["Доильный зал", "AIC Waikato @ 192.168.50.138"],
                ["Статус API", error ? "❌ Ошибка" : loading ? "⏳ Опрос..." : "✅ Работает"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{label}</span>
                  <strong style={{ fontSize: 13 }}>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Пользователи */}
      <div className="card" style={{ marginTop: "var(--space-4)" }}>
        <div className="card-header">
          <span className="card-title">👥 Пользователи и роли</span>
          <button className="btn btn-primary btn-sm">+ Добавить</button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Роль</th>
                  <th>Email</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((user) => (
                  <tr key={user.email}>
                    <td><strong>{user.name}</strong></td>
                    <td>
                      <span className={`badge ${
                        user.role === "Владелец" ? "badge-primary" :
                        user.role === "Ветеринар" ? "badge-danger" :
                        user.role === "Зоотехник" ? "badge-info" :
                        "badge-neutral"
                      }`}>{user.role}</span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{user.email}</td>
                    <td><span className="badge badge-success">{user.status}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm">✏️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Интеграции */}
      <div className="card" style={{ marginTop: "var(--space-4)" }}>
        <div className="card-header">
          <span className="card-title">🔗 Интеграции</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {error && (
            <div style={{ padding: "1rem", color: "var(--danger-500)", background: "var(--danger-50)" }}>
              {error}
            </div>
          )}
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
              ⏳ Загрузка статусов интеграций...
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Система</th>
                    <th>Тип</th>
                    <th>Статус</th>
                    <th>Последняя синхронизация</th>
                    <th>Данные</th>
                  </tr>
                </thead>
                <tbody>
                  {allIntegrations.map((int) => (
                    <tr key={int.name}>
                      <td><strong>{int.name}</strong></td>
                      <td style={{ fontSize: 12 }}>{int.type}</td>
                      <td>
                        <span className={`badge ${int.status === "active" ? "badge-success" : int.status === "error" ? "badge-danger" : "badge-neutral"}`}>
                          {int.status === "active" ? "✅ Активна" : int.status === "error" ? "❌ Ошибка" : "📋 Планируется"}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{int.lastSync}</td>
                      <td>{int.records}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
