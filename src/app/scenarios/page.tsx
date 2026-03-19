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

export default function ScenariosPage() {
  const [mounted, setMounted] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedId, setSelectedId] = useState<string>("baseline");
  const [horizon, setHorizon] = useState<ForecastHorizon>(3);
  const [currentParams, setCurrentParams] = useState<ScenarioParameters>(defaultBaselineParameters);
  
  const [calculation, setCalculation] = useState<ScenarioCalculationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [baselineKpi, setBaselineKpi] = useState<KPIValues | null>(null);

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
    
    const baseline = all.find(s => s.id === 'baseline');
    if (baseline) {
      setCurrentParams(baseline.parameters);
      setSelectedId('baseline');
    }
    setMounted(true);
  }, []);

  // Recalculate anytime parameters, baseline or horizon change, if mounted
  useEffect(() => {
    if (!mounted || !baselineKpi) return;
    const result = calculateScenarioForecast(selectedId, baselineKpi, currentParams, horizon);
    setCalculation(result);
  }, [currentParams, horizon, selectedId, mounted, baselineKpi]);

  const handleSelect = (id: string) => {
    const storage = getScenarioStorage();
    const sc = storage.getById(id);
    if (sc) {
      setSelectedId(id);
      setCurrentParams(sc.parameters);
      setHorizon(sc.timeHorizon);
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
    });
    setScenarios(storage.getAll());
    setTimeout(() => setIsSaving(false), 500); // UI feedback
  };

  if (!mounted || !calculation) {
    return (
      <AppLayout title="Сценарное управление">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">Загрузка сценарного движка...</div>
        </div>
      </AppLayout>
    );
  }

  const selectedScenario = scenarios.find(s => s.id === selectedId);
  const isBaseline = selectedScenario?.isBaseline || false;

  const currentForecast = calculation.forecasts[horizon - 1].kpi;

  return (
    <AppLayout title="Сценарное управление">
      <div className="animate-fade-in w-full">
        <ScenarioHeader
          scenarios={scenarios}
          selectedId={selectedId}
          onSelect={handleSelect}
          horizon={horizon}
          onHorizonChange={setHorizon}
          onSave={handleSave}
          onCreate={handleCreate}
          isSaving={isSaving}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
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
