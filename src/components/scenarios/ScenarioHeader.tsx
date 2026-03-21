import { Scenario } from "@/types/scenario";
import { ChangeEvent } from "react";
import Link from "next/link";
import ScenarioModelSettingsButton from "./settings/ScenarioModelSettingsButton";

interface ScenarioHeaderProps {
  scenarios: Scenario[];
  selectedId: string;
  onSelect: (id: string) => void;
  onHorizonChange: (horizon: 1 | 3 | 6 | 12) => void;
  horizon: 1 | 3 | 6 | 12;
  onSave: () => void;
  onCreate: () => void;
  isSaving: boolean;
  onOpenSettings?: () => void;
  activeProfileName?: string;
}

export default function ScenarioHeader({
  scenarios,
  selectedId,
  onSelect,
  onHorizonChange,
  horizon,
  onSave,
  onCreate,
  isSaving,
  onOpenSettings,
  activeProfileName
}: ScenarioHeaderProps) {
  const current = scenarios.find((s) => s.id === selectedId);
  const options = [1, 3, 6, 12];

  return (
    <div className="page-header mb-8">
      <div className="page-header-left">
        <h2 className="page-title m-0 flex items-center gap-2">
          🔮 Сценарное управление
        </h2>
        {current && !current.isBaseline && (
          <span className="badge badge-info">
            Изменен: {new Date(current.updatedAt).toLocaleString("ru-RU")}
          </span>
        )}
      </div>

      <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/scenarios/settings" style={{ textDecoration: 'none' }}>
          <ScenarioModelSettingsButton 
            activeProfileName={activeProfileName || "По умолчанию"}
          />
        </Link>

        <select
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: 500,
            outline: 'none',
            minWidth: '220px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.isBaseline ? "(База)" : ""}
            </option>
          ))}
        </select>

        <div style={{ 
          display: 'flex', 
          background: 'var(--bg-elevated)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: 'var(--radius-md)', 
          padding: '4px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)' 
        }}>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => onHorizonChange(opt as any)}
              style={{
                padding: '6px 16px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: horizon === opt ? 'var(--primary-100)' : 'transparent',
                color: horizon === opt ? 'var(--primary-700)' : 'var(--text-secondary)',
                boxShadow: horizon === opt ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              {opt} мес
            </button>
          ))}
        </div>

        <button
          onClick={onCreate}
          className="btn btn-outline"
        >
          + Новый сценарий
        </button>
        <button
          onClick={() => {
            if (current?.isBaseline) {
              onCreate();
            } else {
              onSave();
            }
          }}
          disabled={isSaving}
          className="btn btn-primary"
          style={{ opacity: isSaving ? 0.7 : 1, cursor: 'pointer' }}
        >
          {isSaving ? "Сохранение..." : (current?.isBaseline ? "Сохранить как новый..." : "Сохранить")}
        </button>
      </div>
    </div>
  );
}
