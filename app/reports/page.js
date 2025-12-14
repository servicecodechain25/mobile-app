"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Icon } from '@/app/components/Icons';
import { ToastContext } from '@/app/components/ToastProvider';

export default function ReportsPage() {
  const { data: session } = useSession();
  const { notify } = React.useContext(ToastContext);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    salesTrend: [],
    brandDistribution: [],
    monthlySales: [],
    topBrands: [],
    comparison: [],
    statistics: {}
  });

  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  async function loadReports() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) {
        notify('Failed to load reports', 'error');
        return;
      }
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error('Error loading reports:', error);
      notify('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  // Chart dimensions
  const chartHeight = 200;
  const chartWidth = 600;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };

  // Bar Chart Component
  function BarChart({ data, xKey, yKey, labelKey, color = '#667eea', height = chartHeight, width = chartWidth }) {
    if (!data || data.length === 0) {
      return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No data available</div>;
    }

    const maxValue = Math.max(...data.map(d => d[yKey] || 0));
    const chartAreaWidth = width - padding.left - padding.right;
    const chartAreaHeight = height - padding.top - padding.bottom;
    const barWidth = chartAreaWidth / data.length - 10;

    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const value = maxValue * ratio;
          const y = padding.top + chartAreaHeight - (chartAreaHeight * ratio);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#666">
                {maxValue > 1000 ? `${(value / 1000).toFixed(1)}k` : Math.round(value)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = ((item[yKey] || 0) / maxValue) * chartAreaHeight;
          const x = padding.left + (index * (chartAreaWidth / data.length)) + 5;
          const y = padding.top + chartAreaHeight - barHeight;
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="4"
              />
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="10"
                fill="#333"
                fontWeight="600"
              >
                {item[yKey] || 0}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#666"
                transform={`rotate(-45 ${x + barWidth / 2} ${height - padding.bottom + 15})`}
              >
                {item[xKey] || item[labelKey] || ''}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // Line Chart Component
  function LineChart({ data, xKey, yKey, color = '#667eea', height = chartHeight, width = chartWidth }) {
    if (!data || data.length === 0) {
      return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No data available</div>;
    }

    const maxValue = Math.max(...data.map(d => d[yKey] || 0));
    const chartAreaWidth = width - padding.left - padding.right;
    const chartAreaHeight = height - padding.top - padding.bottom;

    const points = data.map((item, index) => {
      const x = padding.left + (index / (data.length - 1 || 1)) * chartAreaWidth;
      const y = padding.top + chartAreaHeight - ((item[yKey] || 0) / maxValue) * chartAreaHeight;
      return { x, y, value: item[yKey] || 0, label: item[xKey] };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding.top + chartAreaHeight - (chartAreaHeight * ratio);
          return (
            <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
          );
        })}

        {/* Line */}
        <path d={pathData} fill="none" stroke={color} strokeWidth="2" />

        {/* Points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="4" fill={color} />
            <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize="10" fill="#333" fontWeight="600">
              {point.value}
            </text>
            {index % Math.ceil(data.length / 5) === 0 && (
              <text
                x={point.x}
                y={height - padding.bottom + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#666"
              >
                {formatDate(point.label)}
              </text>
            )}
          </g>
        ))}
      </svg>
    );
  }

  // Horizontal Bar Chart
  function HorizontalBarChart({ data, labelKey, valueKey, color = '#667eea', height = 300, width = 500 }) {
    if (!data || data.length === 0) {
      return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No data available</div>;
    }

    const maxValue = Math.max(...data.map(d => d[valueKey] || 0));
    const barHeight = 30;
    const spacing = 10;
    const chartAreaWidth = width - padding.left - padding.right;

    return (
      <svg width={width} height={Math.min(height, data.length * (barHeight + spacing) + padding.top + padding.bottom)} style={{ overflow: 'visible' }}>
        {data.map((item, index) => {
          const barWidth = ((item[valueKey] || 0) / maxValue) * chartAreaWidth;
          const y = padding.top + index * (barHeight + spacing);
          
          return (
            <g key={index}>
              <rect
                x={padding.left}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="4"
              />
              <text
                x={padding.left - 10}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fontSize="12"
                fill="#333"
              >
                {item[labelKey] || ''}
              </text>
              <text
                x={padding.left + barWidth + 10}
                y={y + barHeight / 2 + 4}
                fontSize="12"
                fill="#333"
                fontWeight="600"
              >
                {item[valueKey] || 0}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8', padding: '16px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ padding: '20px 0', marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#000', margin: '0 0 4px 0' }}>
              Reports & Analytics
            </h1>
            <p style={{ color: '#666', fontSize: '14px', margin: '0' }}>
              Comprehensive insights and visualizations
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e => setDateRange({...dateRange, startDate: e.target.value})}
              placeholder="Start Date"
              style={{
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={e => setDateRange({...dateRange, endDate: e.target.value})}
              placeholder="End Date"
              style={{
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            {(dateRange.startDate || dateRange.endDate) && (
              <button
                onClick={() => setDateRange({ startDate: '', endDate: '' })}
                style={{
                  padding: '10px 16px',
                  background: '#f44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ marginLeft: '16px', color: '#666' }}>Loading reports...</span>
        </div>
      ) : (
        <>
          {/* Summary Statistics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Items</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#000' }}>{reportData.statistics.total_items || 0}</div>
            </div>
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Sold Items</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#22c55e' }}>{reportData.statistics.sold_items || 0}</div>
            </div>
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Purchase</div>
              <div style={{ fontSize: '22px', fontWeight: '600', color: '#000' }}>{formatCurrency(reportData.statistics.total_purchase)}</div>
            </div>
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Sales</div>
              <div style={{ fontSize: '22px', fontWeight: '600', color: '#000' }}>{formatCurrency(reportData.statistics.total_sales)}</div>
            </div>
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Profit</div>
              <div style={{ fontSize: '22px', fontWeight: '600', color: (reportData.statistics.total_profit || 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                {formatCurrency(reportData.statistics.total_profit)}
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
            {/* Sales Trend Chart */}
            <div style={{ padding: '20px 0', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#000', margin: '0 0 20px 0' }}>
                Sales Trend
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <LineChart
                  data={reportData.salesTrend}
                  xKey="date"
                  yKey="count"
                  color="#667eea"
                  width={Math.max(600, reportData.salesTrend.length * 50)}
                />
              </div>
            </div>

            {/* Monthly Sales Chart */}
            <div style={{ padding: '20px 0', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#000', margin: '0 0 20px 0' }}>
                Monthly Sales
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <BarChart
                  data={reportData.monthlySales}
                  xKey="month"
                  yKey="count"
                  color="#22c55e"
                  width={Math.max(600, reportData.monthlySales.length * 80)}
                />
              </div>
            </div>

            {/* Brand Distribution */}
            <div style={{ padding: '20px 0', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#000', margin: '0 0 20px 0' }}>
                Brand Distribution
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <BarChart
                  data={reportData.brandDistribution}
                  xKey="brand"
                  yKey="count"
                  labelKey="brand"
                  color="#764ba2"
                  width={Math.max(600, reportData.brandDistribution.length * 80)}
                />
              </div>
            </div>

            {/* Purchase vs Sales Comparison */}
            <div style={{ padding: '20px 0', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#000', margin: '0 0 20px 0' }}>
                Purchase vs Sales Comparison
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <svg width={Math.max(600, reportData.comparison.length * 80)} height={chartHeight} style={{ overflow: 'visible' }}>
                  {reportData.comparison.map((item, index) => {
                    const maxValue = Math.max(...reportData.comparison.map(d => Math.max(d.total_purchase || 0, d.total_sales || 0)));
                    const chartAreaWidth = Math.max(600, reportData.comparison.length * 80) - padding.left - padding.right;
                    const chartAreaHeight = chartHeight - padding.top - padding.bottom;
                    const barWidth = (chartAreaWidth / reportData.comparison.length) / 2 - 5;
                    const x = padding.left + (index * (chartAreaWidth / reportData.comparison.length));
                    
                    const purchaseHeight = ((item.total_purchase || 0) / maxValue) * chartAreaHeight;
                    const salesHeight = ((item.total_sales || 0) / maxValue) * chartAreaHeight;
                    
                    return (
                      <g key={index}>
                        <rect
                          x={x}
                          y={padding.top + chartAreaHeight - purchaseHeight}
                          width={barWidth}
                          height={purchaseHeight}
                          fill="#ef4444"
                          rx="4"
                        />
                        <rect
                          x={x + barWidth + 5}
                          y={padding.top + chartAreaHeight - salesHeight}
                          width={barWidth}
                          height={salesHeight}
                          fill="#22c55e"
                          rx="4"
                        />
                        <text
                          x={x + barWidth}
                          y={chartHeight - padding.bottom + 15}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#666"
                        >
                          {item.month}
                        </text>
                      </g>
                    );
                  })}
                  <g transform={`translate(${Math.max(600, reportData.comparison.length * 80) - 100}, 20)`}>
                    <rect x="0" y="0" width="12" height="12" fill="#ef4444" />
                    <text x="18" y="10" fontSize="12" fill="#666">Purchase</text>
                    <rect x="0" y="20" width="12" height="12" fill="#22c55e" />
                    <text x="18" y="30" fontSize="12" fill="#666">Sales</text>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Top Selling Brands */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#000', margin: '0 0 20px 0' }}>
              Top Selling Brands
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <HorizontalBarChart
                data={reportData.topBrands}
                labelKey="brand"
                valueKey="sold_count"
                color="#667eea"
                width={800}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

