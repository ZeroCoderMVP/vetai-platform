import React from 'react';
import { EconomicsRule } from '@/types/scenarioModel';

interface Props {
  settings: EconomicsRule;
  onChange: (s: EconomicsRule) => void;
}

export default function EconomicsTab({ settings, onChange }: Props) {
  const handleChange = (field: keyof EconomicsRule, val: any) => {
    onChange({ ...settings, [field]: val });
  };

  return (
    <div className="animate-fade-in text-[var(--text-primary)] flex-1 overflow-y-auto">
      <div className="card-header border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <h3 className="card-title text-lg">Экономические правила</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Параметры, управляющие финансовым блоком сценарного движка и расчетом IOFC.
          </p>
        </div>
      </div>

      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">Базовая цена молока (₽/кг)</label>
            <input 
              type="number" step="0.5"
              value={settings.milkPrice}
              onChange={e => handleChange('milkPrice', parseFloat(e.target.value))}
              className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">Множитель стоимости остатков</label>
            <input 
              type="number" step="0.1"
              value={settings.feedWasteCostFactor}
              onChange={e => handleChange('feedWasteCostFactor', parseFloat(e.target.value))}
              className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">Коэффициент потерь (1.0 = остатки стоят столько же, сколько съеденный корм).</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">Штраф за перекорм (₽/голова)</label>
            <input 
              type="number" step="0.5"
              value={settings.overfeedingPenaltyCost}
              onChange={e => handleChange('overfeedingPenaltyCost', parseFloat(e.target.value))}
              className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">Дополнительные ветеринарные издержки при ожирении.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">Маржинальный фактор IOFC</label>
            <input 
              type="number" step="0.1"
              value={settings.marginalIofcFactor}
              onChange={e => handleChange('marginalIofcFactor', parseFloat(e.target.value))}
              className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
