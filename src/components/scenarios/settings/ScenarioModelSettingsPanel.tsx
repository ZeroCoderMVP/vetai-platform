import React, { useState } from 'react';
import { ScenarioModelProfile } from '@/types/scenarioModel';
import RuleProfileSelector from './RuleProfileSelector';
import GeneralSettingsTab from './GeneralSettingsTab';
import IngredientCurvesTab from './IngredientCurvesTab';
import EconomicsTab from './EconomicsTab';
import FeedUtilizationTab from './FeedUtilizationTab';
import GroupProfilesTab from './GroupProfilesTab';
import RiskRulesTab from './RiskRulesTab';
import LagsTab from './LagsTab';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profiles: ScenarioModelProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onSaveProfile: (profile: ScenarioModelProfile) => void;
  onDeleteProfile: (id: string) => void;
}

export default function ScenarioModelSettingsPanel({ 
  isOpen, onClose, profiles, activeProfileId, onSelectProfile, onSaveProfile, onDeleteProfile 
}: Props) {
  
  const [activeTab, setActiveTab] = useState<'general' | 'ingredients' | 'feed' | 'groups' | 'risk' | 'lags' | 'economics'>('general');
  // Local state for edits before save
  const currentProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
  const [workingConfig, setWorkingConfig] = useState(currentProfile?.config);

  // Sync working config when profile changes
  React.useEffect(() => {
    if (currentProfile) {
      setWorkingConfig(currentProfile.config);
    }
  }, [currentProfile]);

  if (!isOpen || !workingConfig) return null;

  const handleCreateNew = () => {
    const name = prompt("Введите имя нового профиля правил:", `${currentProfile.name} (Копия)`);
    if (!name) return;
    const newProfile: ScenarioModelProfile = {
      ...currentProfile,
      id: `profile-${Date.now()}`,
      name,
      isDefault: false,
      isActive: true,
      config: workingConfig,
      createdAt: new Date().toISOString()
    };
    onSaveProfile(newProfile);
    onSelectProfile(newProfile.id);
  };

  const handleSaveCurrent = () => {
    if (currentProfile.isDefault) {
      alert("Нельзя изменить стандартный профиль. Нажмите '+ Сохранить как новый' чтобы создать собственную настройку.");
      return;
    }
    const updated = { ...currentProfile, config: workingConfig };
    onSaveProfile(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div 
        className="w-full max-w-[1200px] bg-white h-full shadow-2xl flex flex-col transform transition-transform"
        style={{ animation: 'slideInRight 0.3s ease-out' }}
      >
        <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="text-3xl">⚙️</span>
              Настройки параметрической модели
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Детерминированная система правил для сценарного прогнозирования</p>
          </div>
          <button onClick={onClose} className="text-3xl font-light text-gray-400 hover:text-gray-800 transition-colors">&times;</button>
        </div>

        <RuleProfileSelector 
          profiles={profiles}
          activeId={activeProfileId}
          onSelect={onSelectProfile}
          onCreateNew={handleCreateNew}
          onDelete={onDeleteProfile}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Vertical Tabs sidebar */}
          <div className="w-64 border-r overflow-y-auto" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}>
            <ul className="py-2">
              {[
                { id: 'general', label: 'Общие параметры', icon: '⚙️' },
                { id: 'ingredients', label: 'Кривые отклика сырья', icon: '🌽' },
                // Skipping some tabs for brevity/MVP
                { id: 'feed', label: 'Переход в остатки', icon: '📉' },
                { id: 'groups', label: 'Группы и стадии', icon: '🐄' },
                { id: 'risk', label: 'Риски и штрафы', icon: '⚠️' },
                { id: 'lags', label: 'Лаги и инерция', icon: '⏳' },
                { id: 'economics', label: 'Экономика', icon: '💰' },
              ].map(t => (
                <li key={t.id}>
                  <button 
                    onClick={() => setActiveTab(t.id as any)}
                    className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors flex items-center gap-3
                      ${activeTab === t.id ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span>{t.icon}</span>
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto bg-[var(--bg-surface)] relative">
            {activeTab === 'general' && (
              <GeneralSettingsTab 
                settings={workingConfig.general} 
                onChange={(general) => setWorkingConfig({ ...workingConfig, general })} 
              />
            )}
            {activeTab === 'ingredients' && (
              <IngredientCurvesTab 
                rules={workingConfig.ingredientResponseRules} 
                onChange={(ingredientResponseRules) => setWorkingConfig({ ...workingConfig, ingredientResponseRules })}
              />
            )}
            {activeTab === 'economics' && (
              <EconomicsTab 
                settings={workingConfig.economicsRules} 
                onChange={(economicsRules) => setWorkingConfig({ ...workingConfig, economicsRules })}
              />
            )}
            
            {activeTab === 'feed' && (
              <FeedUtilizationTab 
                rules={workingConfig.feedUtilizationRules} 
                onChange={(feedUtilizationRules) => setWorkingConfig({ ...workingConfig, feedUtilizationRules })}
              />
            )}
            {activeTab === 'groups' && (
              <GroupProfilesTab 
                rules={workingConfig.groupProfileRules} 
                onChange={(groupProfileRules) => setWorkingConfig({ ...workingConfig, groupProfileRules })}
              />
            )}
            {activeTab === 'risk' && (
              <RiskRulesTab 
                rules={workingConfig.riskPenaltyRules} 
                onChange={(riskPenaltyRules) => setWorkingConfig({ ...workingConfig, riskPenaltyRules })}
              />
            )}
            {activeTab === 'lags' && (
              <LagsTab 
                rules={workingConfig.lagRules} 
                onChange={(lagRules) => setWorkingConfig({ ...workingConfig, lagRules })}
              />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t flex justify-between bg-gray-50 bg-[var(--bg-elevated)]" style={{ borderColor: 'var(--border-subtle)' }}>
          <button onClick={onClose} className="px-6 py-2 border rounded-md font-medium text-gray-600 bg-white hover:bg-gray-50">
            Закрыть
          </button>
          
          <button 
            onClick={handleSaveCurrent} 
            className={`px-8 py-2 rounded-md font-medium text-white shadow-sm transition-opacity
               ${currentProfile.isDefault ? 'bg-gray-400 cursor-not-allowed hidden' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
             Сохранить изменения
          </button>
        </div>
      </div>
    </div>
  );
}
