export type ScopeType = 'farm' | 'groupType' | 'group' | 'global';
export type IngredientType = 'energy' | 'protein' | 'fiber' | 'mineral' | 'buffer' | 'fat' | 'additive' | 'other';
export type GroupType = 'fresh' | 'high' | 'mid' | 'late' | 'dry' | 'transition' | 'custom';

export interface CurvePoint {
  x: number;
  y: number;
}

export interface IngredientResponseRule {
  ingredientCode: string;
  ingredientName: string;
  enabled: boolean;
  ingredientType: IngredientType;
  xUnit: 'kgHeadDay' | 'dryMatterKg' | 'rationPercent';
  yUnit: 'milkKgHeadDay' | 'milkPercent';
  
  // Parametric logic
  baselineX: number;
  minAllowed: number;
  recommendedMin: number;
  saturationStart: number;
  saturationEnd: number;
  maxMilkDelta: number;
  slopeStart: number;
  diminishingReturnFactor: number;
  deficiencyPenaltyFactor: number;
  excessPenaltyFactor: number;
  
  lagDays: number;
  rampUpDays: number;
  decayDays: number;
  
  points: CurvePoint[];
  mode: 'parametric' | 'points';
}

export interface FeedUtilizationRule {
  profileId?: string;
  baselineNeed: number;
  physiologicalIntakeLimit: number;
  intakeSlowdownPoint: number;
  intakePlateauPoint: number;
  targetRefusalMin: number;
  targetRefusalMax: number;
  extraFeedToIntakeFactor: number;
  extraFeedToRefusalFactor: number;
  wasteGrowthFactor: number;
  efficiencyDropFactor: number;
}

export interface GroupProfileRule {
  groupType: GroupType;
  milkSensitivityEnergy: number;
  milkSensitivityProtein: number;
  milkSensitivityFiber: number;
  intakeCeilingFactor: number;
  refusalTolerance: number;
  stockingDensitySensitivity: number;
  regimeDisruptionSensitivity: number;
  lagSensitivity: number;
}

export interface RiskPenaltyRule {
  code: string;
  name: string;
  enabled: boolean;
  thresholdYellow: number;
  thresholdRed: number;
  milkPenaltyFactor: number;
  iofcPenaltyFactor: number;
  riskScorePenalty: number;
  warningText: string;
}

export interface LagRule {
  milkLagDays: number;
  refusalLagDays: number;
  economicsLagDays: number;
  transitionSpeed: number;
  rollbackSpeed: number;
  smoothingFactor: number;
  cumulativeEffectEnabled: boolean;
}

export interface EconomicsRule {
  milkPrice: number;
  feedWasteCostFactor: number;
  overfeedingPenaltyCost: number;
  feedCostPerKgDM: number;
  marginalIofcFactor: number;
  costPerLiterAdjustment: number;
}

export interface GeneralModelSettings {
  defaultHorizon: 1 | 3 | 6 | 12;
  calculationUnit: 'head' | 'herd';
  conservatismFactor: number;
  modelConfidenceFactor: number;
  generalRiskMultiplier: number;
  allowAggressiveScenarios: boolean;
  warnOnBiologicallyDoubtful: boolean;
}

export interface ScenarioModelConfig {
  general: GeneralModelSettings;
  ingredientResponseRules: IngredientResponseRule[];
  feedUtilizationRules: FeedUtilizationRule;
  groupProfileRules: GroupProfileRule[];
  riskPenaltyRules: RiskPenaltyRule[];
  lagRules: LagRule;
  economicsRules: EconomicsRule;
}

export interface ScenarioModelProfile {
  id: string;
  name: string;
  description: string;
  scopeType: ScopeType;
  scopeId: string | null;
  isActive: boolean;
  isDefault: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  config: ScenarioModelConfig;
}
