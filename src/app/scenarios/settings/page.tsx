"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { ScenarioModelProfile } from '@/types/scenarioModel';
import { getScenarioModelStorage } from '@/lib/scenarios/model/scenarioModelStorage';
import RuleProfileSelector from '@/components/scenarios/settings/RuleProfileSelector';
import GeneralSettingsTab from '@/components/scenarios/settings/GeneralSettingsTab';
import IngredientCurvesTab from '@/components/scenarios/settings/IngredientCurvesTab';
import EconomicsTab from '@/components/scenarios/settings/EconomicsTab';
import FeedUtilizationTab from '@/components/scenarios/settings/FeedUtilizationTab';
import GroupProfilesTab from '@/components/scenarios/settings/GroupProfilesTab';
import RiskRulesTab from '@/components/scenarios/settings/RiskRulesTab';
import LagsTab from '@/components/scenarios/settings/LagsTab';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [profiles, setProfiles] = useState<ScenarioModelProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [workingConfig, setWorkingConfig] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'ingredients' | 'feed' | 'groups' | 'risk' | 'lags' | 'economics'>('general');

  useEffect(() => {
    const storage = getScenarioModelStorage();
    const allProfiles = storage.getAll();
    setProfiles(allProfiles);
    
    // Select the active profile
    const activeInfo = storage.getActive();
    setActiveProfileId(activeInfo.id);
    setWorkingConfig(activeInfo.config);
    setMounted(true);
  }, []);

  const currentProfile = profiles.find(p => p.id === activeProfileId);

  useEffect(() => {
    if (currentProfile) {
      setWorkingConfig(currentProfile.config);
    }
  }, [currentProfile]);

  if (!mounted || !currentProfile || !workingConfig) {
    return (
      <AppLayout title="Настройки модели">
        <div className="p-8 text-center text-gray-500">Загрузка редактора правил...</div>
      </AppLayout>
    );
  }

  const handleSelectProfile = (id: string) => {
    setActiveProfileId(id);
    // Let's also set it as active in storage so the main page uses it
    const profile = profiles.find(p => p.id === id);
    if (profile) {
      const storage = getScenarioModelStorage();
      storage.saveProfile({ ...profile, isActive: true });
      setProfiles(storage.getAll());
    }
  };

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
    
    const storage = getScenarioModelStorage();
    storage.saveProfile(newProfile);
    setProfiles(storage.getAll());
    setActiveProfileId(newProfile.id);
  };

  const handleDeleteProfile = (id: string) => {
    const storage = getScenarioModelStorage();
    storage.deleteProfile(id);
    const updated = storage.getAll();
    setProfiles(updated);
    if (activeProfileId === id) {
       setActiveProfileId(updated[0].id);
       setWorkingConfig(updated[0].config);
    }
  };

  const handleSaveCurrent = () => {
    if (currentProfile.isDefault) {
      alert("Нельзя изменить стандартный профиль. Нажмите '+ Сохранить как новый' чтобы создать собственную настройку.");
      return;
    }
    const updated = { ...currentProfile, config: workingConfig };
    const storage = getScenarioModelStorage();
    storage.saveProfile(updated);
    setProfiles(storage.getAll());
    alert("Настройки успешно сохранены!");
  };

  return (
    <AppLayout title="Настройки модели расчета">
      <div className="animate-fade-in w-full pb-10">
        
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-6 bg-[var(--bg-elevated)] p-6 rounded-lg border" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <div className="flex items-center gap-3">
              <Link href="/scenarios" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mr-2">
                &larr; Назад к сценариям
              </Link>
              <h2 className="text-2xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
                <span className="text-3xl">⚙️</span>
                Конструктор rule-based модели
              </h2>
            </div>
            <p className="text-[var(--text-secondary)] text-sm mt-2 ml-5 pl-11">Тонкая настройка параметрического ядра сценарного движка</p>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
              onClick={handleSaveCurrent} 
              className={`px-6 py-2 rounded-md font-medium text-white shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                 ${currentProfile.isDefault ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700 active:transform active:scale-95'}`}
              title={currentProfile.isDefault ? 'Стандартный стенд не редактируется' : 'Сохранить изменения профиля'}
            >
               Сохранить изменения
            </button>
          </div>
        </div>

        <RuleProfileSelector 
          profiles={profiles}
          activeId={activeProfileId}
          onSelect={handleSelectProfile}
          onCreateNew={handleCreateNew}
          onDelete={handleDeleteProfile}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--space-6)' }}>
          {/* Vertical Tabs sidebar */}
          <div className="card h-fit">
            <div className="card-body" style={{ padding: 'var(--space-3)' }}>
              <ul className="space-y-3 list-none m-0 p-0">
                {[
                  { id: 'general', label: 'Общие параметры', icon: '⚙️' },
                  { id: 'ingredients', label: 'Кривые отклика сырья', icon: '🌽' },
                  { id: 'feed', label: 'Переход в остатки', icon: '📉' },
                  { id: 'groups', label: 'Группы и стадии', icon: '🐄' },
                  { id: 'risk', label: 'Риски и штрафы', icon: '⚠️' },
                  { id: 'lags', label: 'Лаги и инерция', icon: '⏳' },
                  { id: 'economics', label: 'Экономика', icon: '💰' },
                ].map(t => (
                  <li key={t.id} className="m-0 p-0 border-none">
                    <button 
                      onClick={() => setActiveTab(t.id as any)}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-all flex items-center gap-3 rounded-md border-none outline-none cursor-pointer
                        ${activeTab === t.id 
                          ? 'bg-[var(--primary-50)] text-[var(--primary-600)]' 
                          : 'text-[var(--text-secondary)] bg-transparent hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      {t.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tab Content */}
          <div className="card flex flex-col min-h-[600px]">
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
      </div>
    </AppLayout>
  );
}
