import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AttendanceBadgeProps {
  percentage: number;
  threshold?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const AttendanceBadge: React.FC<AttendanceBadgeProps> = ({
  percentage,
  threshold = 75,
  size = 'md',
  showIcon = true,
}) => {
  const isSafe = percentage >= threshold;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${sizeClasses[size]} ${
        isSafe
          ? 'bg-blue-50/80 text-blue-800 border-blue-200'
          : 'bg-amber-50 text-amber-900 border-amber-300'
      }`}
    >
      {showIcon && (
        isSafe ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />
        )
      )}
      <span className="font-mono tabular-nums">{percentage.toFixed(1)}%</span>
      <span className="text-[11px] font-normal text-slate-500">
        {isSafe ? 'Eligible' : 'Shortage'}
      </span>
    </span>
  );
};
