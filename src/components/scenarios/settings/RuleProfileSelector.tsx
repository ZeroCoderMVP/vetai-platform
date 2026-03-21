import React from 'react';
import { ScenarioModelProfile } from '@/types/scenarioModel';

interface Props {
  profiles: ScenarioModelProfile[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  onDelete?: (id: string) => void;
}

export default function RuleProfileSelector({ profiles, activeId, onSelect, onCreateNew, onDelete }: Props) {
  return (
    <div className="flex items-center justify-between py-4 px-6 mb-6 rounded-lg bg-[var(--bg-elevated)] border" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="flex items-center gap-6">
        <div>
          <label className="text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase block mb-1.5 ml-1">Активный профиль правил:</label>
          <select 
            value={activeId} 
            onChange={(e) => onSelect(e.target.value)}
            className="px-4 py-2 font-medium border border-solid rounded-md text-sm bg-white outline-none transition-shadow focus:ring-2 focus:ring-primary-500"
            style={{ borderColor: 'var(--border-subtle)', minWidth: '320px', color: 'var(--text-primary)' }}
          >
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name} {p.isDefault ? '(Стандартный)' : ''}</option>
            ))}
          </select>
        </div>
        {profiles.find(p => p.id === activeId)?.isDefault && (
          <div className="mt-5 text-xs font-medium px-3 py-1.5 bg-amber-500/10 text-amber-500 border rounded-full flex items-center gap-1.5" style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}>
            <span className="text-amber-500 text-sm">ⓘ</span>
            Используются типовые коэффициенты
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-5">
        {activeId !== 'default-profile-v1' && onDelete && (
          <button onClick={() => onDelete(activeId)} className="btn bg-white border border-solid border-gray-300 hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors text-sm py-2 px-4 shadow-sm cursor-pointer">
            Удалить настройки
          </button>
        )}
        <button onClick={onCreateNew} className="btn bg-[var(--primary-600)] hover:bg-[var(--primary-500)] text-white transition-colors text-sm py-2 px-4 shadow-sm border-none cursor-pointer">
          + Сохранить как новый
        </button>
      </div>
    </div>
  );
}
