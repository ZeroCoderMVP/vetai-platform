"use client";
import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function OperationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [operation, setOperation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/operations/${resolvedParams.id}`);
        if (!res.ok) throw new Error("Operation not found");
        setOperation(await res.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.id]);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/operations/${resolvedParams.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) { console.error(e); }
  };

  const handleConfirm = async () => {
    try {
      const res = await fetch(`/api/operations/${resolvedParams.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          confirmedAt: new Date().toISOString(),
          note: "Подтверждено через VETAI интерфейс"
        })
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) { console.error(e); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    // Mocked for MVP, normally hits /comments api
    alert("Добавление комментария: " + commentText);
    setCommentText("");
  };

  if (loading) return <AppLayout title="Загрузка..."><div className="p-4">Загрузка карточки операции...</div></AppLayout>;
  if (error || !operation) return <AppLayout title="Ошибка"><div className="p-4 text-red-500">{error}</div></AppLayout>;

  return (
    <AppLayout title={`Операция AfiMilk: ${operation.title}`}>
      <div className="page-header items-start">
        <div className="page-header-left">
          <Link href="/operations" className="text-brand-primary no-underline flex items-center gap-1 text-sm mb-2 hover:opacity-80">
            <span>←</span> Вернуться к очереди
          </Link>
          <div className="flex gap-3 items-center">
            <h2 className="page-title m-0">{operation.title}</h2>
            <span className={`px-2 py-1 rounded-full text-xs font-bold`} style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}>
              {operation.status}
            </span>
          </div>
          <p className="page-subtitle mt-2">
            Корова: <span className="font-bold text-blue-500">{operation.cow?.number || '?'}</span> <span className="mx-2 opacity-50">|</span> 
            Тип: <b>{operation.operationType}</b> <span className="mx-2 opacity-50">|</span> 
            Создана: {format(new Date(operation.createdAt), 'dd MMM yyyy, HH:mm', { locale: ru })}
          </p>
        </div>

        <div className="page-header-actions mt-6">
          {["CREATED", "PENDING_AFIMILK_ENTRY"].includes(operation.status) && (
            <button className="btn btn-outline" onClick={() => handleUpdateStatus("IN_PROGRESS")}>
              Взять в работу
            </button>
          )}
          {operation.status === "IN_PROGRESS" && (
            <button className="btn btn-primary" onClick={handleConfirm}>
              Отметить как внесено в AfiMilk
            </button>
          )}
          {operation.status === "ENTERED_IN_AFIMILK" && (
            <button className="btn btn-primary bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700" onClick={() => handleUpdateStatus("VERIFIED")}>
              Подтвердить (Верификация)
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex flex-col gap-6">
          <div className="card">
            <div className="card-header"><span className="card-title">Детали операции</span></div>
            <div className="card-body text-sm space-y-4">
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Описание:</span>
                <p className="whitespace-pre-wrap">{operation.description || "Нет описания."}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Дата события:</span>
                  <b>{format(new Date(operation.eventDate), 'dd MMMM yyyy, HH:mm', { locale: ru })}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Дедлайн внесения:</span>
                  <b className={(operation.dueDate && new Date(operation.dueDate) < new Date() && operation.status !== 'VERIFIED') ? 'text-red-500' : ''}>
                    {operation.dueDate ? format(new Date(operation.dueDate), 'dd MMMM yyyy, HH:mm', { locale: ru }) : "-"}
                  </b>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Комментарии</span></div>
            <div className="card-body space-y-4">
              {operation.comments?.length > 0 ? (
                operation.comments.map((c: any) => (
                  <div key={c.id} className="pb-3 last:border-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-bold text-white">{c.authorId}</span>
                      <span>{format(new Date(c.createdAt), 'dd MMM yyyy HH:mm', { locale: ru })}</span>
                    </div>
                    <p className="text-sm">{c.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Пока нет комментариев...</div>
              )}

              <form onSubmit={handleAddComment} className="mt-4 pt-4 flex gap-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <input 
                  type="text" 
                  className="form-input flex-1" 
                  placeholder="Оставьте комментарий..." 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)} 
                />
                <button type="submit" className="btn btn-outline border-gray-300">Отправить</button>
              </form>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card">
            <div className="card-header"><span className="card-title">История статусов</span></div>
            <div className="card-body text-sm p-4 relative">
              <div className="absolute h-full top-4 left-6 z-0" style={{ borderLeft: '2px solid var(--border-subtle)' }}></div>
              {operation.statusHistory?.map((hist: any, i: number) => (
                <div key={hist.id} className="flex gap-3 mb-4 relative z-10">
                  <div className="w-3 h-3 rounded-full mt-1 shrink-0 border-2 shadow-sm" style={{ background: 'var(--primary-400)', borderColor: 'var(--bg-surface)' }}></div>
                  <div>
                    <div className="font-bold">{hist.newStatus}</div>
                    <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{format(new Date(hist.createdAt), 'dd MMM HH:mm')} • {hist.changedById}</div>
                    <div style={{ color: 'var(--text-tertiary)' }}>{hist.changeReason || "Статус изменен"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {operation.confirmations?.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--success)' }}>
              <div className="card-header" style={{ background: 'rgba(34, 197, 94, 0.1)' }}><span className="card-title text-green-500">Подтверждение AfiMilk</span></div>
              <div className="card-body text-sm space-y-2">
                {operation.confirmations.map((conf: any) => (
                  <div key={conf.id}>
                    <div><span className="opacity-70">Метод:</span> {conf.confirmationMethod}</div>
                    <div><span className="opacity-70">Дата внесения:</span> {conf.afiEntryDate ? format(new Date(conf.afiEntryDate), 'dd MMM yyyy, HH:mm') : "н/д"}</div>
                    {conf.note && <div><span className="opacity-70">Заметка:</span> {conf.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
