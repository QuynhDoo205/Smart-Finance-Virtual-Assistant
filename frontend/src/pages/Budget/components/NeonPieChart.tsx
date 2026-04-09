import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip as RechartsTooltip, Customized,
} from 'recharts';
import type { Jar } from './LinkedSliders';

interface NeonPieChartProps {
  jars: Jar[];
  totalBudget: number;
  formatCurrency: (val: number) => string;
}

const RADIAN = Math.PI / 180;

/* Per-slice % label on the arc */
function SliceLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/* Tooltip */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (d.isUnallocated) {
    return (
      <div className="glass-panel px-4 py-3 rounded-xl text-sm pointer-events-none" style={{ borderColor: '#37415180', minWidth: 160 }}>
        <p className="font-bold" style={{ color: '#9ca3af' }}>⬜ Chưa phân bổ</p>
        <p style={{ color: 'var(--theme-text-muted)' }}>{d.percentage}% còn dư</p>
      </div>
    );
  }
  const jar = d as Jar & { amount: number };
  return (
    <div className="glass-panel px-4 py-3 rounded-xl text-sm pointer-events-none" style={{ borderColor: jar.neonColor + '60', minWidth: 180 }}>
      <div className="flex items-center gap-2 mb-1">
        <span>{jar.emoji}</span>
        <span className="font-bold" style={{ color: jar.neonColor }}>{jar.name}</span>
      </div>
      <p style={{ color: 'var(--theme-text-muted)' }}>
        {jar.percentage.toFixed(0)}% → {jar.amount.toLocaleString('vi-VN')} ₫
      </p>
    </div>
  );
}

/* Center label rendered via Recharts <Customized> to get real pixel cx/cy */
function DonutCenter({ cx, cy, allocatedTotal }: {
  cx: number; cy: number; allocatedTotal: number;
}) {
  const isExact = allocatedTotal === 100;
  const isOver  = allocatedTotal > 100;
  const color   = isExact ? '#00f5ff' : isOver ? '#ef4444' : '#f59e0b';

  return (
    <text textAnchor="middle">
      <tspan x={cx} y={cy} dy="-10" fontSize={13} fontWeight="800" fill={color}>
        {allocatedTotal}%
      </tspan>
      <tspan x={cx} dy="20" fontSize={10} fill="rgba(180,220,255,0.55)">
        {isExact ? 'Hoàn hảo ✓' : isOver ? 'Vượt mức!' : `còn ${100 - allocatedTotal}% dư`}
      </tspan>
    </text>
  );
}

export default function NeonPieChart({ jars, totalBudget, formatCurrency }: NeonPieChartProps) {
  /* Compute chart data — add gray "unallocated" slice when total < 100 */
  const allocatedTotal = useMemo(() => jars.reduce((s, j) => s + j.percentage, 0), [jars]);

  const chartData = useMemo(() => {
    const base = jars.map(j => ({
      ...j,
      value: Math.max(0, j.percentage),
      amount: Math.round((totalBudget * j.percentage) / 100),
      isUnallocated: false,
    }));

    const remaining = 100 - allocatedTotal;
    if (remaining > 0) {
      base.push({
        id: '__unallocated__', name: 'Chưa phân bổ', emoji: '⬜',
        percentage: remaining, color: '#374151', neonColor: '#4b5563',
        locked: false, description: '',
        value: remaining, amount: Math.round((totalBudget * remaining) / 100),
        isUnallocated: true,
      });
    }
    return base;
  }, [jars, totalBudget, allocatedTotal]);

  // Key forces re-animation on data change
  const chartKey = useMemo(() => jars.map(j => j.percentage).join('-'), [jars]);

  return (
    <motion.div
      className="glass-panel p-6 rounded-2xl flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest mb-4 self-start" style={{ color: 'var(--theme-text-muted)' }}>
        Biểu đồ phân bổ
      </p>

      <div className="w-full" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart key={chartKey}>
            <defs>
              {jars.map(jar => (
                <filter key={jar.id} id={`glow-${jar.id}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>

            <Pie
              data={chartData}
              cx="50%" cy="50%"
              innerRadius={72} outerRadius={110}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={SliceLabel}
              isAnimationActive={true}
              animationBegin={0}
              animationDuration={500}
              animationEasing="ease-out"
              stroke="none"
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={entry.neonColor}
                  opacity={entry.isUnallocated ? 0.35 : 0.88}
                  filter={entry.isUnallocated ? undefined : `url(#glow-${entry.id})`}
                />
              ))}
            </Pie>

            <RechartsTooltip content={<CustomTooltip />} />

            {/* Center label — uses Recharts Customized to get real pixel cx/cy */}
            <Customized
              component={({ cx, cy }: any) => (
                <DonutCenter
                  cx={cx} cy={cy}
                  allocatedTotal={allocatedTotal}
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend — only real jars */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 w-full">
        {jars.map(jar => (
          <div key={jar.id} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: jar.neonColor, boxShadow: `0 0 6px ${jar.neonColor}` }} />
            <span className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>{jar.emoji} {jar.name}</span>
          </div>
        ))}
      </div>

      {/* Total budget footer */}
      <div className="mt-4 w-full text-center pt-4" style={{ borderTop: '1px solid var(--theme-border)' }}>
        <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Tổng ngân sách khả dụng</p>
        <p className="text-xl font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>
          {formatCurrency(totalBudget)}
        </p>
      </div>
    </motion.div>
  );
}
