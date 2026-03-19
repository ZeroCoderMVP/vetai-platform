import { ForecastPoint, KPIValues } from "@/types/scenario";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Props {
  baseline: KPIValues;
  forecasts: ForecastPoint[];
}

export default function ScenarioCharts({ baseline, forecasts }: Props) {
  const chartData = [
    { month: "База", milkBaseline: baseline.totalDailyMilk, milkScenario: baseline.totalDailyMilk },
    ...forecasts.map(f => ({
      month: `${f.month} мес`,
      milkBaseline: baseline.totalDailyMilk,
      milkScenario: f.kpi.totalDailyMilk,
    }))
  ];

  return (
    <div className="card" style={{ width: '100%', marginBottom: 'var(--space-6)' }}>
      <div className="card-header">
        <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          📊 Прогноз по месяцам — Надой/сутки
        </span>
      </div>
      <div className="card-body" style={{ height: '260px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
            <YAxis tickLine={false} axisLine={false} className="text-xs" width={60} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any) => [`${Number(value).toLocaleString("ru-RU")} кг`, '']}
            />
            <Legend iconType="circle" />
            <Line type="monotone" dataKey="milkBaseline" name="Базовый" stroke="#9CA3AF" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="milkScenario" name="Сценарий" stroke="#3B82F6" strokeWidth={3} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
