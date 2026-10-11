import React from 'react';
import type { Decision } from '../types/api';

interface Props {
  decision: Decision;
  size?: 'sm' | 'md' | 'lg';
}

export const DecisionBadge: React.FC<Props> = ({ decision, size = 'md' }) => {
  const styles: Record<Decision, string> = {
    ALLOW: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    BLOCK: 'bg-red-50 border-red-300 text-red-800',
    SANITIZE: 'bg-amber-50 border-amber-300 text-amber-800',
    ESCALATE: 'bg-purple-50 border-purple-300 text-purple-800',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  };

  const icons: Record<Decision, string> = {
    ALLOW: 'check_circle',
    BLOCK: 'block',
    SANITIZE: 'auto_fix_high',
    ESCALATE: 'warning',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold rounded-md border ${styles[decision] || styles.ALLOW} ${sizeClasses[size]}`}
    >
      <span className="material-symbols-outlined text-[14px] leading-none">
        {icons[decision]}
      </span>
      {decision}
    </span>
  );
};
