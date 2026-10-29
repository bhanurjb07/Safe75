import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ATTENDANCE_TARGET } from '../config/env.js';
import { useThemeColors } from '../hooks/useThemeColors.js';
import { formatDay, formatLongDay } from '../utils/dates.js';
import { statusFor } from '../utils/attendance.js';
import { statusMeta } from '../utils/status.js';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const meta = statusMeta(statusFor(p.percentage));
  const Icon = meta.icon;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs">
      <p className="text-muted">{formatLongDay(p.date)}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-base font-bold tabular">
        {p.percentage.toFixed(2)}%
        <Icon className={`h-3.5 w-3.5 ${meta.text}`} aria-label={meta.label} />
      </p>
      <p className="text-muted tabular">
        {p.present} of {p.total} attended
      </p>
    </div>
  );
}

/**
 * Running attendance % over time (one series), with the target as a dashed line.
 * data: [{ date, percentage, present, total }]
 */
export default function TrendChart({ data, height = 200, target = ATTENDANCE_TARGET, label = 'Attendance over time' }) {
  const id = useId().replace(/:/g, '');
  const c = useThemeColors();
  if (!data?.length) return null;

  const min = Math.min(target, ...data.map((d) => d.percentage));
  const floor = Math.max(0, Math.floor((min - 5) / 5) * 5);
  const last = data[data.length - 1];

  return (
    <figure aria-label={`${label}. Now ${last.percentage.toFixed(2)}%.`}>
      <div style={{ height }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.a2} stopOpacity={0.32} />
                <stop offset="100%" stopColor={c.a2} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`stroke-${id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={c.a1} />
                <stop offset="60%" stopColor={c.a2} />
                <stop offset="100%" stopColor={c.a3} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={c.line} strokeOpacity={0.07} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDay}
              tick={{ fill: c.subtle, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={32}
            />
            <YAxis
              domain={[floor, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: c.subtle, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickCount={5}
            />
            <ReferenceLine
              y={target}
              stroke={c.muted}
              strokeOpacity={0.7}
              strokeDasharray="5 5"
              label={{ value: `${target}% target`, position: 'insideBottomRight', fill: c.muted, fontSize: 11 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: c.line, strokeOpacity: 0.25, strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="percentage"
              stroke={`url(#stroke-${id})`}
              strokeWidth={2}
              fill={`url(#fill-${id})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: c.resolved === 'dark' ? '#0b1026' : '#ffffff', fill: c.a2 }}
              animationDuration={1300}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
