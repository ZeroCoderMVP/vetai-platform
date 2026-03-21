import React from 'react';
import { FeedUtilizationRule } from '@/types/scenarioModel';

interface Props {
  rules: FeedUtilizationRule;
  onChange: (rules: FeedUtilizationRule) => void;
}

export default function FeedUtilizationTab({ rules, onChange }: Props) {
  const handleChange = (field: keyof FeedUtilizationRule, val: number) => {
    onChange({ ...rules, [field]: val });
  };

  return (
    <div className="animate-fade-in text-[var(--text-primary)] flex-1 overflow-y-auto">
      <div className="card-header border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <h3 className="card-title text-lg">Переход в остатки и параметры потребления</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Настройка кривой физиологического потребления (DMI) и формирования несъеденных остатков (refusals).
          </p>
        </div>
      </div>
      
      <div className="card-body">
        {/* Базовая потребность и лимиты */}
        <h4 className="text-md font-bold mb-4">Физиологические лимиты потребления</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2" title="Базовая потребность в СВ (кг/голову) для поддержания жизни">
               Базовая потребность DMI (baselineNeed)
             </label>
             <input 
               type="number" step="0.1" min="10" max="30"
               value={rules.baselineNeed}
               onChange={e => handleChange('baselineNeed', parseFloat(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Кг сухого вещества в день на голову (maintenance).</p>
          </div>

          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">
               Абсолютный предел DMI (physiologicalIntakeLimit)
             </label>
             <input 
               type="number" step="0.1" min="20" max="40"
               value={rules.physiologicalIntakeLimit}
               onChange={e => handleChange('physiologicalIntakeLimit', parseFloat(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Максимально возможное потребление килограмм СВ.</p>
          </div>

          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">
               Точка замедления потребления
             </label>
             <input 
               type="number" step="0.1" min="0.1" max="1.0"
               value={rules.intakeSlowdownPoint}
               onChange={e => handleChange('intakeSlowdownPoint', parseFloat(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Доля от предела (например 0.8), где рост потребления замедляется.</p>
          </div>

          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">
               Точка формирования плато
             </label>
             <input 
               type="number" step="0.1" min="0.5" max="1.0"
               value={rules.intakePlateauPoint}
               onChange={e => handleChange('intakePlateauPoint', parseFloat(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Доля от предела (например 0.95), когда дополнительный корм почти весь идет в остатки.</p>
          </div>
        </div>

        {/* Остатки */}
        <h4 className="text-md font-bold mb-4 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>Остатки на кормовом столе (Refusals)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">
               Целевой % остатков (Мин)
             </label>
             <input 
               type="number" step="0.1" min="0" max="10"
               value={rules.targetRefusalMin}
               onChange={e => handleChange('targetRefusalMin', parseFloat(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Обычно 3% (0.03). Меньше — риск голодания коров.</p>
          </div>

          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">
               Целевой % остатков (Макс)
             </label>
             <input 
               type="number" step="0.1" min="1" max="15"
               value={rules.targetRefusalMax}
               onChange={e => handleChange('targetRefusalMax', parseFloat(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Обычно 5% (0.05). Больше — неоправданные экономические потери.</p>
          </div>

          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">
               Фактор конверсии излишком в потребление
             </label>
             <input 
               type="number" step="0.1" min="0" max="1.0"
               value={rules.extraFeedToIntakeFactor}
               onChange={e => handleChange('extraFeedToIntakeFactor', parseFloat(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Какая доля экстра-корма будет съедена при его раздаче (0.2 = 20%).</p>
          </div>

          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">
               Фактор конверсии излишков в остатки
             </label>
             <input 
               type="number" step="0.1" min="0" max="1.0"
               value={rules.extraFeedToRefusalFactor}
               onChange={e => handleChange('extraFeedToRefusalFactor', parseFloat(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Доля экстра-корма, сразу превращающаяся в отходы (0.8 = 80%).</p>
          </div>
        </div>

        {/* Штрафы за перерасход */}
        <h4 className="text-md font-bold mb-4 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>Штрафы за перерасход</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">
               Мультипликатор роста отходов (wasteGrowthFactor)
             </label>
             <input 
               type="number" step="0.1" min="1.0" max="3.0"
               value={rules.wasteGrowthFactor}
               onChange={e => handleChange('wasteGrowthFactor', parseFloat(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Нелинейный рост остатков при значительном перекорме (&gt;1.0).</p>
          </div>

          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">
               Падение эффективности (efficiencyDropFactor)
             </label>
             <input 
               type="number" step="0.01" min="0" max="0.5"
               value={rules.efficiencyDropFactor}
               onChange={e => handleChange('efficiencyDropFactor', parseFloat(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Снижение эффективности пищеварения / конверсии при перекорме.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
