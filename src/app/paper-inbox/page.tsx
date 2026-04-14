"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";

type ScannedEvent = {
  id: string;
  cowNumber: string;
  eventType: string;
  date: string;
  notes: string;
  confidenceScore: number;
};

export default function PaperInboxPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedEvent[]>([]);
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setScannedData([]);

    try {
      // Имитация отправки файла
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/paper-inbox/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setScannedData(data.results);
      } else {
        alert("Ошибка распознавания: " + data.error);
      }
    } catch (err) {
      alert("Не удалось загрузить файл");
    } finally {
      setUploading(false);
    }
  };

  const handleFieldChange = (id: string, field: keyof ScannedEvent, value: string) => {
    setScannedData((prev) => 
      prev.map((item) => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  const handleRemove = (id: string) => {
    setScannedData((prev) => prev.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    if (scannedData.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/paper-inbox/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: scannedData }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Успешно сохранено событий: ${data.count}`);
        setScannedData([]);
        setFile(null);
      } else {
        alert("Ошибка сохранения: " + data.error);
      }
    } catch (err) {
      alert("Не удалось сохранить данные");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Распознавание журналов">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">📄 Распознавание журналов (Скан-Ввод)</h2>
          <p className="page-subtitle">Загрузите фото бумажного листа для автоматического распознавания событий</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "var(--space-4)" }}>
        <div className="card-header">
          <span className="card-title">Загрузка документа</span>
        </div>
        <div className="card-body" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <input 
             type="file" 
             accept="image/*,.pdf" 
             onChange={handleFileChange} 
             disabled={uploading}
             style={{ border: "1px solid var(--border)", padding: "var(--space-2)", borderRadius: "var(--radius-md)" }}
          />
          <button 
             className="btn btn-primary" 
             onClick={handleUpload}
             disabled={!file || uploading}
          >
            {uploading ? "Распознавание OCR (до 5 сек)..." : "Распознать документ"}
          </button>
        </div>
      </div>

      {scannedData.length > 0 && (
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="card-title">Проверка распознанных данных</span>
            <button 
                className="btn btn-primary" 
                onClick={handleSave} 
                disabled={saving}
                style={{ backgroundColor: "var(--ok)", borderColor: "var(--ok)" }}
            >
              {saving ? "Сохранение..." : "Подтвердить и сохранить"}
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
             <div className="table-container">
               <table>
                 <thead>
                   <tr>
                     <th>Номер животного</th>
                     <th>Тип события</th>
                     <th>Дата / Время</th>
                     <th>Примечание</th>
                     <th>Уверенность OCR</th>
                     <th>Действия</th>
                   </tr>
                 </thead>
                 <tbody>
                    {scannedData.map((item) => (
                      <tr key={item.id} style={{ backgroundColor: item.confidenceScore < 60 ? "rgba(231, 76, 60, 0.05)" : "transparent" }}>
                        <td>
                          <input 
                            type="text" 
                            value={item.cowNumber}
                            onChange={(e) => handleFieldChange(item.id, "cowNumber", e.target.value)}
                            style={{ 
                              border: item.confidenceScore < 60 ? "2px solid var(--warning)" : "1px solid var(--border)",
                              padding: "4px", borderRadius: "4px", width: "100%"
                            }}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={item.eventType}
                            onChange={(e) => handleFieldChange(item.id, "eventType", e.target.value)}
                            style={{ border: "1px solid var(--border)", padding: "4px", borderRadius: "4px", width: "100%" }}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={item.date}
                            onChange={(e) => handleFieldChange(item.id, "date", e.target.value)}
                            style={{ border: "1px solid var(--border)", padding: "4px", borderRadius: "4px", width: "100%" }}
                            title="В формате ISO"
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            value={item.notes}
                            onChange={(e) => handleFieldChange(item.id, "notes", e.target.value)}
                            style={{ border: "1px solid var(--border)", padding: "4px", borderRadius: "4px", width: "100%" }}
                          />
                        </td>
                        <td>
                          {item.confidenceScore}%
                          {item.confidenceScore < 60 && <span style={{ color: "var(--warning)", marginLeft: 6 }}>⚠️ Проверьте</span>}
                        </td>
                        <td>
                           <button 
                             className="btn btn-sm btn-outline" 
                             onClick={() => handleRemove(item.id)}
                            >Удалить строку</button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
