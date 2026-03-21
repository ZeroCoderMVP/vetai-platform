"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function InstanceDetailPage() {
  const { id } = useParams();
  const [instance, setInstance] = useState<any>(null);

  useEffect(() => {
    // Mocking the instance data for MVP
    setInstance({
      id,
      templateName: "Утренний бриф",
      code: "RPT_MORNING_BRIEF",
      period: "18.03.2026 06:00 - 19.03.2026 06:00",
      status: "ready", // draft, generating, ready, validation_error, export_error, sent, archived
      createdAt: "19.03.2026 06:05",
      updatedAt: "19.03.2026 06:07",
      sourceFreshness: "Синхронизировано 5 мин назад",
      errors: [],
      contentPreview: "Сводка: Удой 34л/гол, 2 маститных, 5 в охоте."
    });
  }, [id]);

  if (!instance) {
    return <AppLayout title="Загрузка..."><div style={{ padding: 20 }}>Загрузка отчета...</div></AppLayout>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready": return <span className="badge" style={{ background: "var(--status-healthy)", color: "white" }}>Готов</span>;
      case "draft": return <span className="badge" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Черновик</span>;
      case "generating": return <span className="badge" style={{ background: "var(--status-warning)", color: "white" }}>Генерация...</span>;
      case "validation_error": return <span className="badge" style={{ background: "var(--status-critical)", color: "white" }}>Ошибка валидации</span>;
      case "export_error": return <span className="badge" style={{ background: "var(--status-critical)", color: "white" }}>Ошибка экспорта</span>;
      case "sent": return <span className="badge" style={{ background: "var(--primary-500)", color: "white" }}>Отправлен</span>;
      case "archived": return <span className="badge" style={{ background: "var(--text-tertiary)", color: "white" }}>В архиве</span>;
      default: return null;
    }
  };

  return (
    <AppLayout title={`Экземпляр: ${instance.templateName}`}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Navigation & Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
            <Link href="/reporting" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Отчёты</Link>
            <span style={{ color: 'var(--text-tertiary)' }}>/</span>
            <Link href={`/reporting/templates/mvp-morning-brief`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{instance.templateName}</Link>
            <span style={{ color: 'var(--text-tertiary)' }}>/</span>
            <span style={{ color: 'var(--text-primary)' }}>Экземпляр #{(id as string)?.slice(0, 8)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '32px' }}>📄</span>
                <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>{instance.templateName}</h1>
                {getStatusBadge(instance.status)}
              </div>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-tertiary)', fontSize: '13px', fontFamily: 'monospace' }}>
                <span>Период: {instance.period}</span>
                <span>Свежесть данных: {instance.sourceFreshness}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary">PDF</button>
              <button className="btn btn-secondary">XLSX</button>
              <button className="btn btn-secondary">CSV</button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {instance.status === "validation_error" && (
               <div className="card" style={{ padding: '24px', background: 'var(--status-critical-bg, #fee2e2)', borderLeft: '4px solid var(--status-critical)' }}>
                 <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--status-critical)' }}>Ошибки валидации (2)</h3>
                 <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--status-critical)', fontSize: '13px' }}>
                   <li>Отсутствуют данные по контрольному доению за 18.03.</li>
                   <li>Аномальное падение IOFC в секции 4.</li>
                 </ul>
                 <button className="btn btn-secondary btn-sm" style={{ marginTop: '12px', background: 'white' }}>Просмотреть детали</button>
               </div>
            )}

            <div className="card" style={{ padding: '24px', flexGrow: 1, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Preview содержимого</span>
                <button className="btn btn-secondary btn-sm">Открыть на весь экран</button>
              </h3>
              
              <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '8px', flexGrow: 1, border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', textAlign: 'center' }}>
                  {instance.contentPreview}<br/><br/>
                  (Здесь будет рендер HTML/PDF preview отчёта)
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Детали генерации
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Создан:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{instance.createdAt}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Обновлен:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{instance.updatedAt}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Статус:</span>
                  {getStatusBadge(instance.status)}
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Повторить генерацию</button>
                <Link href="/notifications" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Связанные уведомления</Link>
              </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
               <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                 Аудит отправки
               </h3>
               <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                 <p style={{ margin: '0 0 8px 0' }}>✓ 08:15 — PDF сгенерирован.</p>
                 <p style={{ margin: '0 0 8px 0' }}>✓ 08:16 — Отправлено на email (Директор).</p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
