import { ScenarioParameters } from "@/types/scenario";

interface Props {
  parameters: ScenarioParameters;
  onChange: (newParams: ScenarioParameters) => void;
  disabled: boolean;
}

export default function ScenarioControls({ parameters, onChange, disabled }: Props) {
  const handleFeedingShareChange = (field: 'silageShare' | 'haylageShare' | 'concentrateShare', value: number) => {
    if (disabled) return;
    
    const maxVals = { silageShare: 60, haylageShare: 50, concentrateShare: 60 };
    const minVals = { silageShare: 10, haylageShare: 5, concentrateShare: 20 };
    
    const targetOthersTotal = 100 - Math.round(value);
    
    const others = (['silageShare', 'haylageShare', 'concentrateShare'] as const).filter(f => f !== field);
    const f1 = others[0];
    const f2 = others[1];
    
    let othersSum = parameters.feeding[f1] + parameters.feeding[f2];
    if (othersSum === 0) othersSum = 1;
    
    let val1 = parameters.feeding[f1] * (targetOthersTotal / othersSum);
    let val2 = parameters.feeding[f2] * (targetOthersTotal / othersSum);
    
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    
    // Apply constraints and shift remaining to the other
    if (val1 < minVals[f1] || val1 > maxVals[f1]) {
      val1 = clamp(val1, minVals[f1], maxVals[f1]);
      val2 = targetOthersTotal - val1;
      val2 = clamp(val2, minVals[f2], maxVals[f2]);
    } else if (val2 < minVals[f2] || val2 > maxVals[f2]) {
      val2 = clamp(val2, minVals[f2], maxVals[f2]);
      val1 = targetOthersTotal - val2;
      val1 = clamp(val1, minVals[f1], maxVals[f1]);
    }
    
    const rounded1 = Math.round(val1);
    const rounded2 = targetOthersTotal - rounded1;
    
    onChange({
      ...parameters,
      feeding: {
        ...parameters.feeding,
        [field]: Math.round(value),
        [f1]: rounded1,
        [f2]: rounded2,
      }
    });
  };

  const handleChange = (category: keyof ScenarioParameters, field: string, value: number) => {
    if (disabled) return;
    if (category === 'feeding' && ['silageShare', 'haylageShare', 'concentrateShare'].includes(field)) {
      handleFeedingShareChange(field as any, value);
      return;
    }
    onChange({
      ...parameters,
      [category]: {
        ...(parameters[category] as any),
        [field]: value,
      },
    });
  };

  const renderSlider = (
    label: string,
    category: keyof ScenarioParameters,
    field: string,
    min: number,
    max: number,
    step: number,
    unit: string,
    format: (v: number) => string = (v) => v.toString()
  ) => {
    const val = (parameters[category] as any)[field];
    return (
      <div className="mb-4">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{format(val)}{unit}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={val}
          disabled={disabled}
          onChange={(e) => handleChange(category, field, parseFloat(e.target.value))}
          style={{ 
            width: '100%', 
            height: '6px', 
            borderRadius: 'var(--radius-full)', 
            cursor: disabled ? 'default' : 'pointer', 
            opacity: disabled ? 0.5 : 1,
            background: "var(--border-subtle)", 
            accentColor: "var(--primary-400)"
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Feeding Block */}
      <div className="card">
        <div className="card-header"><span className="card-title">🌾 Кормление</span></div>
        <div className="card-body">
          {renderSlider("Доля кукурузного силоса", "feeding", "silageShare", 10, 60, 1, "%")}
          {renderSlider("Доля сенажа", "feeding", "haylageShare", 5, 50, 1, "%")}
          {renderSlider("Доля концентратов", "feeding", "concentrateShare", 20, 60, 1, "%")}
          {renderSlider("Индекс цен ингредиентов", "feeding", "ingredientPriceIndex", 0.5, 2.0, 0.05, "x", (v) => v.toFixed(2))}
          {renderSlider("Точность кормления", "feeding", "feedingAccuracy", 80, 100, 1, "%")}
        </div>
      </div>

      {/* Groups Block */}
      <div className="card">
        <div className="card-header"><span className="card-title">🐄 Группы и структура</span></div>
        <div className="card-body">
          {renderSlider("Плотность посадки", "groups", "stockingDensity", 80, 130, 5, "%")}
        </div>
      </div>

      {/* Reproduction Block */}
      <div className="card">
        <div className="card-header"><span className="card-title">🧬 Воспроизводство</span></div>
        <div className="card-body">
          {renderSlider("Conception Rate (CR)", "reproduction", "conceptionRate", 20, 60, 1, "%")}
          {renderSlider("Выявление охоты (HDR)", "reproduction", "heatDetection", 30, 90, 1, "%")}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">📉 Экономика</span></div>
        <div className="card-body">
          {renderSlider("Цена на молоко", "economics", "milkPrice", 30, 60, 0.5, " ₽/кг")}
        </div>
      </div>

      {/* Placeholder blocks looking like real content behind a spoiler */}
      <details className="card" style={{ opacity: 0.7, cursor: 'default' }}>
        <summary className="card-header" style={{ outline: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">🧬 Генетика</span>
          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>▼</span>
        </summary>
        <div className="card-body">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Генетический прогресс</label>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>+1.5%</span>
            </div>
            <input type="range" min="0" max="3" step="0.1" value="1.5" disabled style={{ width: '100%', height: '6px', borderRadius: 'var(--radius-full)', background: "var(--border-subtle)", opacity: 0.5 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}><span>0</span><span>3</span></div>
          </div>
        </div>
      </details>
      
      <details className="card" style={{ opacity: 0.7, cursor: 'default' }}>
        <summary className="card-header" style={{ outline: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">💊 Здоровье</span>
          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>▼</span>
        </summary>
        <div className="card-body">
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Уровень заболеваемости</label>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>12%</span>
            </div>
            <input type="range" min="5" max="25" step="1" value="12" disabled style={{ width: '100%', height: '6px', borderRadius: 'var(--radius-full)', background: "var(--border-subtle)", opacity: 0.5 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}><span>5</span><span>25</span></div>
          </div>
        </div>
      </details>
    </div>
  );
}
