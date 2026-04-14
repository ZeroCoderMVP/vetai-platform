import React from 'react';

export type TrustStatus = 'Verified' | 'Unconfirmed' | 'Conflict' | 'Stale';

interface TrustBadgeProps {
  status: TrustStatus;
  className?: string;
  tooltipText?: string;
}

export function TrustBadge({ status, className = '', tooltipText }: TrustBadgeProps) {
  let bgColor = '';
  let textColor = '';
  let icon = '';

  switch (status) {
    case 'Verified':
      bgColor = 'rgba(48, 164, 108, 0.12)'; // var(--ok) with opacity
      textColor = 'var(--ok)';
      icon = '✓';
      break;
    case 'Unconfirmed':
      bgColor = 'rgba(107, 114, 128, 0.12)'; // var(--muted) with opacity
      textColor = 'var(--muted)';
      icon = '?';
      break;
    case 'Conflict':
      bgColor = 'rgba(229, 72, 77, 0.12)'; // var(--critical) with opacity
      textColor = 'var(--critical)';
      icon = '!';
      break;
    case 'Stale':
      bgColor = 'rgba(245, 165, 36, 0.12)'; // var(--warning) with opacity
      textColor = 'var(--warning)';
      icon = '⏳';
      break;
  }

  return (
    <span 
      title={tooltipText}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider ${className}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <span className="text-[10px]">{icon}</span>
      {status}
    </span>
  );
}
