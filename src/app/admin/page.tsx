"use client";

import AppLayout from "@/components/layout/AppLayout";

const roles = [
  { name: "Администратор", role: "Владелец", email: "admin@vetai.ru", status: "Активен" },
  { name: "Иванов И.И.", role: "Зоотехник", email: "ivanov@vetai.ru", status: "Активен" },
  { name: "Петрова М.А.", role: "Ветеринар", email: "petrova@vetai.ru", status: "Активен" },
  { name: "Сидоров К.В.", role: "Дояр", email: "sidorov@vetai.ru", status: "Активен" },
  { name: "Волков А.Б.", role: "ИТ-специалист", email: "volkov@vetai.ru", status: "Активен" },
];

const integrations = [
  { name: "Afimilk", type: "API JSON", status: "active", lastSync: "05.03.2026 13:49", records: "9 отчётов" },
  { name: "DTM", type: "Excel импорт", status: "active", lastSync: "05.03.2026", records: "5 файлов" },
  { name: "AIC Waikato DairyTRACE", type: ".AIC файлы", status: "active", lastSync: "05.03.2026 06:28", records: "22 записи" },
  { name: "Видеонаблюдение (ONVIF)", type: "RTSP/ONVIF", status: "planned", lastSync: "—", records: "—" },
  { name: "IoT-датчики", type: "MQTT", status: "planned", lastSync: "—", records: "—" },
];

export default function AdminPage() {
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
                ["Поголовье", "~1300 голов"],
                ["Загонов/групп", "22+"],
                ["Тип содержания", "Беспривязное"],
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
                ["Последнее обновление", "12.03.2026"],
                ["Доильный зал", "AIC Waikato @ 192.168.50.138"],
                ["Статус", "✅ Работает"],
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
                {integrations.map((int) => (
                  <tr key={int.name}>
                    <td><strong>{int.name}</strong></td>
                    <td style={{ fontSize: 12 }}>{int.type}</td>
                    <td>
                      <span className={`badge ${int.status === "active" ? "badge-success" : "badge-neutral"}`}>
                        {int.status === "active" ? "✅ Активна" : "📋 Планируется"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{int.lastSync}</td>
                    <td>{int.records}</td>
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
