"use client";

interface ExportButtonProps {
  data: Record<string, any>[];
  filename?: string;
  columns?: { key: string; label: string }[];
}

export default function ExportButton({ data, filename = "export", columns }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));

    // BOM for Excel UTF-8 compatibility
    const BOM = "\uFEFF";
    const header = cols.map(c => `"${c.label}"`).join(";");
    const rows = data.map(row =>
      cols.map(c => {
        const val = row[c.key];
        if (val === null || val === undefined) return "";
        if (typeof val === "number") return String(val).replace(".", ",");
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(";")
    );

    const csv = BOM + header + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      className="btn btn-secondary btn-sm"
      onClick={handleExport}
      disabled={!data || data.length === 0}
      title="Экспорт в CSV (Excel)"
    >
      📥 Экспорт
    </button>
  );
}
