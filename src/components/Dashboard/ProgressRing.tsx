import React from 'react';

interface ProgressRingProps {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  label?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  percent,
  size = 96,
  stroke = 8,
  color = '#2563EB',
  trackColor = '#F1F5F9',
  label,
}) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(percent, 0), 100);
  const offset = circ - (pct / 100) * circ;
  const cx = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        {/* Track */}
        <circle cx={cx} cy={cx} r={r} strokeWidth={stroke} stroke={trackColor} fill="none" />
        {/* Progress */}
        <circle
          cx={cx} cy={cx} r={r}
          strokeWidth={stroke}
          stroke={color}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-lg font-bold font-mono tabular-nums leading-none" style={{ color }}>
          {pct.toFixed(0)}%
        </span>
        {label && (
          <span className="text-[9px] uppercase tracking-widest text-slate-400 mt-0.5 leading-none">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
