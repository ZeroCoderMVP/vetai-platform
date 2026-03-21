"use client";

import { useEffect, useState } from "react";
import ScenarioHeader from "@/components/scenarios/ScenarioHeader";
import ScenarioControls from "@/components/scenarios/ScenarioControls";
import ScenarioKpiCards from "@/components/scenarios/ScenarioKpiCards";
import ScenarioCharts from "@/components/scenarios/ScenarioCharts";
import ScenarioInsights from "@/components/scenarios/ScenarioInsights";
import ScenarioComparisonTable from "@/components/scenarios/ScenarioComparisonTable";
import AppLayout from "@/components/layout/AppLayout";
import { 
  Scenario, 
  ScenarioParameters, 
  ForecastHorizon, 
  ScenarioCalculationResult,
  defaultBaselineParameters,
  KPIValues
} from "@/types/scenario";
import { getScenarioStorage } from "@/lib/scenarios/scenarioStorage";
import { calculateScenarioForecast } from "@/lib/scenarios/scenarioEngine";

import { ScenarioModelProfile } from "@/types/scenarioModel";
import { getScenarioModelStorage } from "@/lib/scenarios/model/scenarioModelStorage";
import { defaultScenarioModelProfile } from "@/lib/scenarios/model/scenarioModelDefaults";

export default function ScenariosPage() {
  const [mounted, setMounted] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedId, setSelectedId] = useState<string>("baseline");
  const [horizon, setHorizon] = useState<ForecastHorizon>(3);
  const [currentParams, setCurrentParams] = useState<ScenarioParameters>(defaultBaselineParameters);
  
  const [calculation, setCalculation] = useState<ScenarioCalculationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [baselineKpi, setBaselineKpi] = useState<KPIValues | null>(null);

  // Model Profiles state
  const [profiles, setProfiles] = useState<ScenarioModelProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('default-profile-v1');

  useEffect(() => {
    fetch('/api/scenarios/baseline')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setBaselineKpi(data);
      })
      .catch(err => console.error("Failed to fetch scenario baseline:", err));

    const storage = getScenarioStorage();
    const all = storage.getAll();
    setScenarios(all);
    
    // Load Model Profiles
    const modelStorage = getScenarioModelStorage();
    const allProfiles = modelStorage.getAll();
    setProfiles(allProfiles);
    setActiveProfileId(modelStorage.getActive().id);

    const baseline = all.find(s => s.id === 'baseline');
    if (baseline) {
      setCurrentParams(baseline.parameters);
      setSelectedId('baseline');
    }
    setMounted(true);
  }, []);

  // Use the active profile from state, or fallback if deleted
  const activeProfile = profiles.find(p => p.id === activeProfileId) || defaultScenarioModelProfile;

  // Recalculate anytime parameters, baseline, horizon, or the active profile change
  useEffect(() => {
    if (!mounted || !baselineKpi) return;
    const result = calculateScenarioForecast(selectedId, baselineKpi, currentParams, horizon, activeProfile);
    setCalculation(result);
  }, [currentParams, horizon, selectedId, mounted, baselineKpi, activeProfile]);

  const handleSelect = (id: string) => {
    const storage = getScenarioStorage();
    const sc = storage.getById(id);
    if (sc) {
      setSelectedId(id);
      setCurrentParams(sc.parameters);
      setHorizon(sc.timeHorizon);
      // Optional: Load the specific profile tied to this scenario if it exists:
      if (sc.modelProfileId && profiles.some(p => p.id === sc.modelProfileId)) {
         setActiveProfileId(sc.modelProfileId);
      }
    }
  };

  const handleCreate = () => {
    const newName = prompt("Введите название нового сценария:", `Сценарий от ${new Date().toLocaleDateString()}`);
    if (!newName) return;

    const storage = getScenarioStorage();
    const newScen = storage.saveScenario({
      id: "", // generated in saveScenario
      name: newName,
      createdAt: "",
      updatedAt: "",
      timeHorizon: horizon,
      parameters: { ...currentParams },
      isBaseline: false,
      modelProfileId: activeProfileId // tie current profile
    });
    setScenarios(storage.getAll());
    setSelectedId(newScen.id);
  };

  const handleSave = () => {
    const storage = getScenarioStorage();
    const sc = storage.getById(selectedId);
    if (!sc || sc.isBaseline) return;
    
    setIsSaving(true);
    storage.saveScenario({
      ...sc,
      parameters: currentParams,
      timeHorizon: horizon,
      modelProfileId: activeProfileId
    });
    setScenarios(storage.getAll());
    setTimeout(() => setIsSaving(false), 500); // UI feedback
  };

  // Rule Profile Handlers
  const handleSaveProfile = (profile: ScenarioModelProfile) => {
    const storage = getScenarioModelStorage();
    storage.saveProfile(profile);
    setProfiles(storage.getAll());
  };

  const handleDeleteProfile = (id: string) => {
    const storage = getScenarioModelStorage();
    storage.deleteProfile(id);
    const updated = storage.getAll();
    setProfiles(updated);
    if (activeProfileId === id) {
       setActiveProfileId(updated[0].id);
    }
  };

  if (!mounted || !calculation) {
    return (
      <AppLayout title="Сценарное управление">
        <div className="empty-state bg-white border border-[var(--border-subtle)]">
          <div className="empty-state-icon text-5xl mb-4">🔮</div>
          <div className="empty-state-text text-xl font-medium">Загрузка сценарного движка...</div>
          <div className="text-gray-500 mt-2">Инициализация правил и профилей модели</div>
        </div>
      </AppLayout>
    );
  }

  const currentForecast = calculation.forecasts[horizon - 1].kpi;
  const isBaseline = !!(scenarios.find(s => s.id === selectedId)?.isBaseline);

  return (
    <AppLayout title="Сценарное управление">
      <div className="animate-fade-in w-full pb-10">

        <ScenarioHeader
          scenarios={scenarios}
          selectedId={selectedId}
          onSelect={handleSelect}
          horizon={horizon}
          onHorizonChange={setHorizon}
          onSave={handleSave}
          onCreate={handleCreate}
          isSaving={isSaving}
          activeProfileName={activeProfile.name}
        />

        {/* Diagnostic Bar Above Grid */}
        {calculation.diagnostics && (
          <div className="mb-6 flex gap-4 p-4 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            <div className="flex-1 flex flex-col justify-center border-r pr-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider font-semibold">Насыщение ингредиентов</span>
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${calculation.diagnostics.saturationLevel > 90 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${calculation.diagnostics.saturationLevel}%` }}></div>
                </div>
                <span className="text-sm font-bold w-12 text-right">{calculation.diagnostics.saturationLevel}%</span>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center border-r px-4" style={{ borderColor: 'var(--border-subtle)' }}>
               <span className="text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider font-semibold">Угроза высоких остатков (Risk)</span>
               {calculation.diagnostics.feedResidualsAlert ? (
                 <span className="text-sm font-medium text-red-600 flex items-center gap-1">⚠️ Выявлен перекорм или низкая утилизация</span>
               ) : (
                 <span className="text-sm font-medium text-green-600 flex items-center gap-1">✅ Риск остатков в норме</span>
               )}
            </div>

            <div className="flex-1 flex flex-col justify-center pl-4">
               <span className="text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider font-semibold">Маржинальная эффективность (IOFC/КГ)</span>
               <span className="text-lg font-bold">{calculation.diagnostics.marginalEfficiency.toFixed(2)} ₽/литр</span>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 'var(--space-6)' }}>
          {/* Left sidebar - Controls */}
          <div>
            <ScenarioControls 
              parameters={currentParams} 
              onChange={setCurrentParams} 
              disabled={false}
            />
          </div>

          {/* Center Panel - Results */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <ScenarioKpiCards 
              baseline={calculation.baselineKpi} 
              forecast={currentForecast} 
            />
            <ScenarioCharts 
              baseline={calculation.baselineKpi} 
              forecasts={calculation.forecasts} 
            />
          </div>

          {/* Right Panel - Analytics & Insights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <ScenarioComparisonTable 
              baseline={calculation.baselineKpi} 
              forecasts={calculation.forecasts} 
            />
            <ScenarioInsights 
              insights={calculation.insights} 
              impactTable={calculation.impactTable} 
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
