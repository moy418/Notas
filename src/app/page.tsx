"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    grossSales: 0,
    taxCollected: 0,
    netRevenue: 0,
    totalInvoices: 0,
    pendingRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);

  // Format: "YYYY-MM" (Standard HTML month input format)
  const [selectedMonth, setSelectedMonth] = useState('');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/invoices');
        const data = await res.json();
        if (data.success && data.data) {
          const invoices = data.data;
          setAllInvoices(invoices);
        }
      } catch (err) {
        console.error("Failed to load metrics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    let gross = 0;
    let tax = 0;
    let pending = 0;
    let count = 0;

    allInvoices.forEach((inv: any) => {
      // If a month is selected, ignore invoices not matching the 'YYYY-MM' prefix
      if (selectedMonth && !inv.createdAt.startsWith(selectedMonth)) {
        return;
      }

      count++;
      gross += parseFloat(inv.total) || 0;
      tax += parseFloat(inv.tax) || 0;
      if (inv.status === 'pending') {
        pending += parseFloat(inv.total) || 0;
      }
    });

    setMetrics({
      grossSales: gross,
      taxCollected: tax,
      netRevenue: gross - tax,
      totalInvoices: count,
      pendingRevenue: pending
    });

    // Chart Data Processing
    // If a month is selected, aggregate by day. Otherwise, aggregate by month.
    const aggregated: Record<string, { gross: number, net: number }> = {};

    allInvoices.forEach((inv: any) => {
      if (selectedMonth && !inv.createdAt.startsWith(selectedMonth)) return;

      const dateObj = new Date(inv.createdAt);
      let key = '';

      if (selectedMonth) {
        // Aggregate by day: e.g. "01", "02", "15"
        key = dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
      } else {
        // Aggregate by month: e.g. "Jan 2026", "Feb 2026"
        key = dateObj.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      }

      if (!aggregated[key]) {
        aggregated[key] = { gross: 0, net: 0 };
      }

      const invTotal = parseFloat(inv.total) || 0;
      const invTax = parseFloat(inv.tax) || 0;

      aggregated[key].gross += invTotal;
      aggregated[key].net += (invTotal - invTax);
    });

    // Convert to array and sort chronologically 
    // For sorting, we can rely on parsing the key back into a timestamp
    const dataArray = Object.keys(aggregated).map(key => ({
      name: key,
      'Gross Sales': aggregated[key].gross,
      'Net Revenue': aggregated[key].net,
    })).sort((a, b) => {
      // A simple string parsing approach since the keys are nicely formatted dates
      return new Date(a.name).getTime() - new Date(b.name).getTime();
    });

    setChartData(dataArray);

  }, [allInvoices, selectedMonth]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="dashboard-layout fade-in">
      <Sidebar />
      <main className="main-content">
        <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Financial Dashboard</h1>
            <p>Overview of your revenue and invoice history</p>
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label htmlFor="monthFilter" style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>Filter by Month:</label>
            <input
              id="monthFilter"
              type="month"
              className="premium-input"
              style={{ width: 'auto', padding: '0.5rem', background: 'rgba(15, 23, 42, 0.9)' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        </header>

        {loading ? (
          <div className="loading-state">Loading metrics...</div>
        ) : (
          <div className="metrics-grid">
            <div className="metric-card glass-panel">
              <h3>Total Gross Sales</h3>
              <div className="metric-value">{formatCurrency(metrics.grossSales)}</div>
            </div>
            <div className="metric-card glass-panel">
              <h3>Tax Collected</h3>
              <div className="metric-value">{formatCurrency(metrics.taxCollected)}</div>
            </div>
            <div className="metric-card glass-panel">
              <h3>Net Revenue</h3>
              <div className="metric-value text-success">{formatCurrency(metrics.netRevenue)}</div>
            </div>
            <div className="metric-card glass-panel" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <h3>Pending Revenue</h3>
              <div className="metric-value" style={{ color: '#fcd34d' }}>{formatCurrency(metrics.pendingRevenue)}</div>
            </div>
            <div className="metric-card glass-panel">
              <h3>Total Invoices</h3>
              <div className="metric-value">{metrics.totalInvoices}</div>
            </div>
          </div>
        )}

        {!loading && chartData.length > 0 && (
          <div className="chart-container glass-panel" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#f8fafc' }}>
              Revenue Trend {selectedMonth ? `(${new Date(selectedMonth + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })})` : '(All Time)'}
            </h3>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Gross Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Net Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="quick-actions" style={{ marginTop: '2rem' }}>
          <Link href="/create" className="premium-button">
            + Create New Invoice
          </Link>
          <Link href="/history" className="premium-button secondary">
            View History
          </Link>
        </div>
      </main>
    </div>
  );
}
