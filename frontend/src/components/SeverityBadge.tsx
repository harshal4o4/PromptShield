import React from 'react';
import type { RiskLevel } from '../types/api';

interface Props {
  severity: RiskLevel;
}

export const SeverityBadge: React.FC<Props> = ({ severity }) => {
  const styles: Record<RiskLevel, string> = {
    critical: 'bg-red-50 text-red-800 border-red-300',
    high: 'bg-rose-50 text-rose-800 border-rose-300',
    medium: 'bg-amber-50 text-amber-800 border-amber-300',
    low: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  return (
    <span
      className={`inline-flex items-center text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded border ${styles[severity] || styles.low}`}
    >
      {severity}
    </span>
  );
};
