export type ForecastHorizon = 1 | 3 | 6 | 12;

export interface ScenarioParameters {
  feeding: {
    silageShare: number; // %
    haylageShare: number; // %
    concentrateShare: number; // %
    ingredientPriceIndex: number; // multiplier, e.g. 1.0
    feedingAccuracy: number; // %
    targetRemainder: number; // %
  };
  groups: {
    stockingDensity: number; // %
  };
  reproduction: {
    conceptionRate: number; // %
    heatDetection: number; // %
  };
  economics: {
    milkPrice: number; // ₽ per kg
    feedCostIndex: number; // multiplier, e.g. 1.0
    vetCostIndex: number; // multiplier
  };
  genetics: {
    geneticProgressIndex: number; // % per year (placeholder)
  };
  health: {
    diseaseIncidence: number; // % (placeholder)
  };
}

export interface KPIValues {
  totalAnimals: number;
  milkingCows: number;
  averageMilkPerCow: number;
  totalDailyMilk: number;
  feedEfficiency: number;
  feedCostPerHead: number;
  incomeOverFeed: number;
  costPerLiter: number;
  pregnancyRate: number; // %
  servicePeriod: number; // days
  averageDim: number; // days
  cullingRate: number; // %
  freshCows: number;
  dryCows: number;
  replacementStock: number;
  totalEconomicEffect: number; // vs baseline
}

/**
 * Single month forecast result. Month corresponds to months from now (e.g. 0 = baseline, 1 = next month)
 */
export interface ForecastPoint {
  month: number;
  kpi: KPIValues;
}

export interface ScenarioExplanation {
  type: 'positive' | 'negative' | 'neutral' | 'risk' | 'recommendation';
  title: string;
  description: string;
}

export interface ScenarioFactorImpact {
  factor: string;
  change: string;
  effect: string;
  comment: string;
  riskLevel?: 'none' | 'low' | 'medium' | 'high';
}

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  timeHorizon: ForecastHorizon;
  parameters: ScenarioParameters;
  isBaseline?: boolean; // If true, this represents the current farm state
  modelProfileId?: string; // Links this scenario explicitly to a config version
}

export interface ScenarioCalculationResult {
  scenarioId: string;
  baselineKpi: KPIValues;
  forecasts: ForecastPoint[]; // points up to the timeHorizon
  insights: ScenarioExplanation[];
  impactTable: ScenarioFactorImpact[];
  diagnostics?: {
    marginalEfficiency: number;
    feedResidualsAlert: boolean;
    saturationLevel: number;
  };
}

export const defaultBaselineParameters: ScenarioParameters = {
  feeding: {
    silageShare: 35,
    haylageShare: 25,
    concentrateShare: 40,
    ingredientPriceIndex: 1.0,
    feedingAccuracy: 95,
    targetRemainder: 5,
  },
  groups: {
    stockingDensity: 100, // 100% capacity
  },
  reproduction: {
    conceptionRate: 35,
    heatDetection: 60,
  },
  economics: {
    milkPrice: 42.5, // e.g. 42.5 rub/kg
    feedCostIndex: 1.0,
    vetCostIndex: 1.0,
  },
  genetics: {
    geneticProgressIndex: 1.0,
  },
  health: {
    diseaseIncidence: 10,
  },
};
