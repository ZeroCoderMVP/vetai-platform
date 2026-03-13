// =============================================
// Сервис данных — централизованная загрузка 
// всех данных с фермы для фронтенда
// =============================================

import path from 'path';
import { parseAfimilkDirectory, getAfimilkSummary } from './parsers/afimilk';
import { parseAICDirectory, getAICSummary } from './parsers/aic';

// Путь к данным (относительно корня проекта)
const DATA_ROOT = path.resolve(process.cwd(), '..');

// --- In-memory cache (TTL 60 секунд) ---
let _cache: { data: ReturnType<typeof _loadAllFarmData>; ts: number } | null = null;
const CACHE_TTL = 60_000; // 60 секунд

export function loadAllFarmData() {
  const now = Date.now();
  if (_cache && (now - _cache.ts) < CACHE_TTL) {
    return _cache.data;
  }
  const data = _loadAllFarmData();
  _cache = { data, ts: now };
  return data;
}

function _loadAllFarmData() {
  // Загружаем данные Afimilk
  const afiDir = path.join(DATA_ROOT, 'AFI');
  const afimilkData = parseAfimilkDirectory(afiDir);
  const afimilkSummary = getAfimilkSummary(afimilkData);

  // Загружаем данные AIC (доение)
  const milkingDir = path.join(DATA_ROOT, 'Дойка');
  const milkingRecords = parseAICDirectory(milkingDir);
  const milkingSummary = getAICSummary(milkingRecords);

  // Формируем сводные KPI
  const kpi = {
    // Молоко
    totalMilkToday: milkingSummary.totalYield,
    averageMilkPerCow: milkingSummary.averageYield,
    milkingCows: milkingSummary.totalCows,
    milkDate: milkingSummary.date,

    // Стадо (из Afimilk)
    herdAlerts: afimilkSummary.totalAlerts,
    healthIssues: afimilkSummary.totalHealthIssues,
    heatSuspects: afimilkSummary.totalHeatSuspects,
    toBreed: afimilkSummary.totalToBreed,
    calving: afimilkSummary.totalCalving,
    freshCows: afimilkSummary.totalFreshCows,
    mastitisSuspects: afimilkSummary.totalMastitisSuspects,
    ketosisSuspects: afimilkSummary.totalKetosisSuspects,
    abortionSuspects: afimilkSummary.totalAbortionSuspects,
    digestionProblems: afimilkSummary.totalDigestionProblems,

    // Время обновления
    lastUpdate: afimilkSummary.lastUpdate || milkingSummary.date,
  };

  // Собираем уникальный список коров из всех источников
  const cowSet = new Set<string>();
  
  if (afimilkData.heatSuspects) afimilkData.heatSuspects.items.forEach(i => cowSet.add(i.cow));
  if (afimilkData.animalsToBreed) afimilkData.animalsToBreed.items.forEach(i => cowSet.add(i.cow));
  if (afimilkData.healthIssues) afimilkData.healthIssues.items.forEach(i => cowSet.add(i.cow));
  if (afimilkData.digestionProblems) afimilkData.digestionProblems.items.forEach(i => cowSet.add(i.cow));
  if (afimilkData.calvingAnimals) afimilkData.calvingAnimals.items.forEach(i => cowSet.add(i.cow));
  if (afimilkData.mastitisSuspects) afimilkData.mastitisSuspects.items.forEach(i => cowSet.add(i.cow));
  if (afimilkData.ketosisSuspects) afimilkData.ketosisSuspects.items.forEach(i => cowSet.add(i.cow));
  if (afimilkData.abortionSuspects) afimilkData.abortionSuspects.items.forEach(i => cowSet.add(i.cow));
  if (afimilkData.freshCows) afimilkData.freshCows.items.forEach(i => cowSet.add(i.cow));
  milkingRecords.forEach(r => { if (r.cowNumber !== '0') cowSet.add(r.cowNumber); });

  return {
    kpi,
    afimilk: afimilkData,
    afimilkSummary,
    milkingRecords,
    milkingSummary,
    totalAnimals: cowSet.size,
    allCowNumbers: Array.from(cowSet).sort((a, b) => parseInt(a) - parseInt(b)),
  };
}

export type FarmData = ReturnType<typeof loadAllFarmData>;
