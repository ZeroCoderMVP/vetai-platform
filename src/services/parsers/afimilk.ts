// =============================================
// Парсер данных Afimilk JSON API
// =============================================

import fs from 'fs';
import path from 'path';

// --- Типы данных Afimilk ---

export interface AfimilkReport<T> {
  apiVersion: string;
  reportName: string;
  lastUpdate: string;
  items: T[];
}

export interface HeatSuspect {
  cow: string;
  registrationNumber: string;
  group: number;
  gynStatus: string;
  lactationNumber: number;
  inseminationNumber: number | null;
  ageInMonths: number;
  dim: number;
  daysAfterHeat: number | null;
  daysAfterInsemination: number | null;
  heatIndicatorS1: number | null;
  heatIndicatorS2: number | null;
  heatIndicatorS3: number | null;
  heatIndicatorS4: number | null;
  heatIndicatorS5: number | null;
}

export interface AnimalToBreed {
  cow: string;
  registrationNumber: string;
  group: number;
  status: string;
  lactationNumber: number;
  inseminationNumber: number | null;
  age: number;
  dim: number;
  dailyAverageYield: number;
  daysAfterHeat: number | null;
  daysAfterInsemination: number | null;
  inHeatStarted: string | null;
  inHeatEnded: string | null;
  heatIndicatorS1: number | null;
  heatIndicatorS2: number | null;
  heatIndicatorS3: number | null;
  heatIndicatorS4: number | null;
  heatIndicatorS5: number | null;
  daysAfterGroupChange: number | null;
  daysAfterHoofTrimming: number | null;
  destineTreatment: string | null;
}

export interface HealthIssue {
  cow: string;
  registrationNumber: string;
  group: number;
  status: string;
  lactationNumber: number;
  dim: number;
  dailyAverageYield: number | null;
  productionRateDeviationS1: number | null;
  productionRateDeviationS2: number | null;
  productionRateDeviationS3: number | null;
  productionRateDeviationS4: number | null;
  productionRateDeviationS5: number | null;
  heatIndicatorS1: number | null;
  heatIndicatorS2: number | null;
  heatIndicatorS3: number | null;
  heatIndicatorS4: number | null;
  heatIndicatorS5: number | null;
  restTimeDeviationS1: number | null;
  restTimeDeviationS2: number | null;
  restTimeDeviationS3: number | null;
  restTimeDeviationS4: number | null;
  restTimeDeviationS5: number | null;
  yieldLast24H: number | null;
  yieldLast24HPercent: number | null;
  currentRuminationTimeDeviation: number | null;
  currentEatingTimeDeviation: number | null;
}

export interface DigestionProblem {
  cow: string;
  registrationNumber: string;
  group: number;
  status: string;
  lactationNumber: number;
  dim: number;
  dailyAverageYield: number | null;
  ruminationTimeDeviation: number | null;
  eatingTimeDeviation: number | null;
}

export interface CalvingAnimal {
  cow: string;
  registrationNumber: string;
  group: number;
  expectedCalvingDate: string | null;
  daysToCalving: number | null;
  lactationNumber: number;
}

export interface MastitisSuspect {
  cow: string;
  registrationNumber: string;
  group: number;
  lactationNumber: number;
  dim: number;
}

export interface KetosisSuspect {
  cow: string;
  registrationNumber: string;
  group: number;
  lactationNumber: number;
  dim: number;
  dailyAverageYield: number | null;
}

export interface AbortionSuspect {
  cow: string;
  registrationNumber: string;
  group: number;
  gynStatus: string;
  lactationNumber: number;
  inseminationNumber: number | null;
  dim: number;
}

export interface FreshCow {
  cow: string;
  registrationNumber: string;
  group: number;
  lactationNumber: number;
  dim: number;
}

// --- Функции парсинга ---

function parseJsonFile<T>(filePath: string): AfimilkReport<T> | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as AfimilkReport<T>;
  } catch (error) {
    console.error(`Ошибка парсинга ${filePath}:`, error);
    return null;
  }
}

export function parseAfimilkDirectory(dirPath: string) {
  const data = {
    heatSuspects: null as AfimilkReport<HeatSuspect> | null,
    animalsToBreed: null as AfimilkReport<AnimalToBreed> | null,
    healthIssues: null as AfimilkReport<HealthIssue> | null,
    digestionProblems: null as AfimilkReport<DigestionProblem> | null,
    calvingAnimals: null as AfimilkReport<CalvingAnimal> | null,
    mastitisSuspects: null as AfimilkReport<MastitisSuspect> | null,
    ketosisSuspects: null as AfimilkReport<KetosisSuspect> | null,
    abortionSuspects: null as AfimilkReport<AbortionSuspect> | null,
    freshCows: null as AfimilkReport<FreshCow> | null,
    lastUpdate: '',
  };

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const baseName = path.basename(file, '.json');

    switch (baseName) {
      case 'AnimalsSuspectedHeat':
        data.heatSuspects = parseJsonFile<HeatSuspect>(filePath);
        break;
      case 'AnimalsToBreed':
      case 'AnimalsToBreedPasture':
        if (!data.animalsToBreed) {
          data.animalsToBreed = parseJsonFile<AnimalToBreed>(filePath);
        } else {
          const more = parseJsonFile<AnimalToBreed>(filePath);
          if (more) data.animalsToBreed.items.push(...more.items);
        }
        break;
      case 'NonSpecificHealth':
        data.healthIssues = parseJsonFile<HealthIssue>(filePath);
        break;
      case 'DigestionProblems':
        data.digestionProblems = parseJsonFile<DigestionProblem>(filePath);
        break;
      case 'CalvingAnimals':
        data.calvingAnimals = parseJsonFile<CalvingAnimal>(filePath);
        break;
      case 'SuspectedClinicalMastitis':
        data.mastitisSuspects = parseJsonFile<MastitisSuspect>(filePath);
        break;
      case 'SuspectedKetosis':
        data.ketosisSuspects = parseJsonFile<KetosisSuspect>(filePath);
        break;
      case 'SuspectedAbortion':
        data.abortionSuspects = parseJsonFile<AbortionSuspect>(filePath);
        break;
      case 'FreshCowsToCheck':
        data.freshCows = parseJsonFile<FreshCow>(filePath);
        break;
    }
  }

  // Определяем самое свежее обновление
  const allReports = [
    data.heatSuspects, data.animalsToBreed, data.healthIssues,
    data.digestionProblems, data.calvingAnimals, data.mastitisSuspects,
    data.ketosisSuspects, data.abortionSuspects, data.freshCows,
  ].filter(Boolean);

  if (allReports.length > 0) {
    data.lastUpdate = allReports
      .map(r => r!.lastUpdate)
      .sort()
      .pop() || '';
  }

  return data;
}

// --- Агрегированная статистика ---

export function getAfimilkSummary(data: ReturnType<typeof parseAfimilkDirectory>) {
  return {
    totalHeatSuspects: data.heatSuspects?.items.length || 0,
    totalToBreed: data.animalsToBreed?.items.length || 0,
    totalHealthIssues: data.healthIssues?.items.length || 0,
    totalDigestionProblems: data.digestionProblems?.items.length || 0,
    totalCalving: data.calvingAnimals?.items.length || 0,
    totalMastitisSuspects: data.mastitisSuspects?.items.length || 0,
    totalKetosisSuspects: data.ketosisSuspects?.items.length || 0,
    totalAbortionSuspects: data.abortionSuspects?.items.length || 0,
    totalFreshCows: data.freshCows?.items.length || 0,
    lastUpdate: data.lastUpdate,
    totalAlerts: (data.healthIssues?.items.length || 0) +
                 (data.mastitisSuspects?.items.length || 0) +
                 (data.ketosisSuspects?.items.length || 0) +
                 (data.abortionSuspects?.items.length || 0),
  };
}
