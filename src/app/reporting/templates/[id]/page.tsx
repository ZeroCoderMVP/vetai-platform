"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { useParams } from "next/navigation";

// Reuse the statically defined MVP templates to populate details if requested
const MVPTemplates = [
  { id: "mvp-morning-brief", code: "RPT_MORNING_BRIEF", name: "Утренний бриф", description: "Сводка за прошедшие сутки: надои, отклонения здоровья, проблемы с доением.", reportType: "DAILY", periodicity: "Ежедневно (утро)", kpis: ["Удой за сутки", "Больные новотельные", "Охота"], defaultFormat: "PDF", status: "active", audience: "Управляющий, Главный врач", schedule: "Ежедневно 06:00" },
  { id: "mvp-shift-parlor", code: "RPT_SHIFT_PARLOR", name: "Сменный отчет по доению", description: "Результаты смены в доильном зале: пропускная способность, промывки, маститные коровы.", reportType: "SHIFT", periodicity: "Каждую смену", kpis: ["Эффективность зала", "Сброшенное молоко", "Снятие аппаратов"], defaultFormat: "PDF", status: "active", audience: "Старший оператор доения", schedule: "Каждые 8 часов" },
  { id: "mvp-weekly-herd", code: "RPT_WEEKLY_HERD", name: "Недельный свод по стаду", description: "Динамика стада за неделю: перемещения, осеменения, запуски, отелы.", reportType: "WEEKLY", periodicity: "Еженедельно", kpis: ["% Сохранности", "Стельность", "Выбытия"], defaultFormat: "XLSX", status: "active", audience: "Зоотехник, Руководитель", schedule: "Понедельник 08:00" },
  { id: "mvp-monthly-management", code: "RPT_MONTHLY_MANAGEMENT", name: "Месячный управленческий отчет", description: "Комплексный анализ: экономика, конверсия корма, итоги по молоку и ремонту стада.", reportType: "MONTHLY", periodicity: "Ежемесячно", kpis: ["IOFC", "Стоимость рациона", "Выручка"], defaultFormat: "XLSX", status: "active", audience: "Инвестор, Директор", schedule: "1 число месяца" }
];

export default function TemplateDetailPage() {
  const { id } = useParams();
  const [template, setTemplate] = useState<any>(null);

  useEffect(() => {
    // Attempt fallback to local static templates
    const staticTemplate = MVPTemplates.find(t => t.id === id);
    if (staticTemplate) {
      setTemplate(staticTemplate);
    } else {
      // Mocked DB fetch behavior
      setTemplate({
        id, code: "RPT_CUSTOM", name: "Кастомный отчет", description: "Этот отчет сгенерирован автоматически из базы.",
        reportType: "REGULATORY", periodicity: "По требованию", kpis: ["Показатель 1", "Показатель 2"], defaultFormat: "PDF", status: "active", audience: "Все", schedule: "Нет"
      });
    }
  }, [id]);

  if (!template) {
    return <AppLayout title="Загрузка..."><div style={{ padding: 20 }}>Загрузка шаблона...</div></AppLayout>;
  }

  return (
    <AppLayout title={template.name}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Navigation & Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Link href="/reporting" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>
            ← Назад к библиотеке
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '32px' }}>{template.defaultFormat === "XLSX" ? "📊" : "📝"}</span>
                <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>{template.name}</h1>
                <span className="badge" style={{ background: "var(--status-healthy)", color: "white" }}>{template.status === 'active' ? 'Активен' : 'Черновик'}</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-tertiary)', fontSize: '13px', fontFamily: 'monospace' }}>
                <span>Код: {template.code}</span>
                <span>Тип: {template.reportType}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary">Настроить шаблон</button>
              <button className="btn btn-primary" style={{ padding: '8px 20px' }}>Сформировать сейчас</button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* Main Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                О шаблоне
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '14px' }}>
                {template.description}
              </p>
              
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                <div>
                  <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>Аудитория</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{template.audience}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>Базовый формат</div>
                  <div className="badge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>{template.defaultFormat}</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Ключевые показатели (KPIs)
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {template.kpis.map((kpi: string, idx: number) => (
                   <span key={idx} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                     {kpi}
                   </span>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Последние сгенерированные экземпляры</span>
                <Link href="#" style={{ fontSize: '13px', color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 'normal' }}>Смотреть все</Link>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {/* Mocked Instances */}
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="badge" style={{ background: 'var(--status-healthy)', color: 'white' }}>Готов</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{template.name} - #{i}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Сегодня, 08:{i}0</span>
                      <Link href={`/reporting/instances/mock-${i}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 12px' }}>
                        Открыть
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Автоматическое формирование
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  ⏰
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Расписание</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{template.schedule}</div>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                Настроить расписание
              </button>
            </div>

            <div className="card" style={{ padding: '24px' }}>
               <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                 Доступные форматы
               </h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                   <input type="checkbox" defaultChecked disabled /> PDF (Для печати)
                 </label>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                   <input type="checkbox" defaultChecked={template.defaultFormat === 'XLSX'} disabled /> Excel (.xlsx)
                 </label>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                   <input type="checkbox" disabled /> CSV (Сырые данные)
                 </label>
               </div>
            </div>
            
            <div className="card" style={{ padding: '24px', background: 'var(--bg-elevated)', borderLeft: '4px solid var(--primary-500)' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-primary)' }}>Связанные уведомления</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                При формировании этого отчёта система может генерировать уведомления в Inbox в случае провала валидации или задержки экспорта.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </AppLayout>
  );
}
