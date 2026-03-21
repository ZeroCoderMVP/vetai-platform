import React from 'react';
import { RiskPenaltyRule } from '@/types/scenarioModel';

interface Props {
  rules: RiskPenaltyRule[];
  onChange: (rules: RiskPenaltyRule[]) => void;
}

export default function RiskRulesTab({ rules, onChange }: Props) {
  const handleRuleChange = (index: number, field: keyof RiskPenaltyRule, val: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  const handleToggleEnable = (index: number) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    onChange(updated);
  };

  return (
    <div className="animate-fade-in text-[var(--text-primary)] flex-1 overflow-y-auto">
      <div className="card-header border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <h3 className="card-title text-lg">Риски и штрафы</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Настройка пороговых значений (желтая/красная зоны) и влияние факторов риска на продуктивность и экономику.
          </p>
        </div>
      </div>
      
      <div className="card-body p-0">
        <div className="flex flex-col">
          {rules.map((rule, index) => (
            <div key={rule.code} className="p-6 border-b last:border-b-0" style={{ borderColor: 'var(--border-subtle)', opacity: rule.enabled ? 1 : 0.6 }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-md font-bold text-[var(--text-primary)] flex items-center gap-3">
                    {rule.name}
                    {!rule.enabled && <span className="text-xs font-normal px-2 py-0.5 bg-gray-200 text-gray-600 rounded">Отключено</span>}
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{rule.warningText}</p>
                </div>
                
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={rule.enabled}
                      onChange={() => handleToggleEnable(index)}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${rule.enabled ? 'bg-[var(--primary-500)]' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${rule.enabled ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                   <label className="block text-xs font-semibold tracking-wide text-amber-600 uppercase mb-1">
                     Желтая зона
                   </label>
                   <input 
                     type="number" step="0.1"
                     value={rule.thresholdYellow}
                     onChange={e => handleRuleChange(index, 'thresholdYellow', parseFloat(e.target.value))}
                     disabled={!rule.enabled}
                     className="w-full px-3 py-2 border border-solid rounded-md bg-white text-[var(--text-primary)] outline-none transition-shadow disabled:bg-gray-50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                     style={{ borderColor: 'var(--border-subtle)' }}
                   />
                </div>

                <div className="space-y-2">
                   <label className="block text-xs font-semibold tracking-wide text-red-600 uppercase mb-1">
                     Красная зона
                   </label>
                   <input 
                     type="number" step="0.1"
                     value={rule.thresholdRed}
                     onChange={e => handleRuleChange(index, 'thresholdRed', parseFloat(e.target.value))}
                     disabled={!rule.enabled}
                     className="w-full px-3 py-2 border border-solid rounded-md bg-white text-[var(--text-primary)] outline-none transition-shadow disabled:bg-gray-50 focus:border-red-400 focus:ring-1 focus:ring-red-400"
                     style={{ borderColor: 'var(--border-subtle)' }}
                   />
                </div>

                <div className="space-y-2">
                   <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-1" title="Доля потери молока (0.05 = 5%)">
                     Штраф: Молоко
                   </label>
                   <input 
                     type="number" step="0.01" min="0" max="1"
                     value={rule.milkPenaltyFactor}
                     onChange={e => handleRuleChange(index, 'milkPenaltyFactor', parseFloat(e.target.value))}
                     disabled={!rule.enabled}
                     className="w-full px-3 py-2 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow disabled:bg-gray-50"
                     style={{ borderColor: 'var(--border-subtle)' }}
                   />
                </div>

                <div className="space-y-2">
                   <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-1" title="Потеря маржи IOFC">
                     Штраф: IOFC
                   </label>
                   <input 
                     type="number" step="0.01" min="0" max="1"
                     value={rule.iofcPenaltyFactor}
                     onChange={e => handleRuleChange(index, 'iofcPenaltyFactor', parseFloat(e.target.value))}
                     disabled={!rule.enabled}
                     className="w-full px-3 py-2 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow disabled:bg-gray-50"
                     style={{ borderColor: 'var(--border-subtle)' }}
                   />
                </div>

                <div className="space-y-2">
                   <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-1" title="Абсолютный балл риска (0-100)">
                     +Балл Риска
                   </label>
                   <input 
                     type="number" step="1" min="0" max="100"
                     value={rule.riskScorePenalty}
                     onChange={e => handleRuleChange(index, 'riskScorePenalty', parseInt(e.target.value))}
                     disabled={!rule.enabled}
                     className="w-full px-3 py-2 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow disabled:bg-gray-50"
                     style={{ borderColor: 'var(--border-subtle)' }}
                   />
                </div>
              </div>
            </div>
          ))}
          
          {rules.length === 0 && (
             <div className="p-8 text-center text-[var(--text-secondary)]">
               <p>Нет настроенных правил риска в данном профиле.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
