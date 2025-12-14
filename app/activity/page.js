"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Icon } from '@/app/components/Icons';
import { ToastContext } from '@/app/components/ToastProvider';
import { useTheme } from '@/app/contexts/ThemeContext';
import Pager from '@/app/components/Pager';

export default function ActivityLogsPage() {
  const { data: session } = useSession();
  const { notify } = React.useContext(ToastContext);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#111827' : '#f5f6f8';
  const cardBg = isDark ? '#1f2937' : '#fff';
  const textColor = isDark ? '#f9fafb' : '#000';
  const mutedColor = isDark ? '#9ca3af' : '#666';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const inputBg = isDark ? '#111827' : '#fff';
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    startDate: '',
    endDate: ''
  });

  const actionTypes = ['create', 'update', 'delete', 'login'];
  const entityTypes = ['imei', 'sold', 'brand', 'staff', 'admin', 'profile', 'auth'];

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ 
      page: page.toString(), 
      pageSize: pageSize.toString() 
    });
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    try {
      const res = await fetch(`/api/activity?${params}`);
      if (!res.ok) {
        notify('Failed to load activity logs', 'error');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error loading logs:', error);
      notify('Failed to load activity logs', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, pageSize, filters]);

  function clearFilters() {
    setFilters({
      action: '',
      entityType: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  }

  function getActiveFiltersCount() {
    return Object.values(filters).filter(v => v !== '').length;
  }

  function getActionIcon(action) {
    switch (action) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'login': return '🔐';
      default: return '📝';
    }
  }

  function getEntityIcon(entityType) {
    switch (entityType) {
      case 'imei': return '📱';
      case 'sold': return '💰';
      case 'brand': return '🏷️';
      case 'staff': return '👥';
      case 'admin': return '👤';
      case 'profile': return '⚙️';
      case 'auth': return '🔐';
      default: return '📄';
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: bgColor, padding: '16px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ padding: '16px 0', marginBottom: '20px', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: textColor, margin: '0 0 4px 0' }}>
              Activity Logs
            </h1>
            <p style={{ color: mutedColor, fontSize: '14px', margin: '0' }}>
              Track all user actions and system events
            </p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div style={{
        padding: '16px 0',
        marginBottom: '20px',
        borderBottom: `1px solid ${borderColor}`
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            style={{
              padding: '10px 12px',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              fontSize: '14px',
              background: inputBg,
              color: textColor,
              cursor: 'pointer'
            }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '10px 16px',
              border: `1px solid ${isDark ? '#f9fafb' : '#000'}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              background: showFilters ? (isDark ? '#f9fafb' : '#000') : cardBg,
              color: showFilters ? (isDark ? '#000' : '#fff') : textColor,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <Icon.Filter width={16} height={16} />
            Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
          </button>
          {getActiveFiltersCount() > 0 && (
            <button
              onClick={clearFilters}
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
              Clear All
            </button>
          )}
        </div>

        {/* Active Filters Chips */}
        {getActiveFiltersCount() > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: mutedColor }}>Active filters:</span>
            {filters.action && (
              <span style={{ padding: '4px 10px', background: isDark ? '#374151' : '#f0f0f0', borderRadius: '12px', fontSize: '12px', color: textColor }}>
                Action: {filters.action} <button onClick={() => setFilters({...filters, action: ''})} style={{ marginLeft: '6px', background: 'none', border: 'none', cursor: 'pointer', color: textColor }}>×</button>
              </span>
            )}
            {filters.entityType && (
              <span style={{ padding: '4px 10px', background: isDark ? '#374151' : '#f0f0f0', borderRadius: '12px', fontSize: '12px', color: textColor }}>
                Entity: {filters.entityType} <button onClick={() => setFilters({...filters, entityType: ''})} style={{ marginLeft: '6px', background: 'none', border: 'none', cursor: 'pointer', color: textColor }}>×</button>
              </span>
            )}
            {filters.startDate && (
              <span style={{ padding: '4px 10px', background: isDark ? '#374151' : '#f0f0f0', borderRadius: '12px', fontSize: '12px', color: textColor }}>
                From: {filters.startDate} <button onClick={() => setFilters({...filters, startDate: ''})} style={{ marginLeft: '6px', background: 'none', border: 'none', cursor: 'pointer', color: textColor }}>×</button>
              </span>
            )}
            {filters.endDate && (
              <span style={{ padding: '4px 10px', background: isDark ? '#374151' : '#f0f0f0', borderRadius: '12px', fontSize: '12px', color: textColor }}>
                To: {filters.endDate} <button onClick={() => setFilters({...filters, endDate: ''})} style={{ marginLeft: '6px', background: 'none', border: 'none', cursor: 'pointer', color: textColor }}>×</button>
              </span>
            )}
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div style={{
            marginTop: '16px',
            padding: '20px',
            background: isDark ? '#111827' : '#f8f9fa',
            borderRadius: '8px',
            border: `1px solid ${borderColor}`
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: textColor, marginBottom: '6px' }}>
                  Action Type
                </label>
                <select
                  value={filters.action}
                  onChange={e => { setFilters({...filters, action: e.target.value}); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: inputBg,
                    color: textColor,
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Actions</option>
                  {actionTypes.map(a => (
                    <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: textColor, marginBottom: '6px' }}>
                  Entity Type
                </label>
                <select
                  value={filters.entityType}
                  onChange={e => { setFilters({...filters, entityType: e.target.value}); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: inputBg,
                    color: textColor,
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Entities</option>
                  {entityTypes.map(e => (
                    <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: textColor, marginBottom: '6px' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={e => { setFilters({...filters, startDate: e.target.value}); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: inputBg,
                    color: textColor,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: textColor, marginBottom: '6px' }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={e => { setFilters({...filters, endDate: e.target.value}); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: inputBg,
                    color: textColor,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div style={{ padding: '0' }}>
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
              border: `4px solid ${isDark ? '#374151' : '#f3f3f3'}`,
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ marginLeft: '16px', color: mutedColor }}>Loading logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: mutedColor }}>
            No activity logs found
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="desktop-only">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: isDark ? '#111827' : '#f8f9fa' }}>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: textColor, borderBottom: `1px solid ${borderColor}` }}>Time</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: textColor, borderBottom: `1px solid ${borderColor}` }}>User</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: textColor, borderBottom: `1px solid ${borderColor}` }}>Action</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: textColor, borderBottom: `1px solid ${borderColor}` }}>Entity</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: textColor, borderBottom: `1px solid ${borderColor}` }}>Description</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: textColor, borderBottom: `1px solid ${borderColor}` }}>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                      <td style={{ padding: '16px', color: textColor, fontSize: '13px' }}>
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ padding: '16px', color: textColor }}>
                        <div style={{ fontWeight: '500' }}>{log.user_name || 'System'}</div>
                        {log.user_id && (
                          <div style={{ fontSize: '12px', color: mutedColor }}>ID: {log.user_id}</div>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          background: log.action === 'create' ? '#e8f5e9' : log.action === 'update' ? '#e3f2fd' : log.action === 'delete' ? '#ffebee' : '#f3e5f5',
                          color: log.action === 'create' ? '#2e7d32' : log.action === 'update' ? '#1976d2' : log.action === 'delete' ? '#c62828' : '#7b1fa2',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {getActionIcon(log.action)} {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {log.entity_type ? (
                          <span style={{
                            padding: '4px 10px',
                            background: isDark ? '#374151' : '#f0f0f0',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: textColor,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {getEntityIcon(log.entity_type)} {log.entity_type}
                          </span>
                        ) : (
                          <span style={{ color: mutedColor }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', color: textColor, fontSize: '13px', maxWidth: '400px' }}>
                        {log.description || '—'}
                      </td>
                      <td style={{ padding: '16px', color: mutedColor, fontSize: '12px' }}>
                        {log.ip_address || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-only" style={{
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {logs.map(log => (
                <div key={log.id} style={{
                  borderRadius: '4px',
                  padding: '12px',
                  background: cardBg,
                  borderBottom: `1px solid ${borderColor}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '4px' }}>
                        {log.user_name || 'System'}
                      </div>
                      <div style={{ fontSize: '12px', color: mutedColor }}>
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      background: log.action === 'create' ? '#e8f5e9' : log.action === 'update' ? '#e3f2fd' : log.action === 'delete' ? '#ffebee' : '#f3e5f5',
                      color: log.action === 'create' ? '#2e7d32' : log.action === 'update' ? '#1976d2' : log.action === 'delete' ? '#c62828' : '#7b1fa2',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {getActionIcon(log.action)} {log.action}
                    </span>
                  </div>
                  
                  {log.entity_type && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        background: isDark ? '#374151' : '#f0f0f0',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: textColor,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {getEntityIcon(log.entity_type)} {log.entity_type}
                      </span>
                    </div>
                  )}
                  
                  <div style={{ fontSize: '13px', color: textColor, marginBottom: '8px', lineHeight: '1.5' }}>
                    {log.description || '—'}
                  </div>
                  
                  {log.ip_address && (
                    <div style={{ fontSize: '11px', color: mutedColor }}>
                      IP: {log.ip_address}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {total > pageSize && (
              <div style={{ padding: '20px', borderTop: `1px solid ${borderColor}` }}>
                <Pager
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

