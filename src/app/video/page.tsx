"use client";
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";

// ---- Camera data ----
const cameras = [
  {
    id: "cam-1", name: "Вход в доильный зал", location: "Доильный зал",
    purpose: "Детекция хромоты", status: "online", fps: 25, resolution: "1920×1080",
    todayDetections: 12, color: "#22c55e",
    thumbnail: "C:\\Users\\sitek\\.gemini\\antigravity\\brain\\277bfee4-9ea3-4638-b954-cb4e3763e550\\cow_ai_detection_1773389250790.png",
    hourlyDetections: [0,0,0,0,0,1,3,5,4,6,8,12,10,9,7,5,3,2,1,0,0,0,0,0],
    lastDetection: { time: "10:15", type: "Хромота", animal: "#21", confidence: 87 },
  },
  {
    id: "cam-2", name: "Выход из доильного зала", location: "Доильный зал",
    purpose: "Детекция хромоты + упитанность", status: "online", fps: 25, resolution: "1920×1080",
    todayDetections: 9, color: "#3b82f6",
    thumbnail: "C:\\Users\\sitek\\.gemini\\antigravity\\brain\\277bfee4-9ea3-4638-b954-cb4e3763e550\\cam_exit_lameness_1773389723774.png",
    hourlyDetections: [0,0,0,0,0,0,2,4,3,5,6,9,8,7,5,4,2,1,0,0,0,0,0,0],
    lastDetection: { time: "10:08", type: "Упитанность <2.5", animal: "#47", confidence: 92 },
  },
  {
    id: "cam-3", name: "Загон Высокоудойные", location: "Секция 1",
    purpose: "Активность / Поведение", status: "online", fps: 15, resolution: "1920×1080",
    todayDetections: 5, color: "#f59e0b",
    thumbnail: "C:\\Users\\sitek\\.gemini\\antigravity\\brain\\277bfee4-9ea3-4638-b954-cb4e3763e550\\cam_high_yield_1773389742467.png",
    hourlyDetections: [0,0,0,0,0,0,1,1,2,2,3,5,4,3,2,2,1,1,0,0,0,0,0,0],
    lastDetection: { time: "09:30", type: "Низкая активность", animal: "#15", confidence: 81 },
  },
  {
    id: "cam-4", name: "Загон Среднеудойные", location: "Секция 2",
    purpose: "Активность / Поведение", status: "online", fps: 15, resolution: "1920×1080",
    todayDetections: 3, color: "#8b5cf6",
    thumbnail: "C:\\Users\\sitek\\.gemini\\antigravity\\brain\\277bfee4-9ea3-4638-b954-cb4e3763e550\\cam_mid_yield_1773389760425.png",
    hourlyDetections: [0,0,0,0,0,0,0,1,1,1,2,3,2,2,1,1,0,0,0,0,0,0,0,0],
    lastDetection: { time: "09:12", type: "Отделение от стада", animal: "#29", confidence: 73 },
  },
  {
    id: "cam-5", name: "Родильное отделение", location: "Родильное",
    purpose: "Предвестники отёла", status: "online", fps: 25, resolution: "1280×720",
    todayDetections: 4, color: "#ef4444",
    thumbnail: "C:\\Users\\sitek\\.gemini\\antigravity\\brain\\277bfee4-9ea3-4638-b954-cb4e3763e550\\cam_maternity_1773389778196.png",
    hourlyDetections: [1,1,0,0,0,0,0,1,1,2,2,4,3,2,2,1,1,0,0,0,0,0,0,0],
    lastDetection: { time: "09:45", type: "Предвестники отёла", animal: "#33", confidence: 94 },
  },
  {
    id: "cam-6", name: "Кормовой стол", location: "Кормление",
    purpose: "Остатки корма / Поведение", status: "offline", fps: 0, resolution: "1920×1080",
    todayDetections: 0, color: "#6b7280",
    thumbnail: null,
    hourlyDetections: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    lastDetection: null,
  },
];

const recentDetections = [
  { id: 1, time: "10:15", camera: "Вход в доильный зал", type: "Хромота (балл 3)", animal: "#21", confidence: 87, severity: "warning" as const },
  { id: 2, time: "10:12", camera: "Выход из д/з", type: "Упитанность 2.25", animal: "#47", confidence: 92, severity: "warning" as const },
  { id: 3, time: "10:08", camera: "Вход в доильный зал", type: "Хромота (балл 2)", animal: "#8", confidence: 78, severity: "info" as const },
  { id: 4, time: "09:45", camera: "Родильное отд.", type: "Предвестники отёла", animal: "#33", confidence: 94, severity: "critical" as const },
  { id: 5, time: "09:30", camera: "Загон Высокоуд.", type: "Низкая активность", animal: "#15", confidence: 81, severity: "info" as const },
  { id: 6, time: "09:12", camera: "Загон Среднеуд.", type: "Отделение от стада", animal: "#29", confidence: 73, severity: "warning" as const },
  { id: 7, time: "08:55", camera: "Выход из д/з", type: "Упитанность 2.0", animal: "#52", confidence: 85, severity: "warning" as const },
  { id: 8, time: "08:40", camera: "Родильное отд.", type: "Беспокойство", animal: "#33", confidence: 88, severity: "info" as const },
  { id: 9, time: "08:22", camera: "Вход в доильный зал", type: "Хромота (балл 2)", animal: "#14", confidence: 76, severity: "info" as const },
  { id: 10, time: "07:55", camera: "Выход из д/з", type: "Упитанность 2.5", animal: "#38", confidence: 90, severity: "info" as const },
];

const models = [
  { name: "Оценка упитанности", version: "2.4.1", accuracy: 94.2, status: "active", detectionsToday: 14 },
  { name: "Детекция хромоты", version: "1.8.0", accuracy: 87.5, status: "active", detectionsToday: 18 },
  { name: "Предвестники отёла", version: "1.3.2", accuracy: 91.0, status: "active", detectionsToday: 4 },
  { name: "Активность / Поведение", version: "2.1.0", accuracy: 88.7, status: "active", detectionsToday: 8 },
  { name: "Мастит (термография)", version: "0.9.1", accuracy: 72.3, status: "beta", detectionsToday: 0 },
];

// ---- Mini sparkline for hourly detections ----
function HourlyChart({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data, 1);
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      {data.map((v, i) => (
        <rect
          key={i}
          x={i * w + w * 0.15}
          y={height - (v / max) * height}
          width={w * 0.7}
          height={(v / max) * height}
          fill={v > 0 ? color : "var(--bg-elevated)"}
          rx={1}
          opacity={v > 0 ? 0.8 : 0.3}
        />
      ))}
    </svg>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const color = value >= 90 ? "var(--success)" : value >= 80 ? "var(--warning)" : "var(--text-tertiary)";
  return <span style={{ fontSize: 11, fontWeight: 600, color }}>{value}%</span>;
}

export default function VideoAnalyticsPage() {
  const [selectedCam, setSelectedCam] = useState<string | null>(null);
  const onlineCams = cameras.filter(c => c.status === "online").length;
  const totalDetections = cameras.reduce((s, c) => s + c.todayDetections, 0);

  const selectedCamera = cameras.find(c => c.id === selectedCam);

  return (
    <AppLayout title="Видеоаналитика">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">📹 Видеоаналитика</h2>
          <p className="page-subtitle">ИИ-анализ видеопотоков: хромота, упитанность, поведение, отёлы</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid">
        <div className="kpi-card green">
          <div className="kpi-header">
            <span className="kpi-label">Камер онлайн</span>
            <div className="kpi-icon green">📹</div>
          </div>
          <div className="kpi-value">{onlineCams}<span className="kpi-unit"> / {cameras.length}</span></div>
          <span className={`kpi-change ${cameras.filter(c => c.status === "offline").length === 0 ? "positive" : "negative"}`}>
            {cameras.filter(c => c.status === "offline").length === 0 ? "Все работают" : `${cameras.filter(c => c.status === "offline").length} не в сети`}
          </span>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-header">
            <span className="kpi-label">Детекций сегодня</span>
            <div className="kpi-icon amber">🔍</div>
          </div>
          <div className="kpi-value">{totalDetections}</div>
          <span className="kpi-change neutral">Хромота: 18 · Упитанность: 14</span>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-header">
            <span className="kpi-label">Критических</span>
            <div className="kpi-icon" style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}>⚠️</div>
          </div>
          <div className="kpi-value">2</div>
          <span className="kpi-change negative">Требуют внимания ветеринара</span>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-header">
            <span className="kpi-label">Ср. точность ИИ</span>
            <div className="kpi-icon blue">🎯</div>
          </div>
          <div className="kpi-value">{(models.filter(m => m.status === "active").reduce((s, m) => s + m.accuracy, 0) / models.filter(m => m.status === "active").length).toFixed(1)}<span className="kpi-unit">%</span></div>
          <span className="kpi-change positive">{models.filter(m => m.status === "active").length} моделей активно</span>
        </div>
      </div>

      {/* Camera grid — 3 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        {cameras.map(cam => (
          <div
            key={cam.id}
            className="card"
            style={{
              cursor: "pointer",
              border: selectedCam === cam.id ? "2px solid var(--primary-400)" : undefined,
              opacity: cam.status === "offline" ? 0.6 : 1,
            }}
            onClick={() => setSelectedCam(cam.id === selectedCam ? null : cam.id)}
          >
            {/* Camera preview placeholder */}
            <div style={{
              height: 140,
              background: cam.status === "online" && !cam.thumbnail
                ? "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)"
                : "linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)",
              borderRadius: "var(--radius-md) var(--radius-md) 0 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}>
              {cam.thumbnail && (
                <img 
                  src={`/api/local-image?path=${encodeURIComponent(cam.thumbnail)}`} 
                  alt={cam.name} 
                  style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              {/* Scan lines effect */}
              <div style={{
                position: "absolute", inset: 0,
                background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)",
              }} />
              
              {/* Status indicator */}
              <div style={{
                position: "absolute", top: 8, left: 8,
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 10, color: cam.status === "online" ? "#22c55e" : "#ef4444",
                background: "rgba(0,0,0,0.5)", padding: "2px 8px", borderRadius: 10,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", animation: cam.status === "online" ? "pulse 2s infinite" : undefined }} />
                {cam.status === "online" ? "LIVE" : "OFFLINE"}
              </div>

              {/* Resolution + FPS */}
              <div style={{
                position: "absolute", top: 8, right: 8,
                fontSize: 9, color: "rgba(255,255,255,0.5)",
                background: "rgba(0,0,0,0.5)", padding: "2px 6px", borderRadius: 6,
              }}>
                {cam.resolution} · {cam.fps} FPS
              </div>

              {/* Camera icon / center */}
              <div style={{ fontSize: 32, opacity: 0.3 }}>
                {cam.status === "online" ? "📹" : "🔌"}
              </div>

              {/* Detection counter */}
              {cam.todayDetections > 0 && (
                <div style={{
                  position: "absolute", bottom: 8, right: 8,
                  background: cam.color, color: "#fff",
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                }}>
                  {cam.todayDetections} детекций
                </div>
              )}

              {/* Camera name overlay */}
              <div style={{
                position: "absolute", bottom: 8, left: 8,
                fontSize: 11, color: "#fff", fontWeight: 600,
                background: "rgba(0,0,0,0.5)", padding: "2px 8px", borderRadius: 6,
              }}>
                {cam.name}
              </div>
            </div>

            {/* Camera info */}
            <div style={{ padding: "var(--space-3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{cam.purpose}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{cam.location}</div>
                </div>
              </div>

              {/* Hourly bar chart */}
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 2 }}>Детекции по часам (0–23)</div>
                <HourlyChart data={cam.hourlyDetections} color={cam.color} />
              </div>

              {/* Last detection */}
              {cam.lastDetection && (
                <div style={{
                  marginTop: 6, padding: "4px 8px",
                  background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)",
                  fontSize: 11, display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ color: "var(--text-secondary)" }}>
                    Посл.: <strong>{cam.lastDetection.type}</strong> {cam.lastDetection.animal}
                  </span>
                  <ConfidenceBadge value={cam.lastDetection.confidence} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selected camera details */}
      {selectedCamera && selectedCamera.status === "online" && (
        <div className="card" style={{ marginTop: "var(--space-4)" }}>
          <div className="card-header">
            <span className="card-title">🎥 {selectedCamera.name} — Прямой эфир</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCam(null)}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-4)" }}>
            {/* Video stream placeholder */}
            <div style={{
              height: 320,
              background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0f3460 100%)",
              borderRadius: "var(--radius-md)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", overflow: "hidden", margin: "var(--space-4)",
            }}>
              {/* Image from generate_image tool */}
              {selectedCamera.thumbnail && (
                <img 
                  src={`/api/local-image?path=${encodeURIComponent(selectedCamera.thumbnail)}`} 
                  alt="AI stream" 
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <div style={{
                position: "absolute", inset: 0,
                background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
              }} />
              <div style={{
                position: "absolute", top: 12, left: 12,
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, color: "#22c55e",
                background: "rgba(0,0,0,0.6)", padding: "4px 12px", borderRadius: 12,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                REC · {selectedCamera.resolution} · {selectedCamera.fps} FPS
              </div>

              {/* Fake AI Bounding box (absolute positioned on top of video) */}
              <div style={{
                position: "absolute",
                top: "40%", left: "35%", width: "30%", height: "40%",
                border: "2px solid #ef4444", borderRadius: 4,
                boxShadow: "0 0 10px rgba(239,68,68,0.5)",
                display: "flex", flexDirection: "column",
              }}>
                 <div style={{ background: "#ef4444", color: "white", fontSize: 10, alignSelf: "flex-start", padding: "2px 6px", fontWeight: "bold" }}>🚨 Аномалия: Хромота (92%)</div>
                 <div style={{ background: "rgba(0,0,0,0.7)", color: "white", fontSize: 10, alignSelf: "flex-start", padding: "2px 6px", marginTop: "auto", borderTop: "1px solid #ef4444" }}>Корова #21</div>
              </div>

              {!selectedCamera.name.includes("Кормовой") && (
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", zIndex: 1, textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                  <div style={{ fontSize: 13, marginTop: 8 }}>RTSP-поток: {selectedCamera.name}</div>
                </div>
              )}
              <div style={{
                position: "absolute", bottom: 12, left: 12, right: 12,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontSize: 11, color: "rgba(255,255,255,0.8)",
                textShadow: "0 1px 2px rgba(0,0,0,0.8)"
              }}>
                <span>{selectedCamera.location}</span>
                <span>{new Date().toLocaleTimeString("ru-RU")}</span>
              </div>
            </div>

            {/* Camera stats */}
            <div style={{ padding: "var(--space-4) var(--space-4) var(--space-4) 0" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: "var(--space-3)" }}>📊 Статистика камеры</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {[
                  { l: "Назначение", v: selectedCamera.purpose },
                  { l: "Разрешение", v: selectedCamera.resolution },
                  { l: "Частота кадров", v: `${selectedCamera.fps} FPS` },
                  { l: "Детекций сегодня", v: selectedCamera.todayDetections },
                  { l: "Статус", v: "🟢 В сети" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.l}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{r.v}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, marginTop: "var(--space-4)", marginBottom: "var(--space-2)" }}>📈 Детекции по часам</div>
              <HourlyChart data={selectedCamera.hourlyDetections} color={selectedCamera.color} height={60} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom row: Detections + Models */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginTop: "var(--space-4)" }}>
        {/* Recent detections */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔍 Последние детекции</span>
            <span className="badge badge-neutral">{recentDetections.length}</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="event-list" style={{ maxHeight: 360, overflowY: "auto" }}>
              {recentDetections.map(d => (
                <div key={d.id} className="event-item">
                  <span className="event-dot" style={{
                    background: d.severity === "critical" ? "var(--danger)" : d.severity === "warning" ? "var(--warning)" : "var(--info)"
                  }} />
                  <div className="event-content" style={{ flex: 1 }}>
                    <div className="event-text">
                      <strong>{d.type}</strong> — {d.animal}
                    </div>
                    <div className="event-time">
                      {d.time} · {d.camera} · <ConfidenceBadge value={d.confidence} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Models */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🧠 ИИ-модели</span>
            <span className="badge badge-primary">{models.filter(m => m.status === "active").length} активных</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Модель</th><th>Точность</th><th>Детекций</th><th>Статус</th></tr>
                </thead>
                <tbody>
                  {models.map((m, i) => (
                    <tr key={i}>
                      <td>
                        <strong style={{ fontSize: 13 }}>{m.name}</strong>
                        <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>v{m.version}</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 60, height: 5, background: "var(--bg-elevated)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{
                              width: `${m.accuracy}%`, height: "100%",
                              background: m.accuracy >= 90 ? "var(--success)" : m.accuracy >= 80 ? "var(--warning)" : "var(--danger)",
                              borderRadius: 3,
                            }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{m.accuracy}%</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.detectionsToday}</td>
                      <td>
                        <span className={`badge ${m.status === "active" ? "badge-success" : "badge-warning"}`}>
                          {m.status === "active" ? "Активна" : "Бета"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </AppLayout>
  );
}
