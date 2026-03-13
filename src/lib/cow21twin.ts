// =============================================
// ВЕТАИ Platform — Cow #21 Digital Twin Data
// Extended data for the flagship animal card
// =============================================

// ---- Types for Digital Twin ----

export interface CowProfile {
  number: string;
  regNumber: string;
  electronicId: string;
  breed: string;
  bloodline: string;
  birthDate: string;
  weight: number;
  bcs: number;
  color: string;
  status: string;
  group: { id: number; name: string };
  lactation: number;
  dim: number;
  gynStatus: string;
  managementSummary: string;
}

export interface MilkingSession {
  date: string;
  session: number;
  yield: number;
  duration: number;
  completeness: number;
  conductivity: number;
  scc: number;
  stall: string;
  fatPercent: number;
  proteinPercent: number;
  lactosePercent: number;
}

export interface DailyMilkSummary {
  date: string;
  totalYield: number;
  sessions: number;
  avgSCC: number;
  avgConductivity: number;
  avgFat: number;
  avgProtein: number;
}

export interface HealthEvent {
  id: string;
  date: string;
  type: 'mastitis' | 'ketosis' | 'lameness' | 'metritis' | 'hypocalcemia' | 'vaccination' | 'deworming' | 'hoof_trim' | 'examination';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  treatment?: string;
  resolvedDate?: string;
  veterinarian?: string;
}

export interface BCSRecord {
  date: string;
  score: number;
  dim: number;
}

export interface ReproductionEvent {
  id: string;
  date: string;
  type: 'heat' | 'insemination' | 'pregnancy_check' | 'dry_off' | 'calving';
  title: string;
  description: string;
  result?: string;
  sireId?: string;
  sireName?: string;
}

export interface CalvingRecord {
  date: string;
  lactation: number;
  calfSex: string;
  calfWeight: number;
  calfId: string;
  easeScore: number; // 1-5 (1=easy, 5=dystokia)
  notes: string;
}

export interface BreedingPlan {
  status: string;
  nextAction: string;
  nextActionDate: string;
  preferredSires: { id: string; name: string; breed: string; proof: number; reason: string }[];
  inseminationHistory: { date: string; sireId: string; sireName: string; result: string; technicianName: string }[];
  breedingValue: number;
  inbreedingCoeff: number;
}

export interface GeneticProfile {
  sire: { id: string; name: string; breed: string; proof: number; country: string };
  dam: { id: string; name: string; breed: string; milkYield: number };
  sireOfSire: { id: string; name: string };
  damOfSire: { id: string; name: string };
  sireOfDam: { id: string; name: string };
  damOfDam: { id: string; name: string };
  genomicIndices: {
    name: string;
    value: number;
    percentile: number;
    description: string;
  }[];
  breedComposition: { breed: string; percent: number }[];
}

export interface TimelineEvent {
  id: string;
  date: string;
  category: 'milking' | 'health' | 'reproduction' | 'management' | 'genetics';
  icon: string;
  title: string;
  description: string;
  severity?: 'info' | 'warning' | 'critical';
}

export interface InfographicData {
  lactationComparison: { lactation: number; peakYield: number; totalYield: number; avgDailyYield: number; days: number }[];
  radarScores: { axis: string; value: number; max: number }[];
  herdRankings: { metric: string; rank: number; total: number; percentile: number }[];
  monthlyTrends: { month: string; yield: number; scc: number; fat: number; protein: number }[];
  lifetimeStats: {
    totalMilk: number;
    totalCalvings: number;
    avgLactationDays: number;
    avgPeakYield: number;
    lifetimeSCC: number;
    daysInHerd: number;
    revenue: number;
  };
}

export interface DigitalTwinData {
  profile: CowProfile;
  milkingSessions: MilkingSession[];
  dailyMilkSummary: DailyMilkSummary[];
  healthEvents: HealthEvent[];
  bcsHistory: BCSRecord[];
  reproductionEvents: ReproductionEvent[];
  calvingHistory: CalvingRecord[];
  breedingPlan: BreedingPlan;
  genetics: GeneticProfile;
  timeline: TimelineEvent[];
  infographics: InfographicData;
}

// ---- Seeded PRNG ----
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(21_2026);
function rb(min: number, max: number) { return min + rand() * (max - min); }
function ri(min: number, max: number) { return Math.floor(rb(min, max + 1)); }
function r1(v: number) { return Math.round(v * 10) / 10; }

function daysAgo(n: number): string {
  const d = new Date('2026-03-13');
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

// =============================================
// BUILD COW #21 DIGITAL TWIN
// =============================================

function buildProfile(): CowProfile {
  return {
    number: '21',
    regNumber: 'RU-077-0021-4892',
    electronicId: 'RU-643-0077-00214892',
    breed: 'Голштинская',
    bloodline: 'O-Man × Shottle × Durham',
    birthDate: '2022-06-15',
    weight: 648,
    bcs: 3.25,
    color: 'чёрно-пёстрая',
    status: 'Дойная',
    group: { id: 1, name: 'Высокоудойные' },
    lactation: 3,
    dim: 145,
    gynStatus: 'Стельная',
    managementSummary: 'Высокопродуктивная корова в 3-й лактации, день доения 145. Стельность подтверждена (60 дней). Активное наблюдение за соматическими клетками — умеренное повышение проводимости на ЗЗ доле. Рекомендовано: контроль сом. клеток через 7 дней, плановое УЗИ через 30 дней.',
  };
}

function buildMilkingSessions(): MilkingSession[] {
  const sessions: MilkingSession[] = [];
  for (let day = 0; day <= 30; day++) {
    const dateStr = daysAgo(day);
    const dimAtDate = 145 - day;
    // Wood's curve: y = a * DIM^b * e^(-c * DIM)
    const woodsCurveDaily = 38 * Math.pow(dimAtDate, 0.18) * Math.exp(-0.003 * dimAtDate);
    
    for (let s = 1; s <= 3; s++) {
      const sessionFactor = s === 1 ? 0.40 : s === 2 ? 0.30 : 0.30;
      const sessionYield = r1(woodsCurveDaily * sessionFactor + rb(-1.2, 1.2));
      const baseSCC = 155 + day * 2.1; // recent trend up
      
      sessions.push({
        date: dateStr,
        session: s,
        yield: Math.max(2, sessionYield),
        duration: r1(rb(5.5, 7.8)),
        completeness: Math.round(rb(93, 100)),
        conductivity: r1(rb(5.2, 6.6) + (s === 1 && day < 5 ? rb(0, 0.4) : 0)),
        scc: Math.max(40, Math.round(baseSCC + rb(-25, 25))),
        stall: `1-${String(ri(3, 8)).padStart(2, '0')}`,
        fatPercent: r1(rb(3.4, 4.2)),
        proteinPercent: r1(rb(3.1, 3.5)),
        lactosePercent: r1(rb(4.6, 4.9)),
      });
    }
  }
  return sessions;
}

function buildDailySummary(sessions: MilkingSession[]): DailyMilkSummary[] {
  const byDate = new Map<string, MilkingSession[]>();
  sessions.forEach(s => {
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date)!.push(s);
  });
  return Array.from(byDate.entries())
    .map(([date, ss]) => ({
      date,
      totalYield: r1(ss.reduce((a, s) => a + s.yield, 0)),
      sessions: ss.length,
      avgSCC: Math.round(ss.reduce((a, s) => a + s.scc, 0) / ss.length),
      avgConductivity: r1(ss.reduce((a, s) => a + s.conductivity, 0) / ss.length),
      avgFat: r1(ss.reduce((a, s) => a + s.fatPercent, 0) / ss.length),
      avgProtein: r1(ss.reduce((a, s) => a + s.proteinPercent, 0) / ss.length),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildHealthEvents(): HealthEvent[] {
  return [
    {
      id: 'he-1', date: '2026-03-12', type: 'examination',
      title: 'Плановый осмотр ветеринара',
      description: 'Проведён клинический осмотр. Общее состояние удовлетворительное. Умеренное повышение проводимости на ЗЗ доле — рекомендовано наблюдение.',
      severity: 'info', veterinarian: 'Петров А.И.',
    },
    {
      id: 'he-2', date: '2026-03-10', type: 'mastitis',
      title: 'Подозрение на субклинический мастит',
      description: 'Повышение сом. клеток с 155 до 220 тыс/мл за 5 дней. Проводимость ЗЗ доля: 6.4 мСм. Калифорнийский тест: +/−',
      severity: 'warning',
      treatment: 'Наблюдение. Повторный анализ через 3 дня. При ухудшении — бак.посев.',
      veterinarian: 'Петров А.И.',
    },
    {
      id: 'he-3', date: '2026-02-15', type: 'hoof_trim',
      title: 'Обрезка копыт',
      description: 'Плановая обрезка копыт. Без патологий. Следующая через 3 месяца.',
      severity: 'info', resolvedDate: '2026-02-15',
    },
    {
      id: 'he-4', date: '2026-01-20', type: 'vaccination',
      title: 'Вакцинация — Комбовак-Р',
      description: 'Плановая вакцинация против ринотрахеита, вирусной диареи, парагриппа-3. Доза: 5 мл в/м.',
      severity: 'info', resolvedDate: '2026-01-20', veterinarian: 'Сидоров В.М.',
    },
    {
      id: 'he-5', date: '2025-11-30', type: 'deworming',
      title: 'Дегельминтизация — Ивермек',
      description: 'Плановая обработка Ивермек, 1 мл/50 кг. Повтор через 90 дней.',
      severity: 'info', resolvedDate: '2025-11-30',
    },
    {
      id: 'he-6', date: '2025-09-10', type: 'ketosis',
      title: 'Субклинический кетоз (лактация 2)',
      description: 'БГБ (бета-гидроксибутират) 1.4 ммоль/л на 8-й день лактации. Лечение: пропиленгликоль 300 мл × 5 дней.',
      severity: 'warning', resolvedDate: '2025-09-18',
      treatment: 'Пропиленгликоль 300 мл/день × 5 дней. Контроль БГБ на 14-й день лактации — норма (0.8).',
      veterinarian: 'Петров А.И.',
    },
    {
      id: 'he-7', date: '2024-11-05', type: 'mastitis',
      title: 'Клинический мастит ЗП доля (лактация 1)',
      description: 'Хлопья в молоке, отёк ЗП доли. Бак.посев: Staph. aureus. Лечение: Мастиет Форте.',
      severity: 'critical', resolvedDate: '2024-11-15',
      treatment: 'Мастиет Форте 3 тюбика × 3 дня. Байтрил 5 мг/кг × 3 дня. Полное выздоровление.',
      veterinarian: 'Петров А.И.',
    },
  ];
}

function buildBCSHistory(): BCSRecord[] {
  return [
    { date: '2025-09-02', score: 3.50, dim: 0 },   // At calving (lact 3)
    { date: '2025-09-16', score: 3.25, dim: 14 },
    { date: '2025-10-02', score: 3.00, dim: 30 },
    { date: '2025-10-30', score: 2.75, dim: 58 },   // Nadir
    { date: '2025-11-27', score: 2.75, dim: 86 },
    { date: '2025-12-25', score: 3.00, dim: 114 },
    { date: '2026-01-22', score: 3.00, dim: 142 },
    { date: '2026-02-19', score: 3.25, dim: 170 },  // Recovering
    { date: '2026-03-12', score: 3.25, dim: 145 },  // Today (approx)
  ];
}

function buildReproductionEvents(): ReproductionEvent[] {
  return [
    // Lactation 3
    {
      id: 're-1', date: '2026-02-10', type: 'pregnancy_check',
      title: 'УЗИ — стельность подтверждена',
      description: 'Плод визуализирован. Возраст плода ~30 дней. Одноплодная стельность.',
      result: 'Стельная', sireId: 'HO-840-003-206-547-142', sireName: 'LIGHTNING RIDGE'
    },
    {
      id: 're-2', date: '2026-01-12', type: 'insemination',
      title: '1-е осеменение (лактация 3)',
      description: 'Осеменение на 132-й день лактации. Техник: Иванов К.С. Реактивность: отличная.',
      sireId: 'HO-840-003-206-547-142', sireName: 'LIGHTNING RIDGE',
      result: 'Успех',
    },
    {
      id: 're-3', date: '2026-01-10', type: 'heat',
      title: 'Охота обнаружена',
      description: 'Индикатор охоты: 175. Яркая охота. Рекомендовано осеменение.',
    },
    // Calving into Lactation 3
    {
      id: 're-4', date: '2025-09-02', type: 'calving',
      title: 'Отёл — бычок 42 кг',
      description: 'Нормальный отёл без осложнений. Оценка лёгкости: 1 (лёгкий). Послед отошёл через 4 часа.',
    },
    // Lactation 2
    {
      id: 're-5', date: '2025-02-15', type: 'dry_off',
      title: 'Запуск (лактация 2)',
      description: 'Сухостойный период начат на 305-й день лактации. Сом. клетки на момент запуска: 120 тыс/мл.',
    },
    {
      id: 're-6', date: '2024-12-10', type: 'pregnancy_check',
      title: 'УЗИ — подтверждена стельность (лакт. 2)',
      description: 'Стельность 90 дней. Плод развивается нормально.',
      result: 'Стельная',
    },
    {
      id: 're-7', date: '2024-09-10', type: 'insemination',
      title: '2-е осеменение (лактация 2)',
      description: 'Повторное осеменение после неудачной первой попытки.',
      sireId: 'HO-840-003-142-301-855', sireName: 'DELTA LAMBDA',
      result: 'Успех',
    },
    {
      id: 're-8', date: '2024-08-20', type: 'insemination',
      title: '1-е осеменение (лактация 2)',
      description: '85-й день лактации. Осеменение не удалось — низкая яйцеклеточная подвижность.',
      sireId: 'HO-840-003-132-205-481', sireName: 'CROSBY',
      result: 'Неудача',
    },
    // Calving into Lactation 2
    {
      id: 're-9', date: '2024-05-28', type: 'calving',
      title: 'Отёл — тёлочка 36 кг',
      description: 'Нормальный отёл. Тёлка #245 — оставлена в стаде.',
    },
    // Lactation 1
    {
      id: 're-10', date: '2023-10-15', type: 'insemination',
      title: '1-е осеменение (лактация 1)',
      description: '90-й день лактации. Индикатор охоты: 160.',
      sireId: 'HO-840-003-142-301-855', sireName: 'DELTA LAMBDA',
      result: 'Успех',
    },
    {
      id: 're-11', date: '2023-07-18', type: 'calving',
      title: 'Первый отёл — тёлочка 34 кг',
      description: 'Трудный отёл (оценка 3). Пособие ветеринара. Тёлка #198.',
    },
  ];
}

function buildCalvingHistory(): CalvingRecord[] {
  return [
    { date: '2025-09-02', lactation: 3, calfSex: 'Бычок', calfWeight: 42, calfId: '#312', easeScore: 1, notes: 'Лёгкий отёл без осложнений. Послед 4ч.' },
    { date: '2024-05-28', lactation: 2, calfSex: 'Тёлочка', calfWeight: 36, calfId: '#245', easeScore: 1, notes: 'Нормальный отёл. Тёлка оставлена в стаде.' },
    { date: '2023-07-18', lactation: 1, calfSex: 'Тёлочка', calfWeight: 34, calfId: '#198', easeScore: 3, notes: 'Трудный отёл, ветеринарное пособие. Тёлка оставлена.' },
  ];
}

function buildBreedingPlan(): BreedingPlan {
  return {
    status: 'Стельная — 60 дней',
    nextAction: 'Контрольное УЗИ',
    nextActionDate: '2026-04-12',
    preferredSires: [
      { id: 'HO-840-003-218-765-390', name: 'PINNACLE', breed: 'Голштинская', proof: 2940, reason: 'Высокий индекс продуктивности, улучшение ног и вымени' },
      { id: 'HO-840-003-206-547-142', name: 'LIGHTNING RIDGE', breed: 'Голштинская', proof: 2870, reason: 'Текущий бык-отец. Проверен по потомству.' },
      { id: 'HO-840-003-230-890-456', name: 'ARISTOCRAT', breed: 'Голштинская', proof: 2810, reason: 'Улучшение здоровья вымени, низкие сом. клетки' },
    ],
    inseminationHistory: [
      { date: '2026-01-12', sireId: 'HO-840-003-206-547-142', sireName: 'LIGHTNING RIDGE', result: 'Стельная', technicianName: 'Иванов К.С.' },
      { date: '2024-09-10', sireId: 'HO-840-003-142-301-855', sireName: 'DELTA LAMBDA', result: 'Стельная', technicianName: 'Иванов К.С.' },
      { date: '2024-08-20', sireId: 'HO-840-003-132-205-481', sireName: 'CROSBY', result: 'Неуспех', technicianName: 'Волков П.П.' },
      { date: '2023-10-15', sireId: 'HO-840-003-142-301-855', sireName: 'DELTA LAMBDA', result: 'Стельная', technicianName: 'Иванов К.С.' },
    ],
    breedingValue: 2450,
    inbreedingCoeff: 6.2,
  };
}

function buildGenetics(): GeneticProfile {
  return {
    sire: { id: 'HO-840-003-142-301-855', name: 'DELTA LAMBDA', breed: 'Голштинская', proof: 2780, country: 'США' },
    dam: { id: 'RU-077-0089-3201', name: 'Зорька 89', breed: 'Голштинская', milkYield: 11200 },
    sireOfSire: { id: 'HO-840-003-009-279-481', name: 'O-MAN' },
    damOfSire: { id: 'HO-840-003-087-203-111', name: 'LAMBDA BEAUTY' },
    sireOfDam: { id: 'HO-840-003-075-501-322', name: 'SHOTTLE' },
    damOfDam: { id: 'RU-077-0032-1804', name: 'Вишня 32' },
    genomicIndices: [
      { name: 'Индекс общей продуктивности', value: 2450, percentile: 82, description: 'Комплексный селекционный индекс' },
      { name: 'Чистая прибыль', value: 724, percentile: 78, description: 'Экономическая ценность ($/лактация)' },
      { name: 'Молоко (перед. способность)', value: 1380, percentile: 85, description: 'Прогнозируемая передающая способность по молоку, кг' },
      { name: 'Жир (перед. способность)', value: 62, percentile: 75, description: 'Передающая способность по жиру, кг' },
      { name: 'Белок (перед. способность)', value: 48, percentile: 80, description: 'Передающая способность по белку, кг' },
      { name: 'Сом. клетки (балл)', value: 2.72, percentile: 70, description: 'Чем ниже, тем лучше (целевой < 3.0)' },
      { name: 'Продуктивное долголетие', value: 5.8, percentile: 88, description: 'Дополнительные месяцы продуктивной жизни' },
      { name: 'Стельность дочерей', value: 1.2, percentile: 65, description: 'Фертильность дочерей, % в цикле' },
      { name: 'Экстерьер (тип)', value: 1.85, percentile: 72, description: 'Оценка экстерьера (выше = лучший тип)' },
      { name: 'Индекс вымени', value: 2.10, percentile: 80, description: 'Составной индекс качества вымени' },
      { name: 'Индекс ног и копыт', value: 1.45, percentile: 68, description: 'Составной индекс ног и копыт' },
    ],
    breedComposition: [
      { breed: 'Голштинская', percent: 93.75 },
      { breed: 'Красная голштинская', percent: 3.125 },
      { breed: 'Швицкая', percent: 3.125 },
    ],
  };
}

function buildTimeline(): TimelineEvent[] {
  return [
    { id: 'tl-01', date: '2026-03-13', category: 'milking', icon: '🥛', title: 'Утреннее доение', description: 'Надой 13.8 кг · Сом. клетки 165 · Проводимость 5.8 мСм' },
    { id: 'tl-02', date: '2026-03-12', category: 'health', icon: '🩺', title: 'Плановый осмотр ветеринара', description: 'Состояние удовлетворительное. Наблюдение за сом. клетками.', severity: 'info' },
    { id: 'tl-03', date: '2026-03-10', category: 'health', icon: '⚠️', title: 'Подозрение на субклинический мастит', description: 'Сом. клетки рост 155→220. Проводимость ЗЗ: 6.4 мСм.', severity: 'warning' },
    { id: 'tl-04', date: '2026-02-19', category: 'management', icon: '📏', title: 'Оценка упитанности', description: 'Упитанность 3.25 — восстановление после пика лактации.' },
    { id: 'tl-05', date: '2026-02-15', category: 'health', icon: '✂️', title: 'Обрезка копыт', description: 'Плановая. Без патологий.' },
    { id: 'tl-06', date: '2026-02-10', category: 'reproduction', icon: '🔬', title: 'УЗИ — стельность подтверждена', description: 'Одноплодная стельность ~30 дней. Плод развивается нормально.' },
    { id: 'tl-07', date: '2026-01-22', category: 'management', icon: '📏', title: 'Оценка упитанности', description: 'Упитанность 3.00 — стабильно.' },
    { id: 'tl-08', date: '2026-01-20', category: 'health', icon: '💉', title: 'Вакцинация Комбовак-Р', description: 'Ринотрахеит, вирусная диарея, парагрипп-3.' },
    { id: 'tl-09', date: '2026-01-12', category: 'reproduction', icon: '🧬', title: '1-е осеменение (лактация 3)', description: 'Бык: LIGHTNING RIDGE. 132-й день лактации. Результат: стельная.' },
    { id: 'tl-10', date: '2026-01-10', category: 'reproduction', icon: '🌡️', title: 'Охота обнаружена', description: 'Индикатор охоты: 175. Яркая охота.' },
    { id: 'tl-11', date: '2025-11-30', category: 'health', icon: '💊', title: 'Дегельминтизация Ивермек', description: '1 мл/50 кг.' },
    { id: 'tl-12', date: '2025-10-30', category: 'management', icon: '📏', title: 'Минимум упитанности', description: 'Упитанность 2.75 — физиологический минимум (58-й день лактации).' },
    { id: 'tl-13', date: '2025-09-10', category: 'health', icon: '⚠️', title: 'Субклинический кетоз', description: 'БГБ 1.4 ммоль/л. Лечение: пропиленгликоль.', severity: 'warning' },
    { id: 'tl-14', date: '2025-09-02', category: 'reproduction', icon: '🐄', title: 'Отёл — бычок 42 кг', description: 'Лёгкий отёл (оценка 1). Начало лактации 3.' },
    { id: 'tl-15', date: '2025-02-15', category: 'management', icon: '🔒', title: 'Запуск (лактация 2)', description: '305-й день лактации. Сом. клетки 120 тыс/мл.' },
    { id: 'tl-16', date: '2024-05-28', category: 'reproduction', icon: '🐄', title: 'Отёл — тёлочка 36 кг', description: 'Нормальный отёл. Тёлка #245 оставлена в стаде.' },
    { id: 'tl-17', date: '2024-11-05', category: 'health', icon: '🔴', title: 'Клинический мастит ЗП (лактация 1)', description: 'Staph. aureus. Лечение: Мастиет Форте + Байтрил.', severity: 'critical' },
    { id: 'tl-18', date: '2023-07-18', category: 'reproduction', icon: '🐄', title: 'Первый отёл — тёлочка 34 кг', description: 'Трудный отёл (оценка 3). Тёлка #198.' },
    { id: 'tl-19', date: '2022-06-15', category: 'management', icon: '🎂', title: 'Рождение', description: 'Тёлочка. Мать: Зорька 89. Отец: DELTA LAMBDA.' },
  ];
}

function buildInfographics(): InfographicData {
  return {
    lactationComparison: [
      { lactation: 1, peakYield: 34.2, totalYield: 9580, avgDailyYield: 28.7, days: 334 },
      { lactation: 2, peakYield: 38.5, totalYield: 11240, avgDailyYield: 32.1, days: 350 },
      { lactation: 3, peakYield: 41.1, totalYield: 4890, avgDailyYield: 33.7, days: 145 }, // Current, ongoing
    ],
    radarScores: [
      { axis: 'Молочность', value: 88, max: 100 },
      { axis: 'Здоровье', value: 72, max: 100 },
      { axis: 'Фертильность', value: 80, max: 100 },
      { axis: 'Долголетие', value: 85, max: 100 },
      { axis: 'Экстерьер', value: 76, max: 100 },
      { axis: 'Вымя', value: 82, max: 100 },
    ],
    herdRankings: [
      { metric: 'Надой за лактацию', rank: 3, total: 37, percentile: 92 },
      { metric: 'Ср. сом. клетки', rank: 12, total: 37, percentile: 68 },
      { metric: 'Фертильность', rank: 5, total: 37, percentile: 86 },
      { metric: 'Стабильность упитанности', rank: 8, total: 37, percentile: 78 },
      { metric: 'Генетический потенциал', rank: 4, total: 37, percentile: 89 },
      { metric: 'Экон. эффективность', rank: 2, total: 37, percentile: 95 },
    ],
    monthlyTrends: [
      { month: '2025-10', yield: 1020, scc: 130, fat: 3.8, protein: 3.2 },
      { month: '2025-11', yield: 985, scc: 125, fat: 3.9, protein: 3.3 },
      { month: '2025-12', yield: 960, scc: 140, fat: 4.0, protein: 3.3 },
      { month: '2026-01', yield: 940, scc: 148, fat: 3.9, protein: 3.4 },
      { month: '2026-02', yield: 925, scc: 162, fat: 3.8, protein: 3.3 },
      { month: '2026-03', yield: 450, scc: 189, fat: 3.7, protein: 3.2 }, // Partial month
    ],
    lifetimeStats: {
      totalMilk: 25710,
      totalCalvings: 3,
      avgLactationDays: 276,
      avgPeakYield: 37.9,
      lifetimeSCC: 158,
      daysInHerd: 1366,
      revenue: 1542600, // рублей
    },
  };
}

// =============================================
// PUBLIC API
// =============================================

let _cached: DigitalTwinData | null = null;

export function getCow21DigitalTwin(): DigitalTwinData {
  if (_cached) return _cached;

  const profile = buildProfile();
  const milkingSessions = buildMilkingSessions();
  const dailyMilkSummary = buildDailySummary(milkingSessions);
  const healthEvents = buildHealthEvents();
  const bcsHistory = buildBCSHistory();
  const reproductionEvents = buildReproductionEvents();
  const calvingHistory = buildCalvingHistory();
  const breedingPlan = buildBreedingPlan();
  const genetics = buildGenetics();
  const timeline = buildTimeline();
  const infographics = buildInfographics();

  _cached = {
    profile,
    milkingSessions,
    dailyMilkSummary,
    healthEvents,
    bcsHistory,
    reproductionEvents,
    calvingHistory,
    breedingPlan,
    genetics,
    timeline,
    infographics,
  };

  return _cached;
}
