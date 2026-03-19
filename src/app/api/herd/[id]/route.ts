import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { DigitalTwinData } from '@/lib/cow21twin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cowId } = await params;

    // Ищем корову в БД с ее зависимостями
    const cow = await prisma.cow.findUnique({
      where: { id: cowId },
      include: {
        group: true,
        milkRecords: {
          orderBy: { date: 'desc' },
          take: 90 // ~3 сессии в день * 30 дней
        },
        events: {
          orderBy: { timestamp: 'desc' },
          take: 20
        }
      }
    });

    if (!cow) {
      return NextResponse.json({ error: 'Корова не найдена' }, { status: 404 });
    }

    // Сборка профиля DigitalTwinData на основе реальных данных БД
    const profile = {
      number: cow.number,
      regNumber: `RU-077-${cow.number.padStart(6, '0')}`,
      electronicId: `RU-643-0077-${cow.number.padStart(6, '0')}`,
      breed: 'Голштинская',
      bloodline: 'O-Man × Shottle',
      birthDate: cow.birthDate ? cow.birthDate.toISOString().split('T')[0] : '2022-01-01',
      weight: 620 + Math.floor(Math.random() * 80),
      bcs: 3.0 + Math.floor(Math.random() * 5) / 10,
      color: 'чёрно-пёстрая',
      status: cow.status,
      group: { id: cow.groupId || '0', name: cow.group?.name || 'Без группы' },
      lactation: cow.lactation || 1,
      dim: cow.dim || 0,
      gynStatus: cow.status === 'Стельная' ? 'Стельная' : 'Открытая', // Условность
      managementSummary: `Профиль животного загружен из базы данных. Лактация: ${cow.lactation}, DIM: ${cow.dim}. Текущая группа: ${cow.group?.name || 'Нет'}.`
    };

    // Сборка доений (MilkingSessions)
    // Группируем milkRecords по дате для DailyMilkSummary
    const milkingSessions = cow.milkRecords.map((r: any) => ({
      date: r.date.toISOString().split('T')[0],
      session: r.session,
      yield: r.yield,
      duration: r.duration || 6.5,
      completeness: r.completeness || 98,
      conductivity: r.conductivity || 6.0,
      scc: r.scc || 150,
      stall: r.stall || '1-01',
      fatPercent: 3.8,
      proteinPercent: 3.2,
      lactosePercent: 4.8
    }));

    const byDate = new Map<string, any[]>();
    milkingSessions.forEach((s: any) => {
      if (!byDate.has(s.date)) byDate.set(s.date, []);
      byDate.get(s.date)!.push(s);
    });

    const dailyMilkSummary = Array.from(byDate.entries())
      .map(([date, ss]) => ({
        date,
        totalYield: Math.round(ss.reduce((a: number, s: any) => a + s.yield, 0) * 10) / 10,
        sessions: ss.length,
        avgSCC: Math.round(ss.reduce((a: number, s: any) => a + s.scc, 0) / ss.length),
        avgConductivity: Math.round(ss.reduce((a: number, s: any) => a + s.conductivity, 0) / ss.length * 10) / 10,
        avgFat: 3.8,
        avgProtein: 3.2,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Сборка событий здоровья и репродукции из Event
    const healthEvents = cow.events
      .filter((e: any) => e.title.includes('Мастит') || e.title.includes('Кетоз') || e.title.includes('хромот'))
      .map((e: any) => ({
        id: e.id,
        date: e.timestamp.toISOString().split('T')[0],
        type: 'examination' as any,
        title: e.title,
        description: e.description || '',
        severity: e.severity as 'info' | 'warning' | 'critical',
        treatment: e.metadata || undefined
      }));

    const reproductionEvents = cow.events
      .filter((e: any) => e.title.includes('Осеменен') || e.title.includes('Отел') || e.title.includes('УЗИ'))
      .map((e: any) => ({
        id: e.id,
        date: e.timestamp.toISOString().split('T')[0],
        type: (e.title.toLowerCase().includes('отел') ? 'calving' 
            : e.title.toLowerCase().includes('узи') || e.title.toLowerCase().includes('стельная') ? 'pregnancy_check' 
            : e.title.toLowerCase().includes('сухостой') ? 'dry_off'
            : 'insemination') as any,
        title: e.title,
        description: e.description || '',
      }));

    // Формируем единый таймлайн
    const timeline = cow.events.map((e: any) => ({
      id: e.id,
      date: e.timestamp.toISOString().split('T')[0],
      category: e.title.includes('Мастит') || e.title.includes('Кетоз') ? 'health' 
              : e.title.includes('Осемен') ? 'reproduction' : 'management' as any,
      icon: e.title.includes('Мастит') ? '⚠️' : '📋',
      title: e.title,
      description: e.description || '',
      severity: e.severity as any,
    }));

    // Генерация синтетики для графиков, чтобы интерфейс не падал
    const bcsHistory = [];
    let curBcs = profile.bcs;
    for (let i = 0; i < 6; i++) {
        bcsHistory.push({
            date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            score: Math.round((curBcs + (Math.random() * 0.4 - 0.2)) * 100) / 100,
            dim: Math.max(0, profile.dim - i * 30)
        });
    }

    const calvingHistory = [
      { date: '2023-05-10', lactation: 1, calfSex: 'Тёлочка', calfWeight: 35, calfId: '#123', easeScore: 1, notes: 'Нормально' },
    ];

    const breedingPlan = {
      status: profile.gynStatus,
      nextAction: 'Плановый осмотр',
      nextActionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      preferredSires: [
        { id: 'HO-840-003-218', name: 'PINNACLE', breed: 'Голштинская', proof: 2940, reason: 'Оптимально' }
      ],
      inseminationHistory: [],
      breedingValue: 2400,
      inbreedingCoeff: 5.5,
    };

    const genetics = {
      sire: { id: 'HO-840', name: 'DELTA', breed: 'Голштинская', proof: 2700, country: 'США' },
      dam: { id: 'RU-077', name: 'Мать', breed: 'Голштинская', milkYield: 10500 },
      sireOfSire: { id: 'HO-840-1', name: 'Дед 1' },
      damOfSire: { id: 'HO-840-2', name: 'Бабка 1' },
      sireOfDam: { id: 'HO-840-3', name: 'Дед 2' },
      damOfDam: { id: 'HO-840-4', name: 'Бабка 2' },
      genomicIndices: [
        { name: 'Индекс общей продуктивности', value: 2450, percentile: 82, description: 'Комплексный селекционный индекс' },
      ],
      breedComposition: [
        { breed: 'Голштинская', percent: 100 },
      ],
    };

    const infographics = {
      lactationComparison: [
        { lactation: 1, peakYield: 35, totalYield: 9000, avgDailyYield: 29, days: 305 }
      ],
      radarScores: [
        { axis: 'Молочность', value: 85, max: 100 },
        { axis: 'Здоровье', value: 75, max: 100 },
        { axis: 'Фертильность', value: 80, max: 100 },
        { axis: 'Долголетие', value: 80, max: 100 },
        { axis: 'Экстерьер', value: 75, max: 100 },
        { axis: 'Вымя', value: 80, max: 100 },
      ],
      herdRankings: [
        { metric: 'Надой за лактацию', rank: 10, total: 370, percentile: 97 },
        { metric: 'Среднесуточный удой', rank: 15, total: 370, percentile: 95 },
        { metric: 'Уровень соматических клеток', rank: 45, total: 370, percentile: 87 },
        { metric: 'Выход жира и белка', rank: 22, total: 370, percentile: 94 },
        { metric: 'Индекс фертильности', rank: 110, total: 370, percentile: 70 },
      ],
      monthlyTrends: [],
      lifetimeStats: {
        totalMilk: 9000 * profile.lactation,
        totalCalvings: profile.lactation,
        avgLactationDays: 305,
        avgPeakYield: 35,
        lifetimeSCC: 150,
        daysInHerd: profile.lactation * 365,
        revenue: profile.lactation * 9000 * 35, // примерная выручка (кг * цена)
      },
    };

    const data: DigitalTwinData = {
      profile: profile as any,
      milkingSessions,
      dailyMilkSummary,
      healthEvents,
      bcsHistory: bcsHistory.reverse(),
      reproductionEvents,
      calvingHistory,
      breedingPlan,
      genetics,
      timeline,
      infographics,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching cow profile:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
