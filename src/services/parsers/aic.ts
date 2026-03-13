// =============================================
// Парсер данных AIC Waikato DairyTRACE (.AIC файлы)
// =============================================

import fs from 'fs';
import path from 'path';

export interface AICMilkingRecord {
  date: string;         // YYMMDD
  time: string;         // HHMMSS
  stall: number;        // Номер стойла
  cowNumber: string;    // Номер коровы (строка, может быть "000000")
  lactation: number;    // Номер лактации
  milkingNumber: number; // Номер доения (1, 2, 3)
  yield: number;        // Надой, кг
  bloodPercent: number; // Процент крови
  flow1: number;        // Потоки молока по четвертям
  flow2: number;
  flow3: number;
  duration: number;     // Время доения (минуты)
  completeness: number; // Полнота доения %
  flagSCC: number;      // Флаг соматики (0/1)
  conductivity: number; // Проводимость
  peakFlow: number;     // Пиковый поток
  flagBlood: number;    // Флаг крови
  flagID: number;       // Флаг идентификации
  flagMilk: number;     // Флаг молока
  flagLow: number;      // Флаг низкого надоя
  spare1: number;
  spare2: number;
  scc: number;          // Соматические клетки (тыс/мл)
}

export interface AICSessionSummary {
  totalCows: number;
  totalYield: number;
  averageYield: number;
  date: string;
  milkings: {
    morning: AICMilkingRecord[];
    evening: AICMilkingRecord[];
    night: AICMilkingRecord[];
  };
  bySCC: {
    normal: number;    // scc < 200
    elevated: number;  // scc 200-400
    high: number;      // scc > 400
  };
}

export function parseAICFile(filePath: string): AICMilkingRecord[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l.trim());
    const records: AICMilkingRecord[] = [];

    for (const line of lines) {
      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 23) continue;

      records.push({
        date: parts[3],           // 260305 → 2026-03-05
        time: parts[4],           // 062800 → 06:28:00
        stall: parseInt(parts[5]) || 0,
        cowNumber: parts[6].replace(/^0+/, '') || '0',
        lactation: parseInt(parts[7]) || 0,
        milkingNumber: parseInt(parts[8]) || 1,
        yield: parseFloat(parts[9]) || 0,
        bloodPercent: parseFloat(parts[10]) || 0,
        flow1: parseFloat(parts[11]) || 0,
        flow2: parseFloat(parts[12]) || 0,
        flow3: parseFloat(parts[13]) || 0,
        duration: parseFloat(parts[14]) || 0,
        completeness: parseFloat(parts[15]) || 0,
        flagSCC: parseInt(parts[16]) || 0,
        conductivity: parseInt(parts[17]) || 0,
        peakFlow: parseInt(parts[18]) || 0,
        flagBlood: parseInt(parts[19]) || 0,
        flagID: parseInt(parts[20]) || 0,
        flagMilk: parseInt(parts[21]) || 0,
        flagLow: parseInt(parts[22]) || 0,
        spare1: parseInt(parts[23]) || 0,
        spare2: parseInt(parts[24]) || 0,
        scc: parseInt(parts[25]) || 0,
      });
    }

    return records;
  } catch (error) {
    console.error(`Ошибка парсинга AIC файла ${filePath}:`, error);
    return [];
  }
}

export function getAICSummary(records: AICMilkingRecord[]): AICSessionSummary {
  const validRecords = records.filter(r => r.cowNumber !== '0' && r.yield > 0);
  const totalYield = validRecords.reduce((sum, r) => sum + r.yield, 0);
  
  // Группируем по номеру доения
  const morning = validRecords.filter(r => r.milkingNumber === 1);
  const evening = validRecords.filter(r => r.milkingNumber === 2);
  const night = validRecords.filter(r => r.milkingNumber === 3);

  // SCC распределение
  const normal = validRecords.filter(r => r.scc < 200).length;
  const elevated = validRecords.filter(r => r.scc >= 200 && r.scc <= 400).length;
  const high = validRecords.filter(r => r.scc > 400).length;

  const dateStr = validRecords.length > 0 ? validRecords[0].date : '';
  const formattedDate = dateStr ? 
    `20${dateStr.substring(0, 2)}-${dateStr.substring(2, 4)}-${dateStr.substring(4, 6)}` : '';

  return {
    totalCows: new Set(validRecords.map(r => r.cowNumber)).size,
    totalYield: Math.round(totalYield * 10) / 10,
    averageYield: validRecords.length > 0 ? Math.round((totalYield / validRecords.length) * 10) / 10 : 0,
    date: formattedDate,
    milkings: { morning, evening, night },
    bySCC: { normal, elevated, high },
  };
}

export function parseAICDirectory(dirPath: string): AICMilkingRecord[] {
  try {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.AIC') || f.endsWith('.aic'));
    const allRecords: AICMilkingRecord[] = [];
    for (const file of files) {
      const records = parseAICFile(path.join(dirPath, file));
      allRecords.push(...records);
    }
    return allRecords;
  } catch (error) {
    console.error('Ошибка чтения директории AIC:', error);
    return [];
  }
}
