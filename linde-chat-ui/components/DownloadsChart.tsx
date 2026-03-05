'use client';
import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { getMockDownloads, type Timeframe } from '@/lib/dashboardData';

/**
 * DownloadsChart
 * ─────────────────────────────────────────────────────────────────
 * Real-data integration: replace `getMockDownloads(timeframe)` with
 *   const data = await fetch(`/api/dashboard/downloads?tf=${timeframe}`).then(r => r.json())
 * The component accepts `DownloadPoint[]` with { label, count }.
 */

const TIMEFRAMES: { key: Timeframe; label: string }[] = [
  { key: 'day',   label: 'Day'   },
  { key: 'week',  label: 'Week'  },
  { key: 'month', label: 'Month' },
  { key: 'year',  label: 'Year'  },
];

// Recharts custom tooltip
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-value">
        <span className="chart-tooltip-dot" style={{ background: '#3b82f6' }} />
        {payload[0].value} downloads
      </div>
    </div>
  );
}

export default function DownloadsChart() {
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  // PLACEHOLDER: swap getMockDownloads with real fetch when available
  const data = useMemo(() => getMockDownloads(timeframe), [timeframe]);

  return (
    <div className="chart-card">
      {/* Header */}
      <div className="chart-card-header">
        <div>
          <div className="chart-card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M12 12v6M9 15l3 3 3-3"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            Document Downloads
          </div>
          <div className="chart-card-sub">Download activity over time</div>
        </div>

        {/* Timeframe toggle */}
        <div className="tf-toggle" role="group" aria-label="Select timeframe">
          {TIMEFRAMES.map(({ key, label }) => (
            <motion.button
              key={key}
              className={`tf-btn${timeframe === key ? ' tf-btn-active' : ''}`}
              onClick={() => setTimeframe(key)}
              whileTap={{ scale: 0.93 }}
              aria-pressed={timeframe === key}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <motion.div
        className="chart-area"
        key={timeframe}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={timeframe === 'month' ? 4 : 0}
            />
            <YAxis
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(59,130,246,0.25)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2.2}
              fill="url(#dlGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6', stroke: 'rgba(10,18,35,0.9)', strokeWidth: 2 }}
              animationDuration={700}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
