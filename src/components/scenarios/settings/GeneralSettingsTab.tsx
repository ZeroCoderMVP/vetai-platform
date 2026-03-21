import React from 'react';
import { GeneralModelSettings } from '@/types/scenarioModel';

interface Props {
  settings: GeneralModelSettings;
  onChange: (s: GeneralModelSettings) => void;
}

export default function GeneralSettingsTab({ settings, onChange }: Props) {
  const handleChange = (field: keyof GeneralModelSettings, val: any) => {
    onChange({ ...settings, [field]: val });
  };

  return (
    <div className="animate-fade-in text-[var(--text-primary)] flex-1 overflow-y-auto">
      <div className="card-header border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <h3 className="card-title text-lg">Общие параметры модели</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Эти параметры влияют на общую консервативность и риск-профиль всех сценарных расчётов.
          </p>
        </div>
      </div>
      
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">Горизонт расчета по умолчанию</label>
            <select 
              value={settings.defaultHorizon} 
              onChange={e => handleChange('defaultHorizon', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 border border-solid border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            >
            <option value={1}>1 месяц</option>
            <option value={3}>3 месяца (Квартал)</option>
            <option value={6}>6 месяцев (Полугодие)</option>
            <option value={12}>12 месяцев (Год)</option>
          </select>
        </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold tracking-wide text-gray-600 uppercase mb-2">Масштаб расчёта</label>
            <select 
              value={settings.calculationUnit} 
              onChange={e => handleChange('calculationUnit', e.target.value)}
              className="w-full px-4 py-2.5 border border-solid border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            >
              <option value="head">На 1 фуражную голову (per head)</option>
              <option value="herd">На всё стадо (herd-level)</option>
            </select>
          </div>

          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">Консервативность (0.5 - 2.0)</label>
             <input 
               type="number" step="0.1" min="0.5" max="2.0"
               value={settings.conservatismFactor}
               onChange={e => handleChange('conservatismFactor', parseFloat(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
               title="Множитель, сглаживающий излишне позитивные прогнозы (1.0 = норма)."
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Сглаживает излишне оптимистичные прогнозы. 1.0 = нейтрально.</p>
          </div>

          <div className="space-y-2">
             <label className="block text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase mb-2">Множитель общего риска</label>
             <input 
               type="number" step="0.1" min="0.1" max="5.0"
               value={settings.generalRiskMultiplier}
               onChange={e => handleChange('generalRiskMultiplier', parseFloat(e.target.value))}
               className="w-full px-4 py-2.5 border border-solid rounded-md bg-white text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
               style={{ borderColor: 'var(--border-subtle)' }}
               title="Увеличивает все штрафы в модели."
             />
             <p className="text-xs text-[var(--text-secondary)] mt-1">Коэффициент для всех риск-пенальти (1.0 = стандартный штраф).</p>
          </div>
        </div>
      </div>

      <div className="card-body border-t mt-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <h4 className="text-lg font-bold text-[var(--text-primary)] mb-4">Ограничения модели</h4>
        
        <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-[var(--bg-hover)] transition-colors">
          <input 
            type="checkbox" 
            checked={settings.allowAggressiveScenarios}
            onChange={e => handleChange('allowAggressiveScenarios', e.target.checked)}
            className="w-4 h-4 text-[var(--primary-600)] rounded border-gray-300 focus:ring-[var(--primary-500)]"
          />
          <span className="text-sm text-[var(--text-primary)]">Разрешать агрессивные сценарии (игнорировать предельные точки насыщения)</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-[var(--bg-hover)] transition-colors">
          <input 
            type="checkbox" 
            checked={settings.warnOnBiologicallyDoubtful}
            onChange={e => handleChange('warnOnBiologicallyDoubtful', e.target.checked)}
            className="w-4 h-4 text-[var(--primary-600)] rounded border-gray-300 focus:ring-[var(--primary-500)]"
          />
          <span className="text-sm text-[var(--text-primary)]">Предупреждать о биологически сомнительных сценариях (риски IOFC / ацидоз)</span>
        </label>
      </div>
    </div>
  );
}
