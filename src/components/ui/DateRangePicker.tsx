"use client";

import { useState, useRef, useEffect } from "react";

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

const PRESETS = [
  { label: "Сегодня", days: 0 },
  { label: "7 дней", days: 7 },
  { label: "14 дней", days: 14 },
  { label: "30 дней", days: 30 },
  { label: "90 дней", days: 90 },
];

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatDate(d);
}

export default function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activePreset = PRESETS.find(p => {
    if (p.days === 0) return from === to && from === formatDate(new Date());
    return from === getDaysAgo(p.days) && to === formatDate(new Date());
  });

  return (
    <div className="date-range-picker" ref={ref}>
      <button
        className="date-range-trigger"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="date-range-icon">📅</span>
        <span className="date-range-label">
          {activePreset ? activePreset.label : `${from} — ${to}`}
        </span>
        <span className="date-range-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="date-range-dropdown">
          <div className="date-range-presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.days}
                className={`date-range-preset ${activePreset?.days === preset.days ? "active" : ""}`}
                onClick={() => {
                  const newTo = formatDate(new Date());
                  const newFrom = preset.days === 0 ? newTo : getDaysAgo(preset.days);
                  onChange(newFrom, newTo);
                  setOpen(false);
                }}
                type="button"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="date-range-separator" />
          <div className="date-range-custom">
            <div className="date-range-field">
              <label>От</label>
              <input
                type="date"
                value={from}
                onChange={(e) => onChange(e.target.value, to)}
              />
            </div>
            <div className="date-range-field">
              <label>До</label>
              <input
                type="date"
                value={to}
                max={formatDate(new Date())}
                onChange={(e) => onChange(from, e.target.value)}
              />
            </div>
          </div>
          <button
            className="date-range-apply"
            onClick={() => setOpen(false)}
            type="button"
          >
            Применить
          </button>
        </div>
      )}
    </div>
  );
}
