'use client';
import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { getMockOrderStatus, type OrderStatusSlice } from '@/lib/dashboardData';

/**
 * OrdersChart — Donut chart for order status breakdown
 * ─────────────────────────────────────────────────────────────────
 * Real-data integration: replace `getMockOrderStatus()` with
 *   const data = await fetch('/api/dashboard/orders/status').then(r => r.json())
 * Shape: { name: string; value: number; color: string }[]
 */

function ChartTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: OrderStatusSlice }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{d.name}</div>
      <div className="chart-tooltip-value">
        <span className="chart-tooltip-dot" style={{ background: d.payload.color }} />
        {d.value} orders
      </div>
    </div>
  );
}

function CustomLegend({ data }: { data: OrderStatusSlice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="donut-legend">
      {data.map(item => (
        <div key={item.name} className="donut-legend-row">
          <span className="donut-legend-dot" style={{ background: item.color }} />
          <span className="donut-legend-name">{item.name}</span>
          <span className="donut-legend-pct">
            {total ? Math.round((item.value / total) * 100) : 0}%
          </span>
          <span className="donut-legend-val">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function OrdersChart() {
  // PLACEHOLDER: swap getMockOrderStatus with real fetch when available
  const data = useMemo(() => getMockOrderStatus(), []);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="chart-card">
      {/* Header */}
      <div className="chart-card-header">
        <div>
          <div className="chart-card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="6" width="15" height="11" rx="2"/>
              <path d="M16 10h4l3 4v3h-7V10z"/>
              <circle cx="5.5" cy="18.5" r="1.5"/>
              <circle cx="18.5" cy="18.5" r="1.5"/>
            </svg>
            Order Status
          </div>
          <div className="chart-card-sub">Current status breakdown · {total} total</div>
        </div>
      </div>

      {/* Chart + legend */}
      <motion.div
        className="chart-area donut-layout"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <div className="donut-wrap">
          {/* Centre label */}
          <div className="donut-centre">
            <span className="donut-centre-val">{total}</span>
            <span className="donut-centre-sub">Orders</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                animationBegin={100}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <CustomLegend data={data} />
      </motion.div>
    </div>
  );
}
