import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <AppLayout title="Страница не найдена">
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        flex: 1, minHeight: "60vh", padding: "var(--space-8)", textAlign: "center"
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", background: "var(--bg-elevated)",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "var(--space-4)",
          color: "var(--text-tertiary)"
        }}>
          <AlertCircle size={40} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: "var(--space-2)", color: "var(--text-primary)" }}>
          Объект не найден
        </h1>
        <p style={{ color: "var(--text-secondary)", maxWidth: 400, marginBottom: "var(--space-6)" }}>
          Запрашиваемая страница или объект (корова, событие, группа) не существует в базе данных или был удален.
        </p>
        <Link href="/dashboard" className="btn btn-primary">
          Вернуться на Главную
        </Link>
      </div>
    </AppLayout>
  );
}
