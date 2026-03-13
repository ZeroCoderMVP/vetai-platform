"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  type: "cow" | "page" | "action";
  label: string;
  description?: string;
  href: string;
  icon: string;
}

const PAGES: SearchResult[] = [
  { type: "page", label: "Дашборд", href: "/dashboard", icon: "🏠", description: "Главная сводка" },
  { type: "page", label: "Стадо", href: "/herd", icon: "🐄", description: "Управление стадом" },
  { type: "page", label: "Учёт молока", href: "/milking", icon: "🥛", description: "Данные доений" },
  { type: "page", label: "Кормление", href: "/feeding", icon: "🌾", description: "DTM кормление" },
  { type: "page", label: "Здоровье", href: "/health", icon: "💊", description: "Тревоги здоровья" },
  { type: "page", label: "Воспроизводство", href: "/reproduction", icon: "🧬", description: "Охота, осеменение" },
  { type: "page", label: "События", href: "/events", icon: "🔔", description: "Лента событий" },
  { type: "page", label: "Администрирование", href: "/admin", icon: "⚙️", description: "Настройки" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [cowNumbers, setCowNumbers] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load cow numbers once
  useEffect(() => {
    fetch("/api/farm")
      .then(r => r.json())
      .then(d => {
        if (d.allCowNumbers) setCowNumbers(d.allCowNumbers);
      })
      .catch(() => {});
  }, []);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelected(0);
    }
  }, [open]);

  // Search
  useEffect(() => {
    if (!query.trim()) {
      setResults(PAGES);
      setSelected(0);
      return;
    }

    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    // Search pages
    for (const p of PAGES) {
      if (p.label.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q)) {
        matches.push(p);
      }
    }

    // Search cows
    const cowMatches = cowNumbers.filter(n => n.includes(q)).slice(0, 8);
    for (const cow of cowMatches) {
      matches.push({
        type: "cow",
        label: `Корова #${cow}`,
        description: "Карточка коровы",
        href: `/herd/${cow}`,
        icon: "🐄",
      });
    }

    setResults(matches);
    setSelected(0);
  }, [query, cowNumbers]);

  const navigate = useCallback((result: SearchResult) => {
    setOpen(false);
    router.push(result.href);
  }, [router]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      navigate(results[selected]);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        }}
      />
      {/* Modal */}
      <div style={{
        position: "fixed", top: "15%", left: "50%", transform: "translateX(-50%)",
        width: "min(560px, 90vw)", zIndex: 9999,
        background: "var(--bg-surface)", borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border-primary)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        overflow: "hidden",
      }}>
        {/* Search input */}
        <div style={{
          display: "flex", alignItems: "center", gap: "var(--space-3)",
          padding: "var(--space-3) var(--space-4)",
          borderBottom: "1px solid var(--border-secondary)",
          background: "var(--bg-surface)",
        }}>
          <span style={{ fontSize: 18, opacity: 0.5 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Поиск коров, страниц, действий..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontSize: 15, color: "var(--text-primary)", padding: "var(--space-2) 0",
            }}
          />
          <kbd style={{
            fontSize: 10, padding: "2px 6px", borderRadius: 4,
            background: "var(--bg-elevated)", color: "var(--text-tertiary)",
            border: "1px solid var(--border-secondary)",
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: "auto", padding: "var(--space-2)" }}>
          {results.length === 0 ? (
            <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
              Ничего не найдено
            </div>
          ) : (
            results.map((r, i) => (
              <div
                key={`${r.type}-${r.href}`}
                onClick={() => navigate(r)}
                style={{
                  display: "flex", alignItems: "center", gap: "var(--space-3)",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-md)", cursor: "pointer",
                  background: i === selected ? "var(--bg-elevated)" : "transparent",
                  transition: "background 0.1s",
                }}
                onMouseEnter={() => setSelected(i)}
              >
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{r.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{r.label}</div>
                  {r.description && (
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{r.description}</div>
                  )}
                </div>
                <span style={{
                  fontSize: 9, padding: "1px 6px", borderRadius: 4,
                  background: r.type === "cow" ? "rgba(15,168,122,0.12)" : r.type === "page" ? "rgba(139,92,246,0.12)" : "rgba(249,115,22,0.12)",
                  color: r.type === "cow" ? "var(--primary-400)" : r.type === "page" ? "var(--primary-400)" : "var(--accent-orange)",
                  fontWeight: 600, textTransform: "uppercase",
                }}>
                  {r.type === "cow" ? "корова" : r.type === "page" ? "страница" : "действие"}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "var(--space-2) var(--space-4)",
          borderTop: "1px solid var(--border-secondary)",
          display: "flex", gap: "var(--space-4)",
          fontSize: 10, color: "var(--text-muted)",
        }}>
          <span>↑↓ навигация</span>
          <span>↵ выбрать</span>
          <span>esc закрыть</span>
        </div>
      </div>
    </>
  );
}
