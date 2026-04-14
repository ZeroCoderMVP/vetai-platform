import { KPIValues, ScenarioParameters, ForecastPoint, ScenarioFactorImpact, ScenarioExplanation, ScenarioCalculationResult, defaultBaselineParameters } from '@/types/scenario';
import { ScenarioModelProfile } from '@/types/scenarioModel';
import { defaultScenarioModelProfile } from '@/lib/scenarios/model/scenarioModelDefaults';

export function calculateScenarioForecast(
  scenarioId: string,
  baselineKpi: KPIValues,
  parameters: ScenarioParameters,
  timeHorizon: 1 | 3 | 6 | 12,
  modelProfile: ScenarioModelProfile = defaultScenarioModelProfile
): ScenarioCalculationResult {
  const baseline = baselineKpi;
  const forecasts: ForecastPoint[] = [];
  
  // 🔥 ЗАЩИТА ОТ ПУСТЫХ ИЛИ ПОВРЕЖДЕННЫХ ПРОФИЛЕЙ ИЗ lOCAL STORAGE
  const config = modelProfile?.config || defaultScenarioModelProfile.config;
  if (!config.lagRules) config.lagRules = defaultScenarioModelProfile.config.lagRules;
  if (!config.ingredientResponseRules) config.ingredientResponseRules = defaultScenarioModelProfile.config.ingredientResponseRules;
  if (!config.feedUtilizationRules) config.feedUtilizationRules = defaultScenarioModelProfile.config.feedUtilizationRules;
  if (!config.economicsRules) config.economicsRules = defaultScenarioModelProfile.config.economicsRules;

  let peakMilkDiff = 0;
  let hasFeedResidualsAlert = false;
  let highestSaturation = 0;

  for (let month = 1; month <= timeHorizon; month++) {
    const factor = Math.min(1, month / config.lagRules.milkLagDays);

    // 1. Feeding block - Ingredient Rules
    const accuracyDiff = parameters.feeding.feedingAccuracy - defaultBaselineParameters.feeding.feedingAccuracy;
    const efficiencyBoost = accuracyDiff * 0.25 * factor; 
    
    // Concentrate logic using Rule Engine
    const concRule = config.ingredientResponseRules.find(r => r.ingredientCode === 'conc_base');
    const concShare = parameters.feeding.concentrateShare; 
    let concMilkBoost = 0;
    let concentrateSaturation = 0;

    if (concRule && concRule.enabled) {
      const diffX = concShare - defaultBaselineParameters.feeding.concentrateShare;
      const deltaKg = diffX * 0.5;
      
      if (deltaKg > 0) {
        // Diminishing returns logic
        const saturationSpan = concRule.saturationStart - concRule.baselineX;
        const effDelta = deltaKg > saturationSpan
                         ? saturationSpan + ((deltaKg - saturationSpan) * concRule.diminishingReturnFactor)
                         : deltaKg;
        
        concMilkBoost = effDelta * (concRule.maxMilkDelta / 10) * factor; 
        
        const satSpanEnd = concRule.saturationEnd - concRule.baselineX;
        concentrateSaturation = satSpanEnd > 0 ? (deltaKg / satSpanEnd) : 0;
      } else {
        concMilkBoost = deltaKg * (concRule.maxMilkDelta / 10) * concRule.deficiencyPenaltyFactor * factor;
      }
    } else {
      concMilkBoost = (parameters.feeding.concentrateShare - defaultBaselineParameters.feeding.concentrateShare) * 0.4 * factor;
    }

    if (concentrateSaturation > highestSaturation) highestSaturation = concentrateSaturation;

    // Feed utilization (Residuals)
    const extraFeedIntake = concShare - defaultBaselineParameters.feeding.concentrateShare;
    let residualsGrowth = 0;
    if (extraFeedIntake > (config.feedUtilizationRules.intakeSlowdownPoint - 100)) {
       residualsGrowth = extraFeedIntake * config.feedUtilizationRules.extraFeedToRefusalFactor;
       hasFeedResidualsAlert = true;
    }

    // 2. Groups block with Risk Rules
    const densityDiff = parameters.groups.stockingDensity - 100;
    const densityPenalty = densityDiff > 0 ? (densityDiff * -0.2 * factor) : 0; 
    const densityCulling = densityDiff > 0 ? (densityDiff * 0.1 * factor) : 0; 

    // 3. Reproduction block
    const crDiff = parameters.reproduction.conceptionRate - defaultBaselineParameters.reproduction.conceptionRate;
    const cowIncreasePercent = (crDiff * 0.4) * (month / 6); 

    // KPIs modifications
    const newMilkingCows = Math.max(Math.round(baseline.milkingCows * 0.5), baseline.milkingCows * (1 + cowIncreasePercent / 100) - densityCulling);
    const newTotalAnimals = Math.max(Math.round(baseline.totalAnimals * 0.5), baseline.totalAnimals * (1 + cowIncreasePercent / 100) - densityCulling);

    const healthBoost = 0; 
    const newAvgMilk = Math.max(5, baseline.averageMilkPerCow + concMilkBoost + densityPenalty + healthBoost + (accuracyDiff * 0.08 * factor));
    const MathAvgMilk = Math.round(newAvgMilk * 10) / 10;
    if (MathAvgMilk - baseline.averageMilkPerCow > peakMilkDiff) peakMilkDiff = MathAvgMilk - baseline.averageMilkPerCow;
    
    const newTotalMilk = newMilkingCows * newAvgMilk;

    // 4. Economics block
    const newFeedEfficiency = Math.max(50, Math.min(100, baseline.feedEfficiency + efficiencyBoost - residualsGrowth * 2));
    
    const feedScale = parameters.economics.feedCostIndex * (1 + (extraFeedIntake * 0.015)) + (residualsGrowth * 0.01);
    const newFeedCostPerHead = baseline.feedCostPerHead * feedScale;
    const newTotalFeedCost = newTotalAnimals * newFeedCostPerHead; 
    
    const revenue = newTotalMilk * config.economicsRules.milkPrice;
    const IOFC = (revenue - newTotalFeedCost) / newMilkingCows;
    
    const newCostPerLiter = newTotalMilk > 0 
      ? ((newTotalFeedCost + baseline.costPerLiter * baseline.totalDailyMilk * parameters.economics.vetCostIndex * 0.4) / newTotalMilk)
      : baseline.costPerLiter * 2;

    const newPregRate = Math.max(0, baseline.pregnancyRate + crDiff * factor);

    const baseRevenue = baseline.totalDailyMilk * config.economicsRules.milkPrice;
    const baseTotalFeedCost = baseline.totalAnimals * baseline.feedCostPerHead;
    const baseEconDaily = baseRevenue - baseTotalFeedCost - (baseline.costPerLiter * baseline.totalDailyMilk * 0.4); 
    
    const scenEconDaily = revenue - newTotalFeedCost - (baseline.costPerLiter * baseline.totalDailyMilk * parameters.economics.vetCostIndex * 0.4);
    const dailyEconDelta = scenEconDaily - baseEconDaily;
    const totalEconomicEffect = dailyEconDelta * 30.4; 

    forecasts.push({
      month,
      kpi: {
        totalAnimals: Math.round(newTotalAnimals),
        milkingCows: Math.round(newMilkingCows),
        averageMilkPerCow: MathAvgMilk,
        totalDailyMilk: Math.round(newTotalMilk),
        feedEfficiency: Math.round(newFeedEfficiency * 10) / 10,
        feedCostPerHead: Math.round(newFeedCostPerHead * 10) / 10,
        incomeOverFeed: Math.round(IOFC),
        costPerLiter: Math.round(newCostPerLiter * 10) / 10,
        pregnancyRate: Math.round(newPregRate * 10) / 10,
        servicePeriod: baseline.servicePeriod, 
        averageDim: baseline.averageDim,
        cullingRate: baseline.cullingRate + densityCulling,
        freshCows: baseline.freshCows,
        dryCows: baseline.dryCows, 
        replacementStock: baseline.replacementStock,
        totalEconomicEffect: Math.round(totalEconomicEffect)
      }
    });
  }

  const finalKpi = forecasts[timeHorizon - 1].kpi;
  const insightsAndImpacts = generateInsights(baseline, finalKpi, parameters, timeHorizon, modelProfile);

  return {
    scenarioId,
    baselineKpi: baseline,
    forecasts,
    insights: insightsAndImpacts.insights,
    impactTable: insightsAndImpacts.impactTable,
    diagnostics: {
      marginalEfficiency: peakMilkDiff > 0 ? (finalKpi.totalEconomicEffect / (peakMilkDiff * 1000)) : 0, 
      feedResidualsAlert: hasFeedResidualsAlert,
      saturationLevel: Math.min(100, Math.round(highestSaturation * 100))
    }
  };
}

function generateInsights(
  base: KPIValues,
  scen: KPIValues,
  p: ScenarioParameters,
  horizon: number,
  modelProfile: ScenarioModelProfile
): { insights: ScenarioExplanation[], impactTable: ScenarioFactorImpact[] } {
  const insights: ScenarioExplanation[] = [];
  const impactTable: ScenarioFactorImpact[] = [];
  const config = modelProfile.config;
  
  const milkDiff = scen.averageMilkPerCow - base.averageMilkPerCow;
  if (milkDiff < -2) {
    insights.push({
      type: 'negative',
      title: 'Падение надоя',
      description: `Снижение надоя на ${Math.abs(milkDiff).toFixed(1)} кг/голову — возможна потеря дохода на горизонте ${horizon} мес.`
    });
  } else if (milkDiff > 2) {
    insights.push({
      type: 'positive',
      title: 'Рост продуктивности',
      description: `Увеличение надоя на ${milkDiff.toFixed(1)} кг/голову позитивно скажется на объеме реализации молока.`
    });
  }

  // Diagnostic Insights from Rule Engine
  const concDiff = p.feeding.concentrateShare - defaultBaselineParameters.feeding.concentrateShare;
  if (concDiff > 5) {
    const concRule = config.ingredientResponseRules.find(r => r.ingredientCode === 'conc_base');
    if (concRule && concDiff > (concRule.saturationStart - concRule.baselineX)) {
      insights.push({
        type: 'risk',
        title: 'Близость к потолку отдачи',
        description: `Дополнительный комбикорм дает слабую маржинальную отдачу из-за эффекта насыщения.`
      });
      impactTable.push({
        factor: 'Увеличение концентратов',
        change: `+${concDiff}%`,
        effect: 'Убывающая отдача',
        comment: 'Основная прибавка переходит в остатки и удорожание.',
        riskLevel: 'high'
      });
    } else {
      impactTable.push({
        factor: 'Увеличение концентратов',
        change: `+${concDiff}%`,
        effect: 'Рост молока',
        comment: 'Находится в пределах эффективной зоны отклика.',
        riskLevel: 'low'
      });
    }
  }

  // Risk Penalty checks
  if (config.riskPenaltyRules) {
    const refusalRisk = config.riskPenaltyRules.find(r => r.code === 'HIGH_REFUSAL');
    if (refusalRisk && refusalRisk.enabled && p.feeding.targetRemainder > refusalRisk.thresholdYellow) {
      insights.push({
        type: 'negative',
        title: refusalRisk.name,
        description: refusalRisk.warningText
      });
    }
    
    const concOverloadRisk = config.riskPenaltyRules.find(r => r.code === 'CONC_OVERLOAD');
    if (concOverloadRisk && concOverloadRisk.enabled && p.feeding.concentrateShare > concOverloadRisk.thresholdYellow) {
       insights.push({
         type: 'risk',
         title: concOverloadRisk.name,
         description: concOverloadRisk.warningText
       });
    }
  }

  if (scen.totalEconomicEffect < -50000) {
    insights.push({
      type: 'risk',
      title: 'Отрицательный эффект',
      description: `Отрицательный экономический эффект: ${(scen.totalEconomicEffect).toLocaleString('ru-RU')} руб / мес — сценарий убыточен.`
    });
  } else if (scen.totalEconomicEffect > 50000) {
    insights.push({
      type: 'positive',
      title: 'Прибыльный сценарий',
      description: `Положительный экономический эффект: +${(scen.totalEconomicEffect).toLocaleString('ru-RU')} руб / мес.`
    });
  }

  return { insights: insights.slice(0, 5), impactTable };
}
