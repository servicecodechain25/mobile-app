'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Icon } from '@/app/components/Icons';
import { ConfirmDialog, Modal } from '@/app/components/Modal';
import { ToastContext } from '@/app/components/ToastProvider';
import Pager from '@/app/components/Pager';

export default function BrandsPage() {
  const { data: session } = useSession();
  const { notify } = React.useContext(ToastContext);
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
    <div className="brands-container" style={{ minHeight: '100vh', background: '#f9fafb', padding: '20px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header Section */}
      <div className="brands-header" style={{
        padding: '20px 0',
        marginBottom: '20px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div>
            <h1 className="brands-title" style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#111',
              margin: '0 0 8px 0'
            }}>
              Brand Management
            </h1>
            <p className="brands-subtitle" style={{
              color: '#666',
              fontSize: '18px',
              margin: '0'
            }}>
              Manage phone brands for IMEI records
            </p>
          </div>
        </div>

        {/* Add Brand Form */}
        <form onSubmit={addBrand} className="add-brand-form" style={{
          display: 'grid',
          gap: '20px',
          padding: '20px 0',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#333',
            margin: '0 0 16px 0'
          }}>
            Create New Brand
          </h3>
          
          <div className="brand-form-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
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
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
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
                borderRadius: '4px',
                border: isActive ? '1px solid #4caf50' : '1px solid #e5e7eb',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span style={{ fontWeight: '500' }}>Active</span>
              </label>
            </div>
          </div>
          
          <button
            type="submit"
            style={{
              background: '#111827',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              width: 'fit-content',
              margin: '0 auto'
            }}
          >
            <Icon.Edit />
            Create Brand
          </button>
        </form>
      </div>

      {/* Filters Section */}
      <div className="brands-filters" style={{
        padding: '20px 0',
        marginBottom: '20px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#333',
          margin: '0 0 16px 0'
        }}>
          Search & Filter
        </h3>
        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px'
            }}>
              Search Brands
            </label>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name..."
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px'
            }}>
              Items
            </label>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              style={{
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '14px',
                background: '#fff',
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
      <div className="brands-content" style={{ padding: '20px 0' }}>
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
            <span style={{ marginLeft: '16px', color: '#666' }}>Loading brands...</span>
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
                  <tr style={{ background: '#f7f7f8' }}>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: '#333', borderBottom: '1px solid #e5e7eb' }}>ID</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: '#333', borderBottom: '1px solid #e5e7eb' }}>Brand Name</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: '#333', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: '#333', borderBottom: '1px solid #e5e7eb' }}>Created</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontWeight: '600', color: '#333', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map(brand => (
                    <tr key={brand.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '16px', color: '#333', fontWeight: '500' }}>{brand.id}</td>
                      <td style={{ padding: '16px', color: '#333', fontWeight: '500' }}>{brand.name}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          background: brand.is_active ? '#d1fae5' : '#fee2e2', 
                          color: brand.is_active ? '#065f46' : '#991b1b', 
                          padding: '4px 10px', 
                          fontSize: '12px', 
                          fontWeight: '600' 
                        }}>
                          {brand.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#666', fontSize: '14px' }}>{new Date(brand.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={() => startEdit(brand)} className="icon-btn" title="Edit" style={{ background:'transparent', border:'1px solid #e5e7eb', color:'#374151', padding:6, borderRadius:4 }}><Icon.Edit /></button>
                          <button type="button" onClick={() => setConfirmId(brand.id)} className="icon-btn" title="Delete" style={{ background:'transparent', border:'1px solid #e5e7eb', color:'#374151', padding:6, borderRadius:4 }}><Icon.Trash /></button>
                        </div>
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
              {brands.map(brand => (
                <div key={brand.id} className="brand-card" style={{
                  padding: '12px',
                  borderBottom: '1px solid #e5e7eb',
                  background: '#fff',
                  borderRadius: '4px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{ color: '#6b7280', padding: '4px 0', fontSize: '12px', fontWeight: '500' }}>
                      ID: {brand.id}
                    </div>
                    <span style={{ 
                      background: brand.is_active ? '#d1fae5' : '#fee2e2', 
                      color: brand.is_active ? '#065f46' : '#991b1b', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px', 
                      fontWeight: '500' 
                    }}>
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '12px', color: '#666' }}>Brand: </span>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>{brand.name}</span>
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
                        background: '#111827',
                        color: 'white',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon.Edit />
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
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icon.Trash />
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
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
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
                border: '2px solid #e1e5e9',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
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
                borderRadius: '4px',
              border: editIsActive ? '1px solid #4caf50' : '1px solid #e5e7eb',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={e => setEditIsActive(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
              <span style={{ fontWeight: '500' }}>Active</span>
            </label>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setEditBrand(null); setEditName(''); setEditIsActive(true); }}
              style={{
                background: '#f3f4f6',
                color: '#374151',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '4px',
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
                background: '#3b82f6',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '4px',
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

