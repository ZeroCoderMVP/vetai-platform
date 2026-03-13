"use client";
import React, { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";

type ReportTemplate = {
  id: string;
  code: string;
  name: string;
  description: string;
  reportType: string;
  authority: string;
  defaultFormat: string;
  version: string;
  isActive: boolean;
};

export default function TemplatesRegistryPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reporting/templates")
      .then((res) => res.json())
      .then((data) => {
        setTemplates(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching templates", err);
        setLoading(false);
      });
  }, []);

  return (
    <AppLayout title="Реестр шаблонов">
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <div className="page-header-left">
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: "var(--space-2)" }}>
            <Link href="/reporting" style={{ color: "var(--brand-primary)", textDecoration: "none" }}>← Отчетность</Link>
          </div>
          <h2 className="page-title">Реестр шаблонов отчетов</h2>
          <p className="page-subtitle">Управление системными и пользовательскими формами отчетности</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary">Создать шаблон</button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Код</th>
              <th>Наименование</th>
              <th>Тип</th>
              <th>Орган</th>
              <th>Версия</th>
              <th>Статус</th>
              <th>Формат</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "var(--space-4)" }}>Загрузка шаблонов...</td></tr>
            ) : templates.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "var(--space-4)" }}>Нет доступных шаблонов</td></tr>
            ) : (
              templates.map((tpl) => (
                <tr key={tpl.id}>
                  <td style={{ fontWeight: 500 }}>{tpl.code}</td>
                  <td>{tpl.name}</td>
                  <td>{tpl.reportType}</td>
                  <td>{tpl.authority}</td>
                  <td>v{tpl.version}</td>
                  <td>
                    <span className="badge" style={{ background: tpl.isActive ? "rgba(34, 197, 94, 0.1)" : "rgba(107, 114, 128, 0.1)", color: tpl.isActive ? "#22c55e" : "#6b7280" }}>
                      {tpl.isActive ? "Активен" : "Отключен"}
                    </span>
                  </td>
                  <td>{tpl.defaultFormat}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
