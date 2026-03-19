// =============================================
// ВЕТАИ Platform — Deterministic Mock Data Generator
// Realistic dairy-farm data for all pages & KPIs
// =============================================

import type {
  AfimilkListItem,
  AfimilkData,
  AfimilkSummary,
  MilkingRecord,
  MilkingSummary,
  FarmKPI,
  FarmDataResponse,
  DashboardFeedGroup,
  DashboardDaily,
  DashboardEvent,
  DashboardResponse,
} from './types';

// ---- Seeded PRNG (mulberry32) for deterministic output ----
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(2024_03_13);

function randBetween(min: number, max: number): number {
  return min + rand() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(randBetween(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

// ---- Date helpers ----
const TODAY = '2026-03-13';
const TODAY_DATE = new Date(TODAY);

function daysAgo(n: number): string {
  const d = new Date(TODAY_DATE);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function timeStr(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}`;
}

// ---- Group definitions ----
interface GroupDef {
  id: number;
  name: string;
  type: string;
  targetCows: number;
}

const GROUPS: GroupDef[] = [
  { id: 1, name: 'Высокоудойные', type: 'Дойные', targetCows: 15 },
  { id: 2, name: 'Среднеудойные', type: 'Дойные', targetCows: 15 },
  { id: 3, name: 'Сухостойные',   type: 'Сухостой', targetCows: 8 },
  { id: 4, name: 'Нетели',        type: 'Молодняк', targetCows: 8 },
  { id: 5, name: 'Новотельные',   type: 'Дойные', targetCows: 7 },
  { id: 6, name: 'Транзитные',    type: 'Сухостой', targetCows: 7 },
];

// ---- Generate cows ----

interface CowDef {
  number: string;
  regNumber: string;
  group: number;
  breed: string;
  birthDate: string;
  lactation: number;
  dim: number;
  status: string;
  gynStatus: string;
  ageInMonths: number;
  avgYield: number;       // кг/session (value in cow-units, report×1000)
  sccBaseline: number;
}

function generateCows(): CowDef[] {
  const cows: CowDef[] = [];
  let cowNum = 1;
  const usedNumbers = new Set<number>();

  // Helper to pick a unique cow number
  function nextCowNumber(): number {
    while (usedNumbers.has(cowNum)) cowNum++;
    usedNumbers.add(cowNum);
    return cowNum++;
  }

  for (const group of GROUPS) {
    for (let i = 0; i < group.targetCows; i++) {
      const num = group.id === 1 && i === 0 ? 21 : nextCowNumber(); // Ensure cow #21 is in group 1
      if (num === 21) usedNumbers.add(21);
      const breed = rand() < 0.80 ? 'Голштинская' : rand() < 0.75 ? 'Симментальская' : 'Джерсейская';
      const ageMonths = group.type === 'Молодняк' ? randBetween(16, 24) : randBetween(28, 84);
      const lactation = group.type === 'Молодняк' ? 0 : randInt(1, 5);

      let dim: number, status: string, gynStatus: string, avgYield: number;

      if (group.id === 1) {
        // High-yield milking
        dim = randInt(30, 200);
        status = 'Дойная';
        gynStatus = rand() < 0.5 ? 'Стельная' : 'Осеменена';
        avgYield = randBetween(28, 38);
      } else if (group.id === 2) {
        // Mid-yield milking
        dim = randInt(100, 350);
        status = 'Дойная';
        gynStatus = rand() < 0.6 ? 'Стельная' : 'Открыта';
        avgYield = randBetween(18, 28);
      } else if (group.id === 3) {
        // Dry cows
        dim = 0;
        status = 'Сухостойная';
        gynStatus = 'Стельная';
        avgYield = 0;
      } else if (group.id === 4) {
        // Heifers
        dim = 0;
        status = 'Нетель';
        gynStatus = rand() < 0.5 ? 'Стельная' : 'Открыта';
        avgYield = 0;
      } else if (group.id === 5) {
        // Fresh cows
        dim = randInt(1, 21);
        status = 'Дойная';
        gynStatus = 'Открыта';
        avgYield = randBetween(20, 32);
      } else {
        // Transition
        dim = 0;
        status = 'Транзитная';
        gynStatus = 'Стельная';
        avgYield = 0;
      }

      const sccBaseline = status === 'Дойная' ? randBetween(60, 250) : 0;

      // Override Cow #21 flagship
      if (num === 21) {
        cows.push({
          number: '21',
          regNumber: 'RU-077-0021-4892',
          group: 1,
          breed: 'Голштинская',
          birthDate: '2022-06-15',
          lactation: 3,
          dim: 145,
          status: 'Дойная',
          gynStatus: 'Стельная',
          ageInMonths: 45,
          avgYield: 33.5,
          sccBaseline: 155,
        });
        continue;
      }

      cows.push({
        number: String(num),
        regNumber: `RU-077-${String(num).padStart(4, '0')}-${randInt(1000, 9999)}`,
        group: group.id,
        breed,
        birthDate: daysAgo(Math.round(ageMonths * 30.44)),
        lactation,
        dim,
        status,
        gynStatus,
        ageInMonths: Math.round(ageMonths * 10) / 10,
        avgYield,
        sccBaseline,
      });
    }
  }

  return cows;
}

const ALL_COWS = generateCows();

// ---- Generate Afimilk list items ----

function toAfimilkItem(cow: CowDef, overrides?: Partial<AfimilkListItem>): AfimilkListItem {
  return {
    cow: cow.number,
    registrationNumber: cow.regNumber,
    group: cow.group,
    status: cow.status,
    gynStatus: cow.gynStatus,
    lactationNumber: cow.lactation,
    dim: cow.dim,
    ageInMonths: cow.ageInMonths,
    dailyAverageYield: cow.avgYield > 0 ? Math.round(cow.avgYield * 1000) : null, // AfiFarm reports in grams
    ...overrides,
  };
}

function buildAfimilkData(): AfimilkData {
  const milkingCows = ALL_COWS.filter(c => c.status === 'Дойная');
  const freshCowList = ALL_COWS.filter(c => c.group === 5);
  const dryCows = ALL_COWS.filter(c => c.status === 'Сухостойная' || c.status === 'Транзитная');

  // Health issues — cows with yield deviation
  const healthItems: AfimilkListItem[] = [];
  for (const c of milkingCows.slice(0, 8)) {
    const dev = c.number === '21' ? -12 : randBetween(-45, 5);
    healthItems.push(toAfimilkItem(c, {
      yieldLast24H: Math.round(c.avgYield * (1 + dev / 100) * 1000),
      yieldLast24HPercent: Math.round(dev),
      productionRateDeviationS1: Math.round(randBetween(-30, 10)),
      restTimeDeviationS3: Math.round(randBetween(-20, 20)),
    }));
  }

  // Heat suspects
  const heatCows = milkingCows.filter(c => c.gynStatus === 'Открыта' || c.gynStatus === 'Охота').slice(0, 5);
  const heatItems: AfimilkListItem[] = heatCows.map(c => toAfimilkItem(c, {
    gynStatus: 'Охота',
    heatIndicatorS1: Math.round(randBetween(40, 180)),
    heatIndicatorS3: Math.round(randBetween(30, 150)),
    daysAfterHeat: randInt(0, 3),
    daysAfterInsemination: null,
    inseminationNumber: randInt(0, 3),
  }));

  // Animals to breed
  const breedCows = milkingCows.filter(c => c.gynStatus === 'Открыта' && !heatCows.includes(c)).slice(0, 4);
  const breedItems: AfimilkListItem[] = breedCows.map(c => toAfimilkItem(c, {
    heatIndicatorS1: Math.round(randBetween(80, 200)),
    heatIndicatorS3: Math.round(randBetween(60, 160)),
    daysAfterHeat: randInt(0, 1),
    inseminationNumber: randInt(0, 2),
    inHeatStarted: `${daysAgo(randInt(0, 1))} ${randInt(2, 18)}:${String(randInt(0, 59)).padStart(2, '0')}`,
  }));

  // Calving — dry cows about to calve
  const calvingItems: AfimilkListItem[] = dryCows.slice(0, 4).map(c => toAfimilkItem(c));

  // Fresh cows
  const freshItems: AfimilkListItem[] = freshCowList.map(c => toAfimilkItem(c));

  // Mastitis suspects
  const mastitisCows = milkingCows.filter(c => c.sccBaseline > 200).slice(0, 3);
  const mastitisItems: AfimilkListItem[] = mastitisCows.map(c => toAfimilkItem(c));
  // Ensure cow #21 has a mild mastitis watch
  if (!mastitisItems.find(i => i.cow === '21')) {
    const cow21 = ALL_COWS.find(c => c.number === '21')!;
    mastitisItems.push(toAfimilkItem(cow21));
  }

  // Ketosis suspects
  const ketosisCows = freshCowList.filter(c => c.dim < 14).slice(0, 2);
  const ketosisItems: AfimilkListItem[] = ketosisCows.map(c => toAfimilkItem(c));

  // Digestion problems
  const digestionCows = milkingCows.slice(5, 8);
  const digestionItems: AfimilkListItem[] = digestionCows.map(c => toAfimilkItem(c));

  // Abortion suspects
  const abortionCow = milkingCows.find(c => c.gynStatus === 'Осеменена' && c.number !== '21');
  const abortionItems: AfimilkListItem[] = abortionCow
    ? [toAfimilkItem(abortionCow, { gynStatus: 'Стельная', inseminationNumber: 2 })]
    : [];

  // Lameness
  const lamenessCows = milkingCows.slice(10, 12);
  const lamenessItems: AfimilkListItem[] = lamenessCows.map(c => toAfimilkItem(c));

  return {
    healthIssues:     { title: 'Non Specific Health', items: healthItems },
    heatSuspects:     { title: 'Heat Suspects', items: heatItems },
    animalsToBreed:   { title: 'Animals to breed', items: breedItems },
    calvingAnimals:   { title: 'Calving Animals', items: calvingItems },
    freshCows:        { title: 'Fresh Cows', items: freshItems },
    mastitisSuspects: { title: 'Clinical Mastitis', items: mastitisItems },
    ketosisSuspects:  { title: 'Ketosis Suspects', items: ketosisItems },
    digestionProblems:{ title: 'Digestion Problems', items: digestionItems },
    abortionSuspects: { title: 'Abortion Suspects', items: abortionItems },
    lamenessSuspects: { title: 'Lameness Suspects', items: lamenessItems },
  };
}

// ---- Milking records ----

function buildMilkingRecords(): MilkingRecord[] {
  const records: MilkingRecord[] = [];
  const milkingCows = ALL_COWS.filter(c => c.status === 'Дойная');

  // Generate 3 sessions for today
  const sessionTimes = [
    { session: 1, baseHour: 5, label: 'Утренняя' },
    { session: 2, baseHour: 13, label: 'Дневная' },
    { session: 3, baseHour: 20, label: 'Вечерняя' },
  ];

  for (const cow of milkingCows) {
    for (const s of sessionTimes) {
      const baseYield = cow.avgYield;
      if (baseYield <= 0) continue;

      // Session-specific yield distribution: morning ~40%, midday ~30%, evening ~30%
      const sessionFactor = s.session === 1 ? 0.40 : s.session === 2 ? 0.30 : 0.30;
      const sessionYield = Math.round((baseYield * 3 * sessionFactor + randBetween(-1.5, 1.5)) * 10) / 10;

      const scc = Math.round(cow.sccBaseline + randBetween(-30, 30));
      const h = s.baseHour + randInt(0, 2);
      const m = randInt(0, 59);

      records.push({
        cowNumber: cow.number,
        stall: `${cow.group}-${String(randInt(1, 20)).padStart(2, '0')}`,
        milkingNumber: s.session,
        date: TODAY,
        time: timeStr(h, m),
        yield: Math.max(0.5, sessionYield),
        duration: Math.round(randBetween(4, 9) * 10) / 10,
        completeness: Math.round(randBetween(88, 100)),
        conductivity: Math.round(randBetween(4.5, 7.5) * 10) / 10,
        scc: Math.max(10, scc),
      });
    }
  }

  // Add 30-day history for Cow #21
  const cow21 = ALL_COWS.find(c => c.number === '21')!;
  for (let day = 1; day <= 90; day++) {
    const dateStr = daysAgo(day);
    for (const s of sessionTimes) {
      const dayOffset = (90 - day) / 90; // 0 = oldest, 1 = newest
      const baseYield = cow21.avgYield * (0.9 + 0.1 * dayOffset); // slight upward trend
      const sessionFactor = s.session === 1 ? 0.40 : 0.30;
      const sessionYield = Math.round((baseYield * 3 * sessionFactor + randBetween(-2, 2)) * 10) / 10;
      const scc = Math.round(cow21.sccBaseline + day * 2.3 + randBetween(-15, 15)); // SCC trending up going back

      records.push({
        cowNumber: '21',
        stall: `1-${String(randInt(1, 20)).padStart(2, '0')}`,
        milkingNumber: s.session,
        date: dateStr,
        time: timeStr(s.baseHour + randInt(0, 2), randInt(0, 59)),
        yield: Math.max(0.5, sessionYield),
        duration: Math.round(randBetween(5, 8) * 10) / 10,
        completeness: Math.round(randBetween(92, 100)),
        conductivity: Math.round(randBetween(5.0, 6.8) * 10) / 10,
        scc: Math.max(10, scc),
      });
    }
  }

  return records;
}

// ---- Milking summary ----

function buildMilkingSummary(records: MilkingRecord[]): MilkingSummary {
  const todayRecords = records.filter(r => r.date === TODAY && r.cowNumber !== '0' && r.yield > 0);
  const totalYield = Math.round(todayRecords.reduce((s, r) => s + r.yield, 0) * 10) / 10;
  const cowSet = new Set(todayRecords.map(r => r.cowNumber));
  const avgYield = cowSet.size > 0 ? Math.round((totalYield / cowSet.size) * 10) / 10 : 0;

  let normal = 0, elevated = 0, high = 0;
  // Per-cow SCC average
  const cowSCC = new Map<string, number[]>();
  for (const r of todayRecords) {
    if (!cowSCC.has(r.cowNumber)) cowSCC.set(r.cowNumber, []);
    cowSCC.get(r.cowNumber)!.push(r.scc);
  }
  for (const sccs of cowSCC.values()) {
    const avg = sccs.reduce((a, b) => a + b, 0) / sccs.length;
    if (avg < 200) normal++;
    else if (avg < 400) elevated++;
    else high++;
  }

  return {
    totalYield,
    averageYield: avgYield,
    totalCows: cowSet.size,
    date: TODAY,
    bySCC: { normal, elevated, high },
  };
}

// ---- Build farm KPI ----

function buildFarmKPI(afimilk: AfimilkData, milkingSummary: MilkingSummary): FarmKPI {
  return {
    totalMilkToday: milkingSummary.totalYield,
    averageMilkPerCow: milkingSummary.averageYield,
    milkingCows: milkingSummary.totalCows,
    milkDate: TODAY,
    herdAlerts:
      (afimilk.healthIssues?.items.length || 0) +
      (afimilk.mastitisSuspects?.items.length || 0) +
      (afimilk.ketosisSuspects?.items.length || 0),
    healthIssues: afimilk.healthIssues?.items.length || 0,
    heatSuspects: afimilk.heatSuspects?.items.length || 0,
    toBreed: afimilk.animalsToBreed?.items.length || 0,
    calving: afimilk.calvingAnimals?.items.length || 0,
    freshCows: afimilk.freshCows?.items.length || 0,
    mastitisSuspects: afimilk.mastitisSuspects?.items.length || 0,
    ketosisSuspects: afimilk.ketosisSuspects?.items.length || 0,
    abortionSuspects: afimilk.abortionSuspects?.items.length || 0,
    digestionProblems: afimilk.digestionProblems?.items.length || 0,
    lastUpdate: TODAY,
  };
}

// ---- Build Afimilk summary ----

function buildAfimilkSummary(afimilk: AfimilkData): AfimilkSummary {
  return {
    totalAlerts:
      (afimilk.healthIssues?.items.length || 0) +
      (afimilk.mastitisSuspects?.items.length || 0) +
      (afimilk.ketosisSuspects?.items.length || 0),
    totalHealthIssues: afimilk.healthIssues?.items.length || 0,
    totalHeatSuspects: afimilk.heatSuspects?.items.length || 0,
    totalToBreed: afimilk.animalsToBreed?.items.length || 0,
    totalCalving: afimilk.calvingAnimals?.items.length || 0,
    totalFreshCows: afimilk.freshCows?.items.length || 0,
    totalMastitisSuspects: afimilk.mastitisSuspects?.items.length || 0,
    totalKetosisSuspects: afimilk.ketosisSuspects?.items.length || 0,
    totalAbortionSuspects: afimilk.abortionSuspects?.items.length || 0,
    totalDigestionProblems: afimilk.digestionProblems?.items.length || 0,
    lastUpdate: TODAY,
  };
}

// =============================================
// PUBLIC API: getMockFarmData()
// =============================================

let _cachedFarm: FarmDataResponse | null = null;

export function getMockFarmData(): FarmDataResponse {
  if (_cachedFarm) return _cachedFarm;

  const afimilk = buildAfimilkData();
  const milkingRecords = buildMilkingRecords();
  const milkingSummary = buildMilkingSummary(milkingRecords);
  const kpi = buildFarmKPI(afimilk, milkingSummary);
  const afimilkSummary = buildAfimilkSummary(afimilk);

  const allCowNumbers = ALL_COWS
    .map(c => c.number)
    .sort((a, b) => parseInt(a) - parseInt(b));

  _cachedFarm = {
    kpi,
    afimilk,
    afimilkSummary,
    milkingRecords,
    milkingSummary,
    totalAnimals: ALL_COWS.length,
    allCowNumbers,
  };

  return _cachedFarm;
}

// =============================================
// PUBLIC API: getMockDashboardData()
// =============================================

let _cachedDashboard: DashboardResponse | null = null;

export function getMockDashboardData(): DashboardResponse {
  if (_cachedDashboard) return _cachedDashboard;

  const farmData = getMockFarmData();

  // Feed groups
  const groups: DashboardFeedGroup[] = GROUPS.map(g => {
    const headCount = ALL_COWS.filter(c => c.group === g.id).length;
    const plannedPerHead = g.type === 'Дойные' ? randBetween(45, 55) : g.type === 'Молодняк' ? randBetween(20, 30) : randBetween(30, 40);
    const planned = Math.round(plannedPerHead * headCount);
    const efficiency = Math.round(randBetween(94, 99.5) * 10) / 10;
    const actual = Math.round(planned * efficiency / 100);
    const remainder = planned - actual;
    const iofc = g.type === 'Дойные' ? Math.round(randBetween(80, 250)) : null;
    const feedCost = Math.round(randBetween(180, 320));

    return {
      name: g.name,
      planned,
      actual,
      remainder,
      headCount,
      iofc,
      feedCost,
      groupType: g.type,
      efficiency,
      count: randInt(28, 35),
    };
  });

  const totalPlanned = groups.reduce((s, g) => s + g.planned, 0);
  const totalActual = groups.reduce((s, g) => s + g.actual, 0);
  const totalRemainder = groups.reduce((s, g) => s + g.remainder, 0);
  const totalDryMatter = Math.round(totalActual * 0.42);
  const efficiency = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 1000) / 10 : 0;
  const totalHeadCount = groups.reduce((s, g) => s + g.headCount, 0);
  const iofcGroups = groups.filter(g => g.iofc !== null);
  const avgIOFC = iofcGroups.length > 0 ? Math.round(iofcGroups.reduce((s, g) => s + (g.iofc || 0), 0) / iofcGroups.length) : null;
  const totalFeedCost = groups.reduce((s, g) => s + (g.feedCost || 0) * g.headCount, 0);

  // Daily data (90 days)
  const daily: DashboardDaily[] = [];
  for (let i = 89; i >= 0; i--) {
    const dayPlanned = Math.round(totalPlanned / 30 + randBetween(-200, 200));
    const dayEff = randBetween(0.93, 0.99);
    const dayActual = Math.round(dayPlanned * dayEff);
    daily.push({
      date: daysAgo(i),
      planned: dayPlanned,
      actual: dayActual,
      remainder: dayPlanned - dayActual,
    });
  }

  // Events from afimilk alerts
  const events: DashboardEvent[] = [];
  let eventId = 1;

  for (const item of farmData.afimilk.mastitisSuspects?.items || []) {
    events.push({
      id: `mock-evt-${eventId++}`,
      title: 'Подозрение на мастит',
      description: `Корова #${item.cow} · Группа ${item.group} · DIM ${item.dim}`,
      severity: 'critical',
      timestamp: `${TODAY}T08:00:00Z`,
    });
  }
  for (const item of farmData.afimilk.ketosisSuspects?.items || []) {
    events.push({
      id: `mock-evt-${eventId++}`,
      title: 'Подозрение на кетоз',
      description: `Корова #${item.cow} · DIM ${item.dim}`,
      severity: 'warning',
      timestamp: `${TODAY}T07:30:00Z`,
    });
  }
  for (const item of (farmData.afimilk.healthIssues?.items || []).slice(0, 3)) {
    events.push({
      id: `mock-evt-${eventId++}`,
      title: 'Снижение продуктивности',
      description: `Корова #${item.cow} · ${item.yieldLast24HPercent}% от нормы`,
      severity: 'warning',
      timestamp: `${TODAY}T06:00:00Z`,
    });
  }
  for (const item of (farmData.afimilk.heatSuspects?.items || []).slice(0, 3)) {
    events.push({
      id: `mock-evt-${eventId++}`,
      title: 'Обнаружена охота',
      description: `Корова #${item.cow} · Индикатор S1: ${item.heatIndicatorS1}`,
      severity: 'info',
      timestamp: `${daysAgo(1)}T22:00:00Z`,
    });
  }
  events.push({
    id: `mock-evt-${eventId++}`,
    title: 'Отёл завершён',
    description: 'Корова #41 · Тёлочка · 38 кг',
    severity: 'info',
    timestamp: `${daysAgo(2)}T14:30:00Z`,
  });
  events.push({
    id: `mock-evt-${eventId++}`,
    title: 'Импорт DTM данных',
    description: '35 записей загружено',
    severity: 'info',
    timestamp: `${daysAgo(1)}T09:00:00Z`,
  });

  _cachedDashboard = {
    feeding: {
      totalPlanned,
      totalActual,
      totalRemainder,
      totalDryMatter,
      efficiency,
      avgIOFC,
      totalFeedCost: Math.round(totalFeedCost),
      totalHeadCount,
      recordCount: groups.reduce((s, g) => s + g.count, 0),
      groupCount: groups.length,
    },
    milking: {
      totalYield: farmData.milkingSummary.totalYield,
      avgYield: farmData.milkingSummary.averageYield,
      cowCount: farmData.milkingSummary.totalCows,
      recordCount: farmData.milkingRecords.filter(r => r.date === TODAY).length,
    },
    groups,
    daily,
    mixBatches: 12,
    ingredients: 18,
    events,
  };

  return _cachedDashboard;
}
