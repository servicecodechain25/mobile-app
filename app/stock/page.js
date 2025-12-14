"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Icon } from '@/app/components/Icons';

export default function StockPage() {
  const { data: session } = useSession();
  const [statistics, setStatistics] = useState({
    totalCount: 0,
    availableCount: 0,
    soldCount: 0,
    totalPurchaseAmount: 0,
    totalSoldAmount: 0,
    profit: 0
  });
  const [loading, setLoading] = useState(true);

  async function loadStatistics() {
    setLoading(true);
    try {
      const res = await fetch('/api/stock');
      if (!res.ok) {
        console.error('Failed to load statistics');
        return;
      }
      const data = await res.json();
      setStatistics(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatistics();
    // Refresh every 30 seconds
    const interval = setInterval(loadStatistics, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate percentages for doughnut chart
  const availablePercent = statistics.totalCount > 0 
    ? (statistics.availableCount / statistics.totalCount) * 100 
    : 0;
  const soldPercent = statistics.totalCount > 0 
    ? (statistics.soldCount / statistics.totalCount) * 100 
    : 0;

  // Doughnut chart calculation
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const availableLength = (availablePercent / 100) * circumference;
  const soldLength = (soldPercent / 100) * circumference;
  const availableOffset = circumference - availableLength;
  const soldOffset = circumference - soldLength;

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  return (
    <div className="stock-container" style={{ 
      minHeight: '100vh', 
      background: '#f9fafb', 
      padding: '20px', 
      width: '100%', 
      maxWidth: '100%', 
      boxSizing: 'border-box' 
    }}>
      {/* Header Section */}
      <div className="stock-header" style={{ 
        padding: '20px 0', 
        marginBottom: '20px', 
        borderBottom: '1px solid #e5e7eb' 
      }}>
        <h1 className="stock-title" style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: '#111', 
          margin: '0 0 8px 0' 
        }}>
          Stock Management
        </h1>
        <p className="stock-subtitle" style={{
          color: '#666',
          fontSize: '18px',
          margin: '0'
        }}>
          Welcome back, <strong style={{ color: '#333' }}>{session?.user?.name || 'User'}</strong>! 📊
        </p>
      </div>

      {loading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ marginLeft: '16px', color: '#666' }}>Loading statistics...</span>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '24px'
          }}>
            {/* Available Stock Card */}
            <div style={{
              background: '#111827',
              padding: '20px',
              color: 'white',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, opacity: 0.9 }}>Available Stock</h3>
                <Icon.Box style={{ fontSize: '24px', opacity: 0.8 }} />
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '4px' }}>
                {statistics.availableCount}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                {statistics.totalCount > 0 ? `${availablePercent.toFixed(1)}% of total` : 'No items'}
              </div>
            </div>

            {/* Sold Stock Card */}
            <div style={{
              background: '#111827',
              padding: '20px',
              color: 'white',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, opacity: 0.9 }}>Sold Items</h3>
                <Icon.CheckCircle style={{ fontSize: '24px', opacity: 0.8 }} />
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '4px' }}>
                {statistics.soldCount}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                {statistics.totalCount > 0 ? `${soldPercent.toFixed(1)}% of total` : 'No items'}
              </div>
            </div>

            {/* Total Purchase Card */}
            <div style={{
              background: '#111827',
              padding: '20px',
              color: 'white',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, opacity: 0.9 }}>Total Purchase</h3>
                <Icon.ShoppingCart style={{ fontSize: '24px', opacity: 0.8 }} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
                {formatCurrency(statistics.totalPurchaseAmount)}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                Purchase amount
              </div>
            </div>

            {/* Total Sold Amount Card */}
            <div style={{
              background: '#111827',
              padding: '20px',
              color: 'white',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, opacity: 0.9 }}>Total Sales</h3>
                <Icon.DollarSign style={{ fontSize: '24px', opacity: 0.8 }} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
                {formatCurrency(statistics.totalSoldAmount)}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                Sales amount
              </div>
            </div>
          </div>

          {/* Profit Card */}
          <div style={{
            background: '#111827',
            padding: '20px',
            color: 'white',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, opacity: 0.9 }}>
                {statistics.profit >= 0 ? 'Total Profit' : 'Total Loss'}
              </h3>
              {statistics.profit >= 0 ? (
                <Icon.TrendingUp style={{ fontSize: '24px', marginLeft: '8px', opacity: 0.8 }} />
              ) : (
                <Icon.TrendingDown style={{ fontSize: '24px', marginLeft: '8px', opacity: 0.8 }} />
              )}
            </div>
            <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
              {formatCurrency(Math.abs(statistics.profit))}
            </div>
            <div style={{ fontSize: '16px', opacity: 0.9 }}>
              {statistics.profit >= 0 
                ? `Profit margin: ${statistics.totalSoldAmount > 0 ? ((statistics.profit / statistics.totalSoldAmount) * 100).toFixed(2) : 0}%`
                : 'Loss detected'
              }
            </div>
          </div>

          {/* Doughnut Chart Section */}
          <div style={{
            background: '#fff',
            padding: '20px 0',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#333',
              margin: 0
            }}>
              Stock Distribution
            </h2>
            
            <div style={{ position: 'relative', width: '200px', height: '200px' }}>
              {/* SVG Doughnut Chart */}
              <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="20"
                />
                {/* Available stock segment */}
                {availablePercent > 0 && (
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke="#667eea"
                    strokeWidth="20"
                    strokeDasharray={circumference}
                    strokeDashoffset={availableOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                )}
                {/* Sold stock segment */}
                {soldPercent > 0 && (
                  <g style={{ transform: `rotate(${(availablePercent / 100) * 360}deg)` }}>
                    <circle
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="20"
                      strokeDasharray={circumference}
                      strokeDashoffset={soldOffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                  </g>
                )}
              </svg>
              
              {/* Center text */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
                  {statistics.totalCount}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Total</div>
              </div>
            </div>

            {/* Legend */}
            <div style={{
              display: 'flex',
              gap: '32px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#667eea'
                }} />
                <span style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>
                  Available ({statistics.availableCount})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#22c55e'
                }} />
                <span style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>
                  Sold ({statistics.soldCount})
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

