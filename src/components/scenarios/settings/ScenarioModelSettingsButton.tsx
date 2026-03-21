import React from 'react';

interface Props {
  activeProfileName: string;
}

export default function ScenarioModelSettingsButton({ activeProfileName }: Props) {
  return (
    <div 
      className="btn btn-outline flex items-center gap-2"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)', fontSize: '14px', cursor: 'pointer' }}
      title="Настройки параметрической модели"
    >
      <span className="text-lg leading-none">⚙️</span>
      <span className="font-medium hidden sm:inline-block truncate max-w-[200px]">
        {activeProfileName}
      </span>
    </div>
  );
}
