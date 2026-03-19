import { ForecastPoint, KPIValues } from "@/types/scenario";

interface Props {
  baseline: KPIValues;
  forecasts: ForecastPoint[];
}

export default function ScenarioComparisonTable({ baseline, forecasts }: Props) {
  const TableRow = ({ label, baseVal, scenVal, unit, isReverse = false }: any) => {
    const diff = scenVal - baseVal;
    let isBetter = diff > 0;
    if (isReverse) isBetter = diff < 0;
    
    return (
      <tr>
        <td style={{ color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', opacity: 0.8 }}>📈</span> {label}
        </td>
        <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{Math.round(baseVal).toLocaleString("ru-RU")}</td>
        <td style={{ fontWeight: 700, textAlign: 'right', color: 'var(--text-primary)' }}>
          {Math.round(scenVal).toLocaleString("ru-RU")}
        </td>
      </tr>
    );
  };

  const finalForecast = forecasts[forecasts.length - 1].kpi;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px' }}>
          📋 Сравнение с базой
        </span>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div className="table-container">
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Показатель</th>
                <th>Базовый</th>
                <th style={{ textAlign: 'right' }}>Сценарий</th>
              </tr>
            </thead>
            <tbody>
              <TableRow label="Всего голов" baseVal={baseline.totalAnimals} scenVal={finalForecast.totalAnimals} unit="" />
              <TableRow label="Дойных коров" baseVal={baseline.milkingCows} scenVal={finalForecast.milkingCows} unit="" />
              <TableRow label="Ср. надой/корову" baseVal={baseline.averageMilkPerCow} scenVal={finalForecast.averageMilkPerCow} unit="кг" />
              <TableRow label="Надой/сутки" baseVal={baseline.totalDailyMilk} scenVal={finalForecast.totalDailyMilk} unit="кг" />
              <TableRow label="Кормовая эффект." baseVal={baseline.feedEfficiency} scenVal={finalForecast.feedEfficiency} unit="%" />
              <TableRow label="Корм/голову" baseVal={baseline.feedCostPerHead} scenVal={finalForecast.feedCostPerHead} unit="₽" isReverse={true} />
              <TableRow label="Доход минус корм" baseVal={baseline.incomeOverFeed} scenVal={finalForecast.incomeOverFeed} unit="₽" />
              <TableRow label="Себестоимость/литр" baseVal={baseline.costPerLiter} scenVal={finalForecast.costPerLiter} unit="₽" isReverse={true} />
              <TableRow label="Стельность" baseVal={baseline.pregnancyRate || 35} scenVal={finalForecast.pregnancyRate || 35} unit="%" />
              <TableRow label="Сервис-период" baseVal={baseline.servicePeriod || 120} scenVal={finalForecast.servicePeriod || 120} unit="дн" />
              <TableRow label="Средний DIM" baseVal={baseline.averageDim || 155} scenVal={finalForecast.averageDim || 155} unit="дн" />
              <TableRow label="Выбраковка" baseVal={baseline.cullingRate || 22} scenVal={finalForecast.cullingRate || 22} unit="%" />
              <TableRow label="Мастит" baseVal={10.8} scenVal={10.8} unit="%" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
