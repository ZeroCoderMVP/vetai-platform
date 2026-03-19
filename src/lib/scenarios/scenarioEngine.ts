import { KPIValues, ScenarioParameters, ForecastPoint, ScenarioFactorImpact, ScenarioExplanation, ScenarioCalculationResult, defaultBaselineParameters } from '@/types/scenario';

export function calculateScenarioForecast(
  scenarioId: string,
  baselineKpi: KPIValues,
  parameters: ScenarioParameters,
  timeHorizon: 1 | 3 | 6 | 12
): ScenarioCalculationResult {
  const baseline = baselineKpi;
  const forecasts: ForecastPoint[] = [];

  for (let month = 1; month <= timeHorizon; month++) {
    // Math.min limits rapid growth, but allows strong impacts
    const factor = Math.min(1, month / 3); // Effects propagate faster for demo purposes

    // 1. Feeding block
    const accuracyDiff = parameters.feeding.feedingAccuracy - defaultBaselineParameters.feeding.feedingAccuracy;
    const efficiencyBoost = accuracyDiff * 0.25 * factor; // stronger precision effect
    
    // Concentrate share impact (more concentrate = more milk, but higher cost)
    const concentrateDiff = parameters.feeding.concentrateShare - defaultBaselineParameters.feeding.concentrateShare;
    const milkBoostConcentrate = concentrateDiff * 0.4 * factor; 

    // Silage/Haylage impact
    const roughageDiff = (parameters.feeding.silageShare + parameters.feeding.haylageShare) - 
                         (defaultBaselineParameters.feeding.silageShare + defaultBaselineParameters.feeding.haylageShare);
    const healthBoost = roughageDiff * 0.1 * factor; // more roughage = better health, less milk drops

    // 2. Groups block
    const densityDiff = parameters.groups.stockingDensity - 100;
    const densityPenalty = densityDiff > 0 ? (densityDiff * -0.2 * factor) : 0; // high density kills yield
    const densityCulling = densityDiff > 0 ? (densityDiff * 0.1 * factor) : 0; // high density kills cows

    // 3. Reproduction block
    const crDiff = parameters.reproduction.conceptionRate - defaultBaselineParameters.reproduction.conceptionRate;
    const cowIncreasePercent = (crDiff * 0.4) * (month / 6); // More cows linearly over months

    // KPIs modifications
    const newMilkingCows = Math.max(Math.round(baseline.milkingCows * 0.5), baseline.milkingCows * (1 + cowIncreasePercent / 100) - densityCulling);
    const newTotalAnimals = Math.max(Math.round(baseline.totalAnimals * 0.5), baseline.totalAnimals * (1 + cowIncreasePercent / 100) - densityCulling);

    const newAvgMilk = Math.max(5, baseline.averageMilkPerCow + milkBoostConcentrate + densityPenalty + healthBoost + (accuracyDiff * 0.08 * factor));
    const newTotalMilk = newMilkingCows * newAvgMilk;

    // 4. Economics block
    const newFeedEfficiency = Math.max(50, Math.min(100, baseline.feedEfficiency + efficiencyBoost));
    
    // Feed scale: default index 1, plus concentrate is expensive
    const feedScale = parameters.economics.feedCostIndex * (1 + (concentrateDiff * 0.015));
    const newFeedCostPerHead = baseline.feedCostPerHead * feedScale;
    const newTotalFeedCost = newTotalAnimals * newFeedCostPerHead; // simple
    
    const revenue = newTotalMilk * parameters.economics.milkPrice;
    const IOFC = (revenue - newTotalFeedCost) / newMilkingCows;
    
    const newCostPerLiter = newTotalMilk > 0 
      ? ((newTotalFeedCost + baseline.costPerLiter * baseline.totalDailyMilk * parameters.economics.vetCostIndex * 0.4) / newTotalMilk)
      : baseline.costPerLiter * 2;

    // Repro stats
    const newPregRate = Math.max(0, baseline.pregnancyRate + crDiff * factor);

    // Economic Base
    const baseRevenue = baseline.totalDailyMilk * defaultBaselineParameters.economics.milkPrice;
    const baseTotalFeedCost = baseline.totalAnimals * baseline.feedCostPerHead;
    const baseEconDaily = baseRevenue - baseTotalFeedCost - (baseline.costPerLiter * baseline.totalDailyMilk * 0.4); 
    
    const scenEconDaily = revenue - newTotalFeedCost - (baseline.costPerLiter * baseline.totalDailyMilk * parameters.economics.vetCostIndex * 0.4);
    const dailyEconDelta = scenEconDaily - baseEconDaily;
    const totalEconomicEffect = dailyEconDelta * 30.4; // Monthly effect

    forecasts.push({
      month,
      kpi: {
        totalAnimals: Math.round(newTotalAnimals),
        milkingCows: Math.round(newMilkingCows),
        averageMilkPerCow: Math.round(newAvgMilk * 10) / 10,
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
  const insights = generateInsights(baseline, finalKpi, parameters, timeHorizon);
  const impactTable = generateImpactTable(baseline, finalKpi, parameters);

  return {
    scenarioId,
    baselineKpi: baseline,
    forecasts,
    insights,
    impactTable,
  };
}

function generateInsights(
  base: KPIValues,
  scen: KPIValues,
  p: ScenarioParameters,
  horizon: number
): ScenarioExplanation[] {
  const insights: ScenarioExplanation[] = [];
  
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

  const densityDiff = p.groups.stockingDensity - 100;
  if (densityDiff > 5) {
    insights.push({
      type: 'risk',
      title: 'Скученность',
      description: `Высокая плотность посадки (${p.groups.stockingDensity}%) приведет к стрессу, болезням и падению продуктивности.`
    });
  }

  const crDiff = p.reproduction.conceptionRate - defaultBaselineParameters.reproduction.conceptionRate;
  if (crDiff > 5 && horizon > 3) {
    insights.push({
      type: 'recommendation',
      title: 'Отличный воспроизводственный тренд',
      description: `Рост Conception Rate начнет приводить к увеличению поголовья со 2-го полугодия.`
    });
  }

  const accuracyDiff = p.feeding.feedingAccuracy - defaultBaselineParameters.feeding.feedingAccuracy;
  if (accuracyDiff > 2) {
    insights.push({
      type: 'recommendation',
      title: 'Оптимизация кормления',
      description: `Рост точности кормления повысит кормовую эффективность и снизит потерю ингредиентов.`
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'recommendation',
      title: 'Нет существенных сдвигов',
      description: `Параметры близки к базовым. Попробуйте агрессивнее изменить состав рациона или экономику.`
    });
  }

  return insights.slice(0, 4); // return max 4 top insights
}

function generateImpactTable(
  base: KPIValues,
  scen: KPIValues,
  p: ScenarioParameters
): ScenarioFactorImpact[] {
  return []; // Replaced by insights directly per mockup
}
