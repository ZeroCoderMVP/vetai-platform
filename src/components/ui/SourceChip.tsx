import React from 'react';

export type SourceType = 'AfiFarm' | 'DTM' | 'Manual' | 'Paper' | 'System';

interface SourceChipProps {
  source: SourceType;
  className?: string;
  showIcon?: boolean;
}

export function SourceChip({ source, className = '', showIcon = true }: SourceChipProps) {
  let bgColor = 'var(--chip-bg)';
  let textColor = 'var(--text-secondary)';
  let icon = '🔄';

  switch (source) {
    case 'AfiFarm':
      bgColor = 'rgba(15, 168, 122, 0.12)';
      textColor = 'var(--primary-500)';
      icon = '📡';
      break;
    case 'DTM':
      bgColor = 'rgba(59, 130, 246, 0.12)';
      textColor = 'var(--accent-blue)';
      icon = '🚜';
      break;
    case 'Manual':
      bgColor = 'rgba(245, 158, 11, 0.12)';
      textColor = 'var(--accent-amber)';
      icon = '⌨️';
      break;
    case 'Paper':
      bgColor = 'rgba(139, 92, 246, 0.12)';
      textColor = 'var(--accent-purple)';
      icon = '📄';
      break;
    case 'System':
      bgColor = 'rgba(107, 114, 128, 0.12)';
      textColor = 'var(--muted)';
      icon = '⚙️';
      break;
  }

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {showIcon && <span>{icon}</span>}
      {source}
    </span>
  );
}
