import { ScenarioExplanation, ScenarioFactorImpact } from "@/types/scenario";

interface Props {
  insights: ScenarioExplanation[];
  impactTable: ScenarioFactorImpact[];
}

export default function ScenarioInsights({ insights }: Props) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'positive': return '✅';
      case 'negative': return '📉';
      case 'risk': return '⚠️';
      case 'recommendation': return '💡';
      default: return '📉';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        <span>💡 Что изменилось и почему</span>
      </h3>
      {insights.length === 0 ? (
        <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', fontStyle: 'italic', background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          Существенных изменений не наблюдается.
        </div>
      ) : (
        insights.map((insight, idx) => {
          let bg = 'rgba(239, 68, 68, 0.05)';
          let border = '1px solid rgba(239, 68, 68, 0.2)';
          let color = 'var(--danger)';
          if (insight.type === 'positive') {
            bg = 'rgba(34, 197, 94, 0.05)';
            border = '1px solid rgba(34, 197, 94, 0.2)';
            color = 'var(--success)';
          } else if (insight.type === 'risk') {
            bg = 'rgba(234, 179, 8, 0.05)';
            border = '1px solid rgba(234, 179, 8, 0.2)';
            color = 'var(--warning)';
          } else if (insight.type === 'recommendation') {
            bg = 'rgba(59, 130, 246, 0.05)';
            border = '1px solid rgba(59, 130, 246, 0.2)';
            color = 'var(--info)';
          }
          return (
            <div key={idx} style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: bg, border: border, color: color, display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', opacity: 0.8 }}>{getIcon(insight.type)}</div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.4 }}>{insight.description}</p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
