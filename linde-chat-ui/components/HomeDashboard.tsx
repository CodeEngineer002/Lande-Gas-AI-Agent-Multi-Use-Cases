'use client';
import { motion } from 'framer-motion';
import MetricCards from './MetricCards';
import DownloadsChart from './DownloadsChart';
import OrdersChart from './OrdersChart';
import { getMockMetrics } from '@/lib/dashboardData';

/**
 * HomeDashboard
 * ─────────────────────────────────────────────────────────────────
 * Rendered in place of the chat workspace when the user clicks
 * the Home icon in the sidebar rail.
 *
 * Real-data integration: replace getMockMetrics() with a React
 * Server Component data fetch or a SWR/React-Query hook pointing
 * to /api/dashboard/metrics.
 */
export default function HomeDashboard() {
  const metrics = getMockMetrics();

  return (
    <motion.section
      className="home-dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Page header ── */}
      <div className="hd-page-header">
        <div>
          <h1 className="hd-title">Dashboard</h1>
          <p className="hd-subtitle">Overview of Linde AI Agent activity &amp; order metrics</p>
        </div>
        <div className="hd-header-badge">
          <span className="hd-live-dot" />
          Live
        </div>
      </div>

      {/* ── Metric overview cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
      >
        <MetricCards data={metrics} />
      </motion.div>

      {/* ── Charts row ── */}
      <motion.div
        className="hd-charts-row"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        <DownloadsChart />
        <OrdersChart />
      </motion.div>
    </motion.section>
  );
}
