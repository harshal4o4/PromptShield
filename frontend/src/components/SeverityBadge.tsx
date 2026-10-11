import React from 'react';
import type { RiskLevel } from '../types/api';

interface Props {
  severity: RiskLevel;
}

export const SeverityBadge: React.FC<Props> = ({ severity }) => {
  const styles: Record<RiskLevel, string> = {
    critical: 'bg-red-500/20 text-red-300 border-red-500/40',
    high: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    low: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
  };

  return (
    <span
      className={`inline-flex items-center text-[11px] font-mono uppercase px-2 py-0.5 rounded border ${styles[severity] || styles.low}`}
    >
      {severity}
    </span>
  );
};
