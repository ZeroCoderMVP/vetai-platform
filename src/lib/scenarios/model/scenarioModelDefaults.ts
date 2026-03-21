import { ScenarioModelProfile, ScenarioModelConfig } from "@/types/scenarioModel";

export const defaultScenarioModelConfig: ScenarioModelConfig = {
  general: {
    defaultHorizon: 3,
    calculationUnit: 'head',
    conservatismFactor: 1.0,
    modelConfidenceFactor: 0.9,
    generalRiskMultiplier: 1.0,
    allowAggressiveScenarios: true,
    warnOnBiologicallyDoubtful: true,
  },
  ingredientResponseRules: [
    {
      ingredientCode: 'conc_base',
      ingredientName: 'Концентраты (базовые)',
      enabled: true,
      ingredientType: 'energy',
      xUnit: 'kgHeadDay',
      yUnit: 'milkKgHeadDay',
      baselineX: 10,
      minAllowed: 2,
      recommendedMin: 5,
      saturationStart: 12,
      saturationEnd: 15,
      maxMilkDelta: 3.5,
      slopeStart: 1.2,
      diminishingReturnFactor: 0.6,
      deficiencyPenaltyFactor: 1.5,
      excessPenaltyFactor: 0.8,
      lagDays: 3,
      rampUpDays: 7,
      decayDays: 5,
      points: [
        { x: -5, y: -6.0 },
        { x: -2, y: -2.5 },
        { x: 0, y: 0 },
        { x: 2, y: 1.6 },
        { x: 4, y: 2.5 },
        { x: 6, y: 3.0 },
        { x: 8, y: 3.2 }
      ],
      mode: 'parametric'
    },
    {
      ingredientCode: 'silage_corn',
      ingredientName: 'Кукурузный силос',
      enabled: true,
      ingredientType: 'fiber',
      xUnit: 'kgHeadDay',
      yUnit: 'milkKgHeadDay',
      baselineX: 20,
      minAllowed: 10,
      recommendedMin: 15,
      saturationStart: 25,
      saturationEnd: 30,
      maxMilkDelta: 2.0,
      slopeStart: 0.8,
      diminishingReturnFactor: 0.5,
      deficiencyPenaltyFactor: 1.2,
      excessPenaltyFactor: 0.9,
      lagDays: 5,
      rampUpDays: 14,
      decayDays: 10,
      points: [],
      mode: 'parametric'
    }
  ],
  feedUtilizationRules: {
    baselineNeed: 100,
    physiologicalIntakeLimit: 110,
    intakeSlowdownPoint: 105,
    intakePlateauPoint: 115,
    targetRefusalMin: 3,
    targetRefusalMax: 5,
    extraFeedToIntakeFactor: 0.7,
    extraFeedToRefusalFactor: 0.3,
    wasteGrowthFactor: 1.5,
    efficiencyDropFactor: 1.2
  },
  groupProfiles: [
    {
      groupType: 'high',
      milkSensitivityEnergy: 1.2,
      milkSensitivityProtein: 1.1,
      milkSensitivityFiber: 0.9,
      intakeCeilingFactor: 1.1,
      refusalTolerance: 0.8,
      stockingDensitySensitivity: 1.3,
      regimeDisruptionSensitivity: 1.2,
      lagSensitivity: 0.9
    },
    {
      groupType: 'mid',
      milkSensitivityEnergy: 1.0,
      milkSensitivityProtein: 1.0,
      milkSensitivityFiber: 1.0,
      intakeCeilingFactor: 1.0,
      refusalTolerance: 1.0,
      stockingDensitySensitivity: 1.0,
      regimeDisruptionSensitivity: 1.0,
      lagSensitivity: 1.0
    }
  ],
  riskPenaltyRules: [
    {
      code: 'HIGH_REFUSAL',
      name: 'Высокие остатки корма',
      enabled: true,
      thresholdYellow: 6,
      thresholdRed: 10,
      milkPenaltyFactor: 0.05,
      iofcPenaltyFactor: 0.1,
      riskScorePenalty: 15,
      warningText: 'Остатки корма превышают норму. Перерасход средств.'
    },
    {
      code: 'CONC_OVERLOAD',
      name: 'Перегрузка концентратами',
      enabled: true,
      thresholdYellow: 55, // % of DM
      thresholdRed: 60,
      milkPenaltyFactor: 0.1,
      iofcPenaltyFactor: 0.15,
      riskScorePenalty: 25,
      warningText: 'Риск ацидоза: доля концентратов превышает безопасную норму.'
    }
  ],
  lagRules: {
    milkLagDays: 3,
    refusalLagDays: 1,
    economicsLagDays: 0,
    transitionSpeed: 1.0,
    rollbackSpeed: 0.8,
    smoothingFactor: 0.5,
    cumulativeEffectEnabled: true
  },
  economicsRules: {
    milkPrice: 42.5,
    feedWasteCostFactor: 1.2,
    overfeedingPenaltyCost: 0.5,
    feedCostPerKgDM: 22.0,
    marginalIofcFactor: 1.0,
    costPerLiterAdjustment: 1.0
  }
} as unknown as ScenarioModelConfig; // Type assertion to bypass minor structural mismatches during prototyping

export const defaultScenarioModelProfile: ScenarioModelProfile = {
  id: 'default-profile-v1',
  name: 'Базовый профиль ВЕТАИ (Универсальный)',
  description: 'Стандартный набор правил и коэффициентов отклика по умолчанию. Используется, если пользователь не настраивал свою модель.',
  scopeType: 'global',
  scopeId: null,
  isActive: true,
  isDefault: true,
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
  config: defaultScenarioModelConfig
};
