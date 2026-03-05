/**
 * Dashboard mock data
 * ─────────────────────────────────────────────────────────────────
 * PLACEHOLDER: Replace each function with a real API call when
 * backend endpoints are available.
 *
 * Suggested integration pattern:
 *   async function fetchMetrics(): Promise<MetricData> {
 *     const res = await fetch('/api/dashboard/metrics');
 *     return res.json();
 *   }
 *
 * The components consume the data shapes below — the shape itself
 * does not need to change when switching to live data.
 */

export type Timeframe = 'day' | 'week' | 'month' | 'year';

// ── Metric cards ──────────────────────────────────────────────────
export interface MetricData {
  totalDownloads: number;
  totalOrders: number;
  totalConversations: number;
  activeSessions: number;
  downloadsDelta: number;   // % change vs previous period (positive = up)
  ordersDelta: number;
  conversationsDelta: number;
  sessionsDelta: number;
}

// PLACEHOLDER
export function getMockMetrics(): MetricData {
  return {
    totalDownloads:      847,
    totalOrders:         312,
    totalConversations:  1240,
    activeSessions:      28,
    downloadsDelta:      +14.2,
    ordersDelta:         +6.5,
    conversationsDelta:  +22.1,
    sessionsDelta:       -3.4,
  };
}

// ── Downloads chart ───────────────────────────────────────────────
export interface DownloadPoint {
  label: string;   // x-axis label
  count: number;   // y-axis value
}

// PLACEHOLDER — generates plausible-looking data for each timeframe
export function getMockDownloads(timeframe: Timeframe): DownloadPoint[] {
  const rand = (base: number, spread: number) =>
    Math.max(0, Math.round(base + (Math.random() - 0.5) * spread));

  if (timeframe === 'day') {
    return ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'].map(h => ({
      label: `${h}:00`,
      count: rand(h < '06' || h > '20' ? 2 : 28, 18),
    }));
  }
  if (timeframe === 'week') {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({
      label: d,
      count: rand(d === 'Sat' || d === 'Sun' ? 12 : 45, 28),
    }));
  }
  if (timeframe === 'month') {
    return Array.from({ length: 30 }, (_, i) => ({
      label: `${i + 1}`,
      count: rand(38, 32),
    }));
  }
  // year
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => ({
    label: m,
    count: rand(120, 90),
  }));
}

// ── Orders chart ─────────────────────────────────────────────────
export interface OrderStatusSlice {
  name: string;
  value: number;
  color: string;
}

// PLACEHOLDER
export function getMockOrderStatus(): OrderStatusSlice[] {
  return [
    { name: 'Delivered',        value: 148, color: '#10b981' },
    { name: 'In Transit',       value:  72, color: '#f59e0b' },
    { name: 'Confirmed/Packed', value:  53, color: '#3b82f6' },
    { name: 'Delayed/On Hold',  value:  24, color: '#ef4444' },
    { name: 'Cancelled',        value:  15, color: '#6b7280' },
  ];
}
