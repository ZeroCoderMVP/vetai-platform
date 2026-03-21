import React from 'react';
import { GroupProfileRule, GroupType } from '@/types/scenarioModel';

interface Props {
  rules: GroupProfileRule[];
  onChange: (rules: GroupProfileRule[]) => void;
}

const groupTypeNames: Record<GroupType, string> = {
  fresh: 'Новотельные (Fresh)',
  high: 'Высокопродуктивные (High)',
  mid: 'Средняя продуктивность (Mid)',
  late: 'Поздняя лактация (Late)',
  dry: 'Сухостойные (Dry)',
  transition: 'Транзитные (Transition)',
  custom: 'Пользовательская (Custom)'
};

export default function GroupProfilesTab({ rules, onChange }: Props) {
  const handleRuleChange = (index: number, field: keyof GroupProfileRule, val: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  return (
    <div className="animate-fade-in text-[var(--text-primary)] flex-1 overflow-y-auto">
      <div className="card-header border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <h3 className="card-title text-lg">Профили групп и стадий</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Настройка чувствительности разных физиологических групп к кормлению, плотности посадки и стрессам.
          </p>
        </div>
      </div>
      
      <div className="card-body p-0">
        <div className="flex flex-col">
          {rules.map((rule, index) => (
            <div key={rule.groupType} className="p-6 border-b last:border-b-0" style={{ borderColor: 'var(--border-subtle)' }}>
              <h4 className="text-md font-bold text-[var(--primary-700)] mb-4">{groupTypeNames[rule.groupType]}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <div className="space-y-2">
                   <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2" title="Чувствительность к энергии (0.1 - 2.0)">
                     Отклик на Энергию
                   </label>
                   <input 
                     type="number" step="0.1" min="0.1" max="2.0"
                     value={rule.milkSensitivityEnergy}
                     onChange={e => handleRuleChange(index, 'milkSensitivityEnergy', parseFloat(e.target.value))}
                     className="w-full px-3 py-2 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                     style={{ borderColor: 'var(--border-subtle)' }}
                   />
                </div>

                <div className="space-y-2">
                   <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2" title="Чувствительность к протеину (0.1 - 2.0)">
                     Отклик на Протеин
                   </label>
                   <input 
                     type="number" step="0.1" min="0.1" max="2.0"
                     value={rule.milkSensitivityProtein}
                     onChange={e => handleRuleChange(index, 'milkSensitivityProtein', parseFloat(e.target.value))}
                     className="w-full px-3 py-2 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                     style={{ borderColor: 'var(--border-subtle)' }}
                   />
                </div>

                <div className="space-y-2">
                   <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2" title="Чувствительность к клетчатке (0.1 - 2.0)">
                     Отклик на Клетчатку
                   </label>
                   <input 
                     type="number" step="0.1" min="0.1" max="2.0"
                     value={rule.milkSensitivityFiber}
                     onChange={e => handleRuleChange(index, 'milkSensitivityFiber', parseFloat(e.target.value))}
                     className="w-full px-3 py-2 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                     style={{ borderColor: 'var(--border-subtle)' }}
                   />
                </div>

                <div className="space-y-2">
                   <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2" title="Потолок потребления (множитель к базе)">
                     Лимит потребления (x)
                   </label>
                   <input 
                     type="number" step="0.1" min="0.5" max="2.0"
                     value={rule.intakeCeilingFactor}
                     onChange={e => handleRuleChange(index, 'intakeCeilingFactor', parseFloat(e.target.value))}
                     className="w-full px-3 py-2 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                     style={{ borderColor: 'var(--border-subtle)' }}
                   />
                </div>

                <div className="space-y-2">
                   <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2" title="Толерантность к высоким остаткам">
                     Терпимость к остаткам
                   </label>
                   <input 
                     type="number" step="0.1" min="0.1" max="2.0"
                     value={rule.refusalTolerance}
                     onChange={e => handleRuleChange(index, 'refusalTolerance', parseFloat(e.target.value))}
                     className="w-full px-3 py-2 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                     style={{ borderColor: 'var(--border-subtle)' }}
                   />
                </div>

                <div className="space-y-2">
                   <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2" title="Уязвимость к переуплотнению (0.0 = нет, 2.0 = высокая)">
                     Реакция на тесноту
                   </label>
                   <input 
                     type="number" step="0.1" min="0.0" max="3.0"
                     value={rule.stockingDensitySensitivity}
                     onChange={e => handleRuleChange(index, 'stockingDensitySensitivity', parseFloat(e.target.value))}
                     className="w-full px-3 py-2 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                     style={{ borderColor: 'var(--border-subtle)' }}
                   />
                </div>

                <div className="space-y-2">
                   <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2" title="Уязвимость к нарушению режима">
                     Реакция на режим
                   </label>
                   <input 
                     type="number" step="0.1" min="0.0" max="3.0"
                     value={rule.regimeDisruptionSensitivity}
                     onChange={e => handleRuleChange(index, 'regimeDisruptionSensitivity', parseFloat(e.target.value))}
                     className="w-full px-3 py-2 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                     style={{ borderColor: 'var(--border-subtle)' }}
                   />
                </div>

                <div className="space-y-2">
                   <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2" title="Степень инерции изменений (1.0 = нормальная)">
                     Скорость адаптации (Лаг)
                   </label>
                   <input 
                     type="number" step="0.1" min="0.1" max="5.0"
                     value={rule.lagSensitivity}
                     onChange={e => handleRuleChange(index, 'lagSensitivity', parseFloat(e.target.value))}
                     className="w-full px-3 py-2 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                     style={{ borderColor: 'var(--border-subtle)' }}
                   />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
