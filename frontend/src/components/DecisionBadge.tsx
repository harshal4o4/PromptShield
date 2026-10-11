import React from 'react';
import type { Decision } from '../types/api';

interface Props {
  decision: Decision;
  size?: 'sm' | 'md' | 'lg';
}

export const DecisionBadge: React.FC<Props> = ({ decision, size = 'md' }) => {
  const styles: Record<Decision, string> = {
    ALLOW: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    BLOCK: 'bg-red-500/15 border-red-500/40 text-red-400',
    SANITIZE: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
    ESCALATE: 'bg-purple-500/15 border-purple-500/40 text-purple-400',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-bold',
  };

  const icons: Record<Decision, string> = {
    ALLOW: 'check_circle',
    BLOCK: 'block',
    SANITIZE: 'auto_fix_high',
    ESCALATE: 'warning',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border ${styles[decision] || styles.ALLOW} ${sizeClasses[size]}`}
    >
      <span className="material-symbols-outlined text-[14px] leading-none">
        {icons[decision]}
      </span>
      {decision}
    </span>
  );
};
