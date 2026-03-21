import React from 'react';
import { LagRule } from '@/types/scenarioModel';

interface Props {
  rules: LagRule;
  onChange: (rules: LagRule) => void;
}

export default function LagsTab({ rules, onChange }: Props) {
  const handleChange = (field: keyof LagRule, val: any) => {
    onChange({ ...rules, [field]: val });
  };

  return (
    <div className="animate-fade-in text-[var(--text-primary)] flex-1 overflow-y-auto">
      <div className="card-header border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <h3 className="card-title text-lg">Лаги и инерция изменения</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Настройка задержек (дней) между изменением рациона и биологическим/экономическим ответом.
          </p>
        </div>
      </div>
      
      <div className="card-body">
        <h4 className="text-md font-bold mb-4">Время реакции (Дни)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">
               Лаг по молоку
             </label>
             <input 
               type="number" step="1" min="0" max="30"
               value={rules.milkLagDays}
               onChange={e => handleChange('milkLagDays', parseInt(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Через сколько дней изменение корма влияет на удой.</p>
          </div>

          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">
               Лаг по остаткам (потребление)
             </label>
             <input 
               type="number" step="1" min="0" max="14"
               value={rules.refusalLagDays}
               onChange={e => handleChange('refusalLagDays', parseInt(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Скорость изменения DMI и остатков на столе.</p>
          </div>

          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">
               Экономический лаг оплаты
             </label>
             <input 
               type="number" step="1" min="0" max="60"
               value={rules.economicsLagDays}
               onChange={e => handleChange('economicsLagDays', parseInt(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Отсрочка платежей/выручки (влияет на cashflow-сценарии).</p>
          </div>
        </div>

        <h4 className="text-md font-bold mb-4 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>Скорость переходных процессов (0.0 — 1.0)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">
               Скорость набора (Transition Speed)
             </label>
             <input 
               type="number" step="0.05" min="0.05" max="1.0"
               value={rules.transitionSpeed}
               onChange={e => handleChange('transitionSpeed', parseFloat(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Крутизна кривой отклика (чем ближе к 1, тем резче реакция).</p>
          </div>

          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">
               Скорость падения (Rollback Speed)
             </label>
             <input 
               type="number" step="0.05" min="0.05" max="1.0"
               value={rules.rollbackSpeed}
               onChange={e => handleChange('rollbackSpeed', parseFloat(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">При ухудшении рациона падение бывает обычно резче (ближе к 1).</p>
          </div>

          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">
               Сглаживание (Smoothing)
             </label>
             <input 
               type="number" step="0.05" min="0" max="0.9"
               value={rules.smoothingFactor}
               onChange={e => handleChange('smoothingFactor', parseFloat(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Фильтр микроскочков для более линейного графика.</p>
          </div>
        </div>

        <div className="card-body border-t mt-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-[var(--bg-hover)] transition-colors">
            <input 
              type="checkbox" 
              checked={rules.cumulativeEffectEnabled}
              onChange={e => handleChange('cumulativeEffectEnabled', e.target.checked)}
              className="w-4 h-4 text-[var(--primary-600)] rounded border-gray-300 focus:ring-[var(--primary-500)]"
            />
            <span className="text-sm text-[var(--text-primary)] font-medium">Кумулятивный эффект (Накопление лагов)</span>
          </label>
          <p className="text-xs text-[var(--text-secondary)] mt-1 ml-7">
            Если включено, длительный дефицит будет каскадно увеличивать срок восстановления до нормы.
          </p>
        </div>
      </div>
    </div>
  );
}
