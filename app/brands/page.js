'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Icon } from '@/app/components/Icons';
import { ConfirmDialog, Modal } from '@/app/components/Modal';
import { ToastContext } from '@/app/components/ToastProvider';
import { useTheme } from '@/app/contexts/ThemeContext';
import Pager from '@/app/components/Pager';

export default function BrandsPage() {
  const { data: session } = useSession();
  const { notify } = React.useContext(ToastContext);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#000000' : '#f9fafb';
  const textColor = isDark ? '#ffffff' : '#111827';
  const mutedColor = isDark ? '#9ca3af' : '#6b7280';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const [brands, setBrands] = useState([]);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [confirmId, setConfirmId] = useState(null);
  const [editBrand, setEditBrand] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: page, pageSize: pageSize });
    if (search) params.append('q', search);
    const res = await fetch(`/api/brands?${params}`);
    if (!res.ok) {
      notify('Failed to load brands', 'error');
      setLoading(false);
      return;
    }
    const data = await res.json();
    setBrands(Array.isArray(data.brands) ? data.brands : []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [page, pageSize, search]);

  async function addBrand(e) {
    e.preventDefault();
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, isActive }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      notify(data?.error || 'Failed to add brand', 'error');
      return;
    }
    setName('');
    setIsActive(true);
    load();
    notify('Brand created');
  }

  async function removeBrand(id) {
    const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' });
    if (res.ok) { 
      load(); 
      notify('Brand deleted'); 
    }
  }

  function startEdit(brand) {
    setEditBrand(brand);
    setEditName(brand.name);
    setEditIsActive(brand.is_active);
  }

  async function updateBrand(e) {
    e.preventDefault();
    if (!editBrand) return;
    
    const res = await fetch(`/api/brands/${editBrand.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: editName, 
        isActive: editIsActive 
      }),
    });
    
    if (res.ok) {
      setEditBrand(null);
      setEditName('');
      setEditIsActive(true);
      load();
      notify('Brand updated successfully');
    } else {
      const data = await res.json().catch(() => ({}));
      notify(data?.error || 'Failed to update brand', 'error');
    }
  }

  return (
    <div className="brands-container" style={{ minHeight: '100vh', background: bgColor, padding: '0 16px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header Section */}
      <div className="brands-header" style={{
        padding: '16px 0',
        marginBottom: '16px',
        borderBottom: `1px solid ${borderColor}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <div>
            <h1 className="brands-title" style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: textColor,
              margin: '0 0 8px 0'
            }}>
              Brands
            </h1>
            <p className="brands-subtitle" style={{
              color: mutedColor,
              fontSize: '14px',
              margin: '0'
            }}>
              Manage phone brands for IMEI records
            </p>
          </div>
        </div>

        {/* Add Brand Form */}
        <form onSubmit={addBrand} className="add-brand-form" style={{
          display: 'grid',
          gap: '16px',
          padding: '16px 0',
          borderBottom: `1px solid ${borderColor}`,
          marginBottom: '16px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: textColor,
            margin: '0 0 12px 0'
          }}>
            Create New Brand
          </h3>
          
          <div className="brand-form-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: textColor,
                marginBottom: '8px'
              }}>
                Brand Name
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter brand name"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: cardBg,
                  color: textColor
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: 'transparent',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span style={{ fontWeight: '500', color: textColor }}>Active</span>
              </label>
            </div>
          </div>
          
          <button
            type="submit"
            style={{
              background: isDark ? '#374151' : '#111827',
              color: isDark ? '#ffffff' : '#ffffff',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'right',
              gap: '8px',
              justifyContent: 'center',
              width: 'fit-content',
              // margin: '0 auto'
            }}
          >
            {/* <Icon.Edit /> */}
            Create Brand
          </button>
        </form>
      </div>

      {/* Filters Section */}
      <div className="brands-filters" style={{
        padding: '0 0 16px 0',
        marginBottom: '16px',
        borderBottom: `1px solid ${borderColor}`
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search brands..."
              style={{
                width: '100%',
                padding: '10px 16px',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                background: cardBg,
                color: textColor
              }}
            />
          </div>
          <div>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              style={{
                padding: '10px 16px',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                fontSize: '14px',
                background: cardBg,
                color: textColor,
                cursor: 'pointer'
              }}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="brands-content" style={{ padding: '0' }}>
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
            <span style={{ marginLeft: '16px', color: mutedColor }}>Loading brands...</span>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="desktop-only table-wrap">
              <table className="brands-table" style={{
                width: '100%',
                minWidth: 500,
                borderCollapse: 'collapse',
                background: 'transparent'
              }}>
                <thead>
                  <tr style={{ background: isDark ? '#1f2937' : '#f7f7f8' }}>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: textColor, borderBottom: `1px solid ${borderColor}` }}>ID</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: textColor, borderBottom: `1px solid ${borderColor}` }}>Brand Name</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: textColor, borderBottom: `1px solid ${borderColor}` }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: textColor, borderBottom: `1px solid ${borderColor}` }}>Created</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: textColor, borderBottom: `1px solid ${borderColor}` }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map(brand => (
                    <tr key={brand.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                      <td style={{ padding: '16px', color: textColor, fontWeight: '500' }}>{brand.id}</td>
                      <td style={{ padding: '16px', color: textColor, fontWeight: '500' }}>{brand.name}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          background: isDark ? (brand.is_active ? '#1f2937' : '#1f2937') : (brand.is_active ? '#d1fae5' : '#fee2e2'), 
                          color: brand.is_active ? (isDark ? '#22c55e' : '#065f46') : (isDark ? '#ef4444' : '#991b1b'), 
                          padding: '4px 10px', 
                          fontSize: '12px', 
                          fontWeight: '600',
                          border: `1px solid ${borderColor}`,
                          borderRadius: '4px'
                        }}>
                          {brand.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: mutedColor, fontSize: '14px' }}>{new Date(brand.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={() => startEdit(brand)} className="icon-btn" title="Edit" style={{ background:'transparent', border:`1px solid ${borderColor}`, color:textColor, padding:6, borderRadius:4 }}><Icon.Edit /></button>
                          <button type="button" onClick={() => setConfirmId(brand.id)} className="icon-btn" title="Delete" style={{ background:'transparent', border:`1px solid ${borderColor}`, color:textColor, padding:6, borderRadius:4 }}><Icon.Trash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-only">
              {brands.map(brand => (
                <div key={brand.id} className="brand-card" style={{
                  padding: '16px',
                  border: `1px solid ${borderColor}`,
                  background: cardBg,
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{ color: mutedColor, fontSize: '12px', fontWeight: '500' }}>
                      ID: {brand.id}
                    </div>
                    <span style={{ 
                      background: isDark ? '#1f2937' : (brand.is_active ? '#d1fae5' : '#fee2e2'), 
                      color: brand.is_active ? (isDark ? '#22c55e' : '#065f46') : (isDark ? '#ef4444' : '#991b1b'), 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px', 
                      fontWeight: '500',
                      border: `1px solid ${borderColor}`
                    }}>
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '12px', color: mutedColor }}>Brand: </span>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: textColor }}>{brand.name}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      className="btn"
                      onClick={() => startEdit(brand)}
                      style={{
                        background: isDark ? '#374151' : '#111827',
                        color: '#ffffff',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon.Edit width={14} height={14} />
                      Edit
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => setConfirmId(brand.id)}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon.Trash width={14} height={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
              <Pager page={page} pageSize={pageSize} total={total} onChange={setPage} />
            </div>
          </>
        )}
      </div>
      
      <ConfirmDialog
        open={!!confirmId}
        title="Delete Brand"
        message="Are you sure you want to delete this brand?"
        confirmText="Delete"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => { const id = confirmId; setConfirmId(null); removeBrand(id); }}
      />

      {/* Edit Brand Modal */}
      <Modal open={!!editBrand} title="Edit Brand" onClose={() => { setEditBrand(null); setEditName(''); setEditIsActive(true); }}>
        <form onSubmit={updateBrand} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 0' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
              Brand Name
            </label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Enter brand name"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                background: cardBg,
                color: textColor
              }}
            />
          </div>
          
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              background: 'transparent',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={e => setEditIsActive(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
              <span style={{ fontWeight: '500', color: textColor }}>Active</span>
            </label>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setEditBrand(null); setEditName(''); setEditIsActive(true); }}
              style={{
                background: isDark ? '#374151' : '#f3f4f6',
                color: textColor,
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: isDark ? '#374151' : '#111827',
                color: '#ffffff',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Update Brand
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

