import React, { useState } from 'react';
import { IngredientResponseRule } from '@/types/scenarioModel';
import CurveEditor from './CurveEditor';

interface Props {
  rules: IngredientResponseRule[];
  onChange: (rules: IngredientResponseRule[]) => void;
}

export default function IngredientCurvesTab({ rules, onChange }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(rules.length > 0 ? 0 : null);

  const handleUpdate = (idx: number, field: keyof IngredientResponseRule, val: any) => {
    const updated = [...rules];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange(updated);
  };

  return (
    <div className="animate-fade-in text-[var(--text-primary)] flex-1 overflow-y-auto flex flex-col h-full">
      <div className="card-header border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <h3 className="card-title text-lg">Кривые отклика сырья</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Настройте влияние каждого типа концентрированных кормов и добавок на ожидаемый надой.
            Укажите точки насыщения для расчёта убывающей отдачи и штрафов за перекорм.
          </p>
        </div>
      </div>

      <div className="card-body flex-1 min-h-0" style={{ display: 'flex', gap: '32px' }}>
        {/* Left list */}
        <div className="shrink-0 border border-solid rounded-xl overflow-hidden shadow-sm flex flex-col" style={{ width: '340px', borderColor: 'var(--border-subtle)', backgroundColor: 'white' }}>
          <div className="overflow-y-auto flex-1">
            {rules.map((rule, idx) => (
              <div 
                key={rule.ingredientCode} 
                onClick={() => setSelectedIdx(idx)}
                className={`p-5 border-b border-solid cursor-pointer transition-all ${selectedIdx === idx ? 'border-l-4 border-l-solid border-l-primary-500' : 'hover:bg-gray-50 border-l-4 border-l-solid border-l-transparent'}`}
                style={{ 
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: selectedIdx === idx ? 'var(--primary-50)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={rule.enabled} 
                    onChange={e => {
                       e.stopPropagation();
                       handleUpdate(idx, 'enabled', e.target.checked);
                    }}
                    className="w-5 h-5 cursor-pointer text-blue-600 focus:ring-blue-500 border border-solid border-gray-300 rounded"
                  />
                  <span className="font-bold text-base" style={{ color: selectedIdx === idx ? 'var(--primary-700)' : 'var(--text-primary)' }}>
                    {rule.ingredientName}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '32px' }}>
                  <span className="font-medium px-2 py-0.5 rounded text-xs" style={{ color: '#1e40af', backgroundColor: '#dbeafe' }}>
                    +{rule.maxMilkDelta} кг
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {rule.ingredientType}
                  </span>
                </div>
            </div>
          ))}
          </div>
        </div>

        {/* Right Editor */}
        <div className="flex-1 border border-solid rounded-xl p-8 bg-white shadow-sm" style={{ borderColor: 'var(--border-subtle)' }}>
          {selectedIdx !== null && rules[selectedIdx] ? (
            <div className="flex flex-col h-full border border-solid rounded-xl relative overflow-hidden" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'white' }}>
              <div className="p-6 border-b border-solid" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}>
                <h4 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{rules[selectedIdx].ingredientName}</h4>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Детальная настройка математики отдачи {rules[selectedIdx].ingredientType.toLowerCase()}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6 p-6 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Режим расчета</label>
                  <select 
                    value={rules[selectedIdx].mode}
                    onChange={e => handleUpdate(selectedIdx, 'mode', e.target.value)}
                    className="w-full px-4 py-2.5 border border-solid rounded-md text-sm outline-none transition-shadow"
                    style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  >
                    <option value="parametric">Параметрический (Точки перегиба)</option>
                    <option value="points">Ручные точки (Кривая)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Макс. прибавка (кг)</label>
                  <input 
                    type="number" step="0.1"
                    value={rules[selectedIdx].maxMilkDelta}
                    onChange={e => handleUpdate(selectedIdx, 'maxMilkDelta', parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 border border-solid rounded-md text-sm outline-none transition-shadow"
                    style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Начало насыщения ({rules[selectedIdx].xUnit})</label>
                  <input 
                    type="number" step="0.5"
                    value={rules[selectedIdx].saturationStart}
                    onChange={e => handleUpdate(selectedIdx, 'saturationStart', parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 border border-solid rounded-md text-sm outline-none transition-shadow"
                    style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                   <label className="block text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Убывающая отдача</label>
                   <input 
                     type="number" step="0.1"
                     value={rules[selectedIdx].diminishingReturnFactor}
                     onChange={e => handleUpdate(selectedIdx, 'diminishingReturnFactor', parseFloat(e.target.value))}
                     className="w-full px-4 py-2.5 border border-solid rounded-md text-sm outline-none transition-shadow"
                     style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                   />
                </div>
                <div>
                   <label className="block text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Штраф за избыток</label>
                   <input 
                     type="number" step="0.1"
                     value={rules[selectedIdx].excessPenaltyFactor}
                     onChange={e => handleUpdate(selectedIdx, 'excessPenaltyFactor', parseFloat(e.target.value))}
                     className="w-full px-4 py-2.5 border border-solid rounded-md text-sm outline-none transition-shadow"
                     style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                   />
                </div>
              </div>

              {/* Curve Editor / Chart */}
              <div className="h-[300px] w-full mt-auto border-t border-solid" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                <div className="pt-6 pr-6 h-full bg-white ml-6">
                  <CurveEditor rule={rules[selectedIdx]} />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] text-sm gap-2">
              <span className="text-4xl text-gray-300">⚙️</span>
              Выберите ингредиент слева для детальной настройки
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
