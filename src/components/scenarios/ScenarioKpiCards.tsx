import { KPIValues } from "@/types/scenario";

interface Props {
  baseline: KPIValues;
  forecast: KPIValues;
}

export default function ScenarioKpiCards({ baseline, forecast }: Props) {
  const KpiCard = ({ title, baseVal, forcVal, unit, isPositiveGood, showDecimals = false }: any) => {
    const diff = forcVal - baseVal;
    const diffPct = baseVal !== 0 ? (diff / baseVal) * 100 : 0;
    
    let isBetter = false;
    if (diff > 0) isBetter = isPositiveGood;
    if (diff < 0) isBetter = !isPositiveGood;
    const isNeutral = Math.abs(diffPct) < 0.1;

    const fmt = (v: number) => showDecimals ? v.toFixed(1) : Math.round(v).toLocaleString("ru-RU");
    
    // Icon mapping based on title
    let icon = "📊";
    if (title.includes("голов") || title.includes("коров") || title.includes("молодняк")) icon = "🐄";
    if (title.includes("надой") || title.includes("Надой")) icon = "🥛";
    if (title.includes("Корм") || title.includes("эффект")) icon = "🌾";
    if (title.includes("Доход") || title.includes("Себестоимость") || title.includes("Эконом")) icon = "💰";
    if (title.includes("Стельность") || title.includes("Сервис") || title.includes("DIM")) icon = "🧬";
    if (title.includes("Выбраковка") || title.includes("Мастит") || title.includes("Хромота")) icon = "⚕️";

    const cardColor = isNeutral ? "" : isBetter ? "green" : "danger";

    return (
      <div className={`kpi-card ${cardColor}`}>
        <div className="kpi-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>{icon} {title}</span>
          </div>
          {!isNeutral && (
            <span className={`kpi-change ${isBetter ? 'positive' : 'negative'}`}>
              {diff > 0 ? "+" : ""}{diffPct.toFixed(1)}%
            </span>
          )}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span className="kpi-value" style={{ fontSize: '22px' }}>{fmt(forcVal)}</span>
            <span className="kpi-unit">{unit}</span>
          </div>
          {!isNeutral && (
            <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '2px', color: isBetter ? 'var(--success)' : 'var(--danger)' }}>
              {diff > 0 ? "▲" : "▼"} {diff > 0 ? "+" : ""}{fmt(diff)} {unit}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid-3" style={{ marginBottom: 'var(--space-6)' }}>
      <KpiCard title="Всего голов" baseVal={baseline.totalAnimals} forcVal={forecast.totalAnimals} unit="гол" isPositiveGood={true} />
      <KpiCard title="Дойных коров" baseVal={baseline.milkingCows} forcVal={forecast.milkingCows} unit="гол" isPositiveGood={true} />
      <KpiCard title="Ср. надой/корову" baseVal={baseline.averageMilkPerCow} forcVal={forecast.averageMilkPerCow} unit="кг" isPositiveGood={true} showDecimals={true} />
      
      <KpiCard title="Надой/сутки" baseVal={baseline.totalDailyMilk} forcVal={forecast.totalDailyMilk} unit="кг" isPositiveGood={true} />
      <KpiCard title="Кормовая эффект." baseVal={baseline.feedEfficiency} forcVal={forecast.feedEfficiency} unit="%" isPositiveGood={true} showDecimals={true} />
      <KpiCard title="Корм/голову" baseVal={baseline.feedCostPerHead} forcVal={forecast.feedCostPerHead} unit="₽" isPositiveGood={false} showDecimals={true} />
      
      <KpiCard title="Доход минус корм" baseVal={baseline.incomeOverFeed} forcVal={forecast.incomeOverFeed} unit="₽" isPositiveGood={true} showDecimals={true} />
      <KpiCard title="Себестоимость/литр" baseVal={baseline.costPerLiter} forcVal={forecast.costPerLiter} unit="₽" isPositiveGood={false} showDecimals={true} />
      <KpiCard title="Стельность" baseVal={baseline.pregnancyRate || 35} forcVal={forecast.pregnancyRate || 35} unit="%" isPositiveGood={true} />
      
      <KpiCard title="Сервис-период" baseVal={baseline.servicePeriod || 120} forcVal={forecast.servicePeriod || 120} unit="дн" isPositiveGood={false} />
      <KpiCard title="Средний DIM" baseVal={baseline.averageDim || 155} forcVal={forecast.averageDim || 155} unit="дн" isPositiveGood={false} />
      <KpiCard title="Выбраковка" baseVal={baseline.cullingRate || 22} forcVal={forecast.cullingRate || 22} unit="%" isPositiveGood={false} />
      
      <KpiCard title="Мастит" baseVal={10.8} forcVal={10.8} unit="%" isPositiveGood={false} showDecimals={true} />
      <KpiCard title="Хромота" baseVal={4.5} forcVal={4.5} unit="%" isPositiveGood={false} showDecimals={true} />
      <KpiCard title="Новотельные" baseVal={baseline.freshCows || 7} forcVal={forecast.freshCows || 7} unit="гол" isPositiveGood={true} />
      
      <KpiCard title="Сухостойные" baseVal={baseline.dryCows || 8} forcVal={forecast.dryCows || 8} unit="гол" isPositiveGood={false} />
      <KpiCard title="Рем. молодняк" baseVal={baseline.replacementStock || 8} forcVal={forecast.replacementStock || 8} unit="гол" isPositiveGood={true} />
      <KpiCard title="Эконом. эффект" baseVal={baseline.totalEconomicEffect || 0} forcVal={forecast.totalEconomicEffect || 0} unit="₽/мес" isPositiveGood={true} />
    </div>
  );
}
