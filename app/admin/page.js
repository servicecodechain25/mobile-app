'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Icon } from '@/app/components/Icons';
import { ConfirmDialog, Modal } from '@/app/components/Modal';
import { ToastContext } from '@/app/components/ToastProvider';
import { useTheme } from '@/app/contexts/ThemeContext';
import Pager from '@/app/components/Pager';

export default function AdminPage() {
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
  const [admins, setAdmins] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState({
    dashboard: false,
    brands: false,
    stock: false,
    reports: false,
    activity: false,
    profile: false,
    staff: false
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [confirmId, setConfirmId] = useState(null);
  const [editAdmin, setEditAdmin] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPermissions, setEditPermissions] = useState({});
  const [viewAdmin, setViewAdmin] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Only superadmin can access this page
  if (session?.user?.role !== 'superadmin') {
    return <div>Access denied. Superadmin only.</div>;
  }

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: page, pageSize: pageSize });
    if (search) params.append('q', search);
    const res = await fetch(`/api/admin?${params}`);
    if (!res.ok) {
      notify('Failed to load admins', 'error');
      setLoading(false);
      return;
    }
    const data = await res.json();
    setAdmins(Array.isArray(data.admins) ? data.admins : []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [page, pageSize, search]);

  async function addAdmin(e) {
    e.preventDefault();
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, permissions }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      notify(data?.error || 'Failed to add admin', 'error');
      return;
    }
    setName('');
    setEmail('');
    setPassword('');
    setPermissions({ 
      dashboard: false, 
      brands: false, 
      stock: false, 
      reports: false, 
      activity: false, 
      profile: false, 
      staff: false 
    });
    load();
    notify('Admin created');
  }

  async function removeAdmin(id) {
    const res = await fetch(`/api/admin/${id}`, { method: 'DELETE' });
    if (res.ok) { 
      load(); 
      notify('Admin deleted'); 
    }
  }

  function startEdit(admin) {
    setEditAdmin(admin);
    setEditName(admin.name);
    setEditEmail(admin.email);
    
    // Use permissions from database or default values
    // Ensure permissions is an object with boolean values
    let parsedPermissions = admin.permissions;
    
    // Debug: Log the permissions to see what format they're in
    console.log('Admin permissions before parsing:', admin.permissions, typeof admin.permissions);
    
    // If permissions is a string, try to parse it
    if (typeof parsedPermissions === 'string') {
      try {
        parsedPermissions = JSON.parse(parsedPermissions);
      } catch (e) {
        console.error('Failed to parse permissions string:', e);
        parsedPermissions = null;
      }
    }
    
    // If permissions is an array or invalid, set to default
    if (!parsedPermissions || Array.isArray(parsedPermissions) || typeof parsedPermissions !== 'object') {
      console.log('Permissions invalid or array, using defaults');
      parsedPermissions = {
        dashboard: false,
        brands: false,
        stock: false,
        reports: false,
        activity: false,
        profile: false,
        staff: false
      };
    }
    
    // Ensure all permission keys exist with boolean values
    const normalizedPermissions = {
      dashboard: parsedPermissions.dashboard === true || parsedPermissions.dashboard === 'true' || parsedPermissions.dashboard === 1,
      brands: parsedPermissions.brands === true || parsedPermissions.brands === 'true' || parsedPermissions.brands === 1,
      stock: parsedPermissions.stock === true || parsedPermissions.stock === 'true' || parsedPermissions.stock === 1,
      reports: parsedPermissions.reports === true || parsedPermissions.reports === 'true' || parsedPermissions.reports === 1,
      activity: parsedPermissions.activity === true || parsedPermissions.activity === 'true' || parsedPermissions.activity === 1,
      profile: parsedPermissions.profile === true || parsedPermissions.profile === 'true' || parsedPermissions.profile === 1,
      staff: parsedPermissions.staff === true || parsedPermissions.staff === 'true' || parsedPermissions.staff === 1
    };
    
    console.log('Normalized permissions for edit:', normalizedPermissions);
    setEditPermissions(normalizedPermissions);
  }

  async function viewCompanyDetails(admin) {
    setViewAdmin(admin);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/admin/${admin.id}/details`);
      if (res.ok) {
        const data = await res.json();
        setCompanyDetails(data);
      } else {
        notify('Failed to load company details', 'error');
      }
    } catch (err) {
      console.error('Error loading company details:', err);
      notify('Failed to load company details', 'error');
    } finally {
      setLoadingDetails(false);
    }
  }

  async function updateAdmin(e) {
    e.preventDefault();
    if (!editAdmin) return;
    
    const res = await fetch(`/api/admin/${editAdmin.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: editName, 
        email: editEmail, 
        permissions: editPermissions 
      }),
    });
    
    if (res.ok) {
      setEditAdmin(null);
      setEditName('');
      setEditEmail('');
      setEditPermissions({
        dashboard: false,
        brands: false,
        stock: false,
        reports: false,
        activity: false,
        profile: false,
        staff: false
      });
      load();
      notify('Admin updated successfully');
    } else {
      const data = await res.json().catch(() => ({}));
      notify(data?.error || 'Failed to update admin', 'error');
    }
  }

  return (
    <div className="admin-container" style={{ minHeight: '100vh', background: isDark ? '#111827' : '#f9fafb', padding: '20px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header Section */}
      <div className="admin-header" style={{
        padding: '20px 0',
        marginBottom: '20px',
        borderBottom: `1px solid ${borderColor}`
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
            <h1 className="admin-title" style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: textColor,
              margin: '0 0 8px 0'
            }}>
              Admin Management
            </h1>
            <p className="admin-subtitle" style={{
              color: mutedColor,
              fontSize: '18px',
              margin: '0'
            }}>
              Create and manage admins with custom permissions
            </p>
          </div>
          
          {/* <button
            type="button"
            onClick={() => {
              // Scroll to the create admin form
              const form = document.querySelector('.add-admin-form');
              if (form) {
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            style={{
              background: '#3b82f6',
              color: 'white',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#2563eb';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#3b82f6';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <Icon.Edit />
            Create Admin
          </button> */}
        </div>

        {/* Add Admin Form */}
        <form onSubmit={addAdmin} className="add-admin-form" style={{
          display: 'grid',
          gap: '20px',
          padding: '20px 0',
          borderBottom: `1px solid ${borderColor}`,
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: textColor,
            margin: '0 0 16px 0'
          }}>
            Create New Admin
          </h3>
          
          <div className="admin-form-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
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
                Admin Name
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter admin name"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${borderColor}`,
                  borderRadius: '4px',
                  fontSize: '16px', 
                  boxSizing: 'border-box',
                  background: inputBg,
                  color: textColor
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: textColor,
                marginBottom: '8px'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${borderColor}`,
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  background: inputBg,
                  color: textColor
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: textColor,
                marginBottom: '8px'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${borderColor}`,
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  background: inputBg,
                  color: textColor
                }}
              />
            </div>
          </div>

          {/* Menu Permissions Section */}
          <div style={{
            marginTop: '8px',
            padding: '20px',
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: textColor,
              margin: '0 0 16px 0'
            }}>
              Menu Permissions
            </h4>
            <p style={{
              fontSize: '13px',
              color: mutedColor,
              margin: '0 0 16px 0'
            }}>
              Select which menus this company can access
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {[
                { key: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'IMEI scanning and records' },
                { key: 'brands', label: 'Brands', icon: '🏷️', desc: 'Manage phone brands' },
                { key: 'stock', label: 'Stock', icon: '📦', desc: 'View stock statistics' },
                { key: 'reports', label: 'Reports', icon: '📈', desc: 'View reports and analytics' },
                { key: 'activity', label: 'Activity Logs', icon: '📋', desc: 'View activity logs' },
                { key: 'profile', label: 'Company Profile', icon: '⚙️', desc: 'Manage company profile' },
                { key: 'staff', label: 'Staff Management', icon: '👥', desc: 'Manage staff members' }
              ].map(menu => (
                <label
                  key={menu.key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    border: permissions[menu.key] ? `1px solid ${isDark ? '#f9fafb' : '#000'}` : `1px solid ${borderColor}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: permissions[menu.key] ? (isDark ? '#374151' : '#f5f5f5') : 'transparent'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={permissions[menu.key] || false}
                    onChange={e => setPermissions({ ...permissions, [menu.key]: e.target.checked })}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginTop: '2px',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>
                      {menu.icon} {menu.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {menu.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            style={{
              background: isDark ? '#f9fafb' : '#000',
              color: isDark ? '#000' : 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
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
            Create Admin
          </button>
        </form>
      </div>

      {/* Filters Section */}
      <div className="admin-filters" style={{
        padding: '20px 0',
        marginBottom: '20px',
        borderBottom: `1px solid ${borderColor}`
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: textColor,
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
              color: textColor,
              marginBottom: '8px'
            }}>
              Search Admins
            </label>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email..."
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                background: inputBg,
                color: textColor
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: textColor,
              marginBottom: '8px'
            }}>
              Items
            </label>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              style={{
                padding: '12px 16px',
                border: `2px solid ${borderColor}`,
                borderRadius: '4px',
                fontSize: '16px',
                background: inputBg,
                color: textColor,
                cursor: 'pointer'
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="admin-content" style={{ padding: '20px 0' }}>
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
            <span style={{ marginLeft: '16px', color: mutedColor }}>Loading admins...</span>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="desktop-only table-wrap">
              <table className="admin-table" style={{
                width: '100%',
                minWidth: 700,
                borderCollapse: 'collapse',
                background: 'transparent'
              }}>
                <thead>
                  <tr style={{ background: isDark ? '#111827' : '#f7f7f8' }}>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      fontWeight: '600',
                      color: textColor,
                      borderBottom: `1px solid ${borderColor}`
                    }}>ID</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      fontWeight: '600',
                      color: textColor,
                      borderBottom: `1px solid ${borderColor}`
                    }}>Name</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      fontWeight: '600',
                      color: textColor,
                      borderBottom: `1px solid ${borderColor}`
                    }}>Email</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      fontWeight: '600',
                      color: textColor,
                      borderBottom: `1px solid ${borderColor}`
                    }}>Role</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      fontWeight: '600',
                      color: textColor,
                      borderBottom: `1px solid ${borderColor}`
                    }}>Permissions</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      fontWeight: '600',
                      color: textColor,
                      borderBottom: `1px solid ${borderColor}`
                    }}>Created</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '16px',
                      fontWeight: '600',
                      color: textColor,
                      borderBottom: `1px solid ${borderColor}`
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(admin => (
                    <tr key={admin.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                      <td style={{ padding: '16px', color: textColor, fontWeight: '500' }}>{admin.id}</td>
                      <td style={{ padding: '16px', color: textColor, fontWeight: '500' }}>{admin.name}</td>
                      <td style={{ padding: '16px', color: textColor }}>{admin.email}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ background: isDark ? '#374151' : '#f3f4f6', color: isDark ? '#f9fafb' : '#374151', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {admin.role === 'superadmin' ? '🔑 Superadmin' : '👤 Admin'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {(() => {
                          // Handle permissions display - support object format
                          let perms = admin.permissions;
                          
                          // If permissions is a string, try to parse it
                          if (typeof perms === 'string') {
                            try {
                              perms = JSON.parse(perms);
                            } catch (e) {
                              perms = null;
                            }
                          }
                          
                          // Only display if permissions is an object with truthy values
                          if (perms && typeof perms === 'object' && !Array.isArray(perms) && Object.keys(perms).some(k => perms[k])) {
                            return (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {Object.entries(perms).map(([key, value]) => 
                                  value && (
                                    <span key={key} style={{ 
                                      padding: '2px 8px', 
                                      background: isDark ? '#374151' : '#f5f5f5', 
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      color: textColor
                                    }}>
                                      {key === 'dashboard' ? '📊' : key === 'brands' ? '🏷️' : key === 'stock' ? '📦' : ''} {key}
                                    </span>
                                  )
                                )}
                              </div>
                            );
                          }
                          return <span style={{ color: mutedColor, fontSize: '12px' }}>No permissions</span>;
                        })()}
                      </td>
                      <td style={{ padding: '16px', color: mutedColor, fontSize: '14px' }}>
                        {admin.created_at 
                          ? new Date(admin.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit' 
                            })
                          : 'N/A'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={() => viewCompanyDetails(admin)} className="icon-btn" title="View Details" style={{ background: isDark ? '#374151' : '#111827', border: `1px solid ${borderColor}`, color: isDark ? '#f9fafb' : '#fff', padding:6, borderRadius:4, fontSize: '12px' }}>👁️ View</button>
                          <button type="button" onClick={() => startEdit(admin)} className="icon-btn" title="Edit" style={{ background: 'transparent', border: `1px solid ${borderColor}`, color: textColor, padding:6, borderRadius:4 }}><Icon.Edit /></button>
                          <button type="button" onClick={() => setConfirmId(admin.id)} className="icon-btn" title="Delete" style={{ background: 'transparent', border: `1px solid ${borderColor}`, color: textColor, padding:6, borderRadius:4 }}><Icon.Trash /></button>
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
              {admins.map(admin => (
                <div key={admin.id} className="admin-card" style={{
                  background: cardBg,
                  padding: '12px',
                  borderBottom: `1px solid ${borderColor}`,
                  borderRadius: '4px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{ background: isDark ? '#374151' : '#f3f4f6', color: isDark ? '#f9fafb' : '#374151', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', border: `1px solid ${borderColor}` }}>
                      ID: {admin.id}
                    </div>
                    <span style={{ background: isDark ? '#374151' : '#f3f4f6', color: isDark ? '#f9fafb' : '#374151', padding: '4px 10px', borderRadius: '14px', fontSize: '12px', border: `1px solid ${borderColor}` }}>
                      {admin.role === 'superadmin' ? '🔑 Superadmin' : '👤 Admin'}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: mutedColor }}>Name: </span>
                    <span style={{ fontSize: '16px', fontWeight: '500', color: textColor }}>{admin.name}</span>
                  </div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: mutedColor }}>Email: </span>
                    <span style={{ fontSize: '14px', color: textColor }}>{admin.email}</span>
                  </div>
                  
                  {admin.permissions && Object.keys(admin.permissions).some(k => admin.permissions[k]) && (
                    <div style={{ marginBottom: '12px', paddingTop: '12px', borderTop: `1px solid ${borderColor}` }}>
                      <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '6px', fontWeight: '500' }}>Permissions:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {Object.entries(admin.permissions).map(([key, value]) => 
                          value && (
                            <span key={key} style={{ 
                              padding: '3px 8px', 
                              background: isDark ? '#374151' : '#f5f5f5', 
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: textColor
                            }}>
                              {key === 'dashboard' ? '📊' : key === 'brands' ? '🏷️' : '📦'} {key}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '12px', color: mutedColor }}>Created: </span>
                    <span style={{ fontSize: '14px', color: textColor }}>
                      {admin.created_at 
                        ? new Date(admin.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit' 
                          })
                        : 'N/A'}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      className="btn"
                      onClick={() => startEdit(admin)}
                      style={{
                        background: '#3b82f6',
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
                      onClick={() => setConfirmId(admin.id)}
                      style={{
                        background: '#f44336',
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
        title="Delete Admin"
        message="Are you sure you want to delete this admin?"
        confirmText="Delete"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => { const id = confirmId; setConfirmId(null); removeAdmin(id); }}
      />

      {/* Edit Admin Modal */}
      <Modal open={!!editAdmin} title="Edit Admin" onClose={() => { setEditAdmin(null); setEditName(''); setEditEmail(''); setEditPermissions({ dashboard: false, brands: false, stock: false, reports: false, activity: false, profile: false, staff: false }); }}>
        <form onSubmit={updateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', background: cardBg }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
              Company Name
            </label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Enter admin name"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                background: inputBg,
                color: textColor
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
              placeholder="Enter email address"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                background: inputBg,
                color: textColor
              }}
            />
          </div>

          {/* Menu Permissions Section */}
          <div style={{
            marginTop: '8px',
            padding: '20px',
            background: isDark ? '#111827' : '#f8f9fa',
            borderRadius: '12px',
            border: `1px solid ${borderColor}`
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: textColor,
              margin: '0 0 16px 0'
            }}>
              Menu Permissions
            </h4>
            <p style={{
              fontSize: '13px',
              color: mutedColor,
              margin: '0 0 16px 0'
            }}>
              Select which menus this company can access
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {[
                { key: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'IMEI scanning and records' },
                { key: 'brands', label: 'Brands', icon: '🏷️', desc: 'Manage phone brands' },
                { key: 'stock', label: 'Stock', icon: '📦', desc: 'View stock statistics' },
                { key: 'reports', label: 'Reports', icon: '📈', desc: 'View reports and analytics' },
                { key: 'activity', label: 'Activity Logs', icon: '📋', desc: 'View activity logs' },
                { key: 'profile', label: 'Company Profile', icon: '⚙️', desc: 'Manage company profile' },
                { key: 'staff', label: 'Staff Management', icon: '👥', desc: 'Manage staff members' }
              ].map(menu => (
                <label
                  key={menu.key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    border: editPermissions[menu.key] ? `2px solid ${isDark ? '#f9fafb' : '#000'}` : `2px solid ${borderColor}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: editPermissions[menu.key] ? (isDark ? '#374151' : '#f5f5f5') : cardBg,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editPermissions[menu.key] || false}
                    onChange={e => setEditPermissions({ ...editPermissions, [menu.key]: e.target.checked })}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginTop: '2px',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '4px' }}>
                      {menu.icon} {menu.label}
                    </div>
                    <div style={{ fontSize: '12px', color: mutedColor }}>
                      {menu.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setEditAdmin(null); setEditName(''); setEditEmail(''); setEditPermissions({ dashboard: false, brands: false, stock: false, reports: false, activity: false, profile: false, staff: false }); }}
              style={{
                background: isDark ? '#374151' : '#f3f4f6',
                color: textColor,
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: isDark ? '#f9fafb' : '#000',
                color: isDark ? '#000' : 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Update Admin
            </button>
          </div>
        </form>
      </Modal>

      {/* Company Details Modal */}
      <Modal 
        open={!!viewAdmin} 
        title={`Company Details: ${viewAdmin?.name || ''}`} 
        onClose={() => { 
          setViewAdmin(null); 
          setCompanyDetails(null);
        }}
      >
        {loadingDetails ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: mutedColor }}>Loading company details...</div>
          </div>
        ) : companyDetails ? (
          <div style={{ padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
            {/* Company Info */}
            <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: `1px solid ${borderColor}` }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: textColor, marginBottom: '16px' }}>Company Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '4px' }}>Company Name</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: textColor }}>{companyDetails.admin.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '4px' }}>Email</div>
                  <div style={{ fontSize: '14px', color: textColor }}>{companyDetails.admin.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '4px' }}>Created</div>
                  <div style={{ fontSize: '14px', color: textColor }}>
                    {companyDetails.admin.created_at 
                      ? new Date(companyDetails.admin.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit' 
                        })
                      : 'N/A'}
                  </div>
                </div>
              </div>
              {(() => {
                // Handle permissions display in view popup
                let perms = companyDetails.admin.permissions;
                
                // If permissions is a string, try to parse it
                if (typeof perms === 'string') {
                  try {
                    perms = JSON.parse(perms);
                  } catch (e) {
                    perms = null;
                  }
                }
                
                // Only display if permissions is an object with truthy values
                if (perms && typeof perms === 'object' && !Array.isArray(perms) && Object.keys(perms).some(k => perms[k])) {
                  return (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '8px' }}>Permissions</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {Object.entries(perms).map(([key, value]) => 
                          value && (
                            <span key={key} style={{ 
                              padding: '4px 10px', 
                              background: isDark ? '#374151' : '#f5f5f5', 
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: textColor
                            }}>
                              {key === 'dashboard' ? '📊' : key === 'brands' ? '🏷️' : key === 'stock' ? '📦' : ''} {key}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Statistics */}
            <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: `1px solid ${borderColor}` }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: textColor, marginBottom: '16px' }}>Statistics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ padding: '12px', background: isDark ? '#111827' : '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '4px' }}>Staff Members</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: textColor }}>{companyDetails.stats.staffCount}</div>
                </div>
                <div style={{ padding: '12px', background: isDark ? '#111827' : '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '4px' }}>IMEI Records</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: textColor }}>{companyDetails.stats.imeiCount}</div>
                </div>
                <div style={{ padding: '12px', background: isDark ? '#111827' : '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '4px' }}>Sold Records</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: textColor }}>{companyDetails.stats.soldCount}</div>
                </div>
                <div style={{ padding: '12px', background: isDark ? '#111827' : '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '4px' }}>Total Stock</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: textColor }}>{companyDetails.stats.stockStats.totalCount}</div>
                </div>
                <div style={{ padding: '12px', background: isDark ? '#111827' : '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '4px' }}>Available</div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#22c55e' }}>{companyDetails.stats.stockStats.availableCount}</div>
                </div>
                <div style={{ padding: '12px', background: isDark ? '#111827' : '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '4px' }}>Total Purchase</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: textColor }}>₹{companyDetails.stats.stockStats.totalPurchaseAmount.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ padding: '12px', background: isDark ? '#111827' : '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '4px' }}>Total Sales</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: textColor }}>₹{companyDetails.stats.stockStats.totalSoldAmount.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ padding: '12px', background: isDark ? '#111827' : '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: mutedColor, marginBottom: '4px' }}>Profit</div>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: companyDetails.stats.stockStats.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                    ₹{companyDetails.stats.stockStats.profit.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Staff */}
            {companyDetails.recent.staff.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: textColor, marginBottom: '12px' }}>Recent Staff ({companyDetails.stats.staffCount} total)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {companyDetails.recent.staff.map(staff => (
                    <div key={staff.id} style={{ padding: '12px', background: isDark ? '#111827' : '#f8f9fa', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: textColor }}>{staff.name}</div>
                        <div style={{ fontSize: '12px', color: mutedColor }}>{staff.email}</div>
                      </div>
                      {staff.permissions && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {Object.entries(staff.permissions).map(([key, value]) => 
                            value && (
                              <span key={key} style={{ fontSize: '10px', color: mutedColor }}>
                                {key === 'dashboard' ? '📊' : key === 'brands' ? '🏷️' : '📦'}
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent IMEI Records */}
            {companyDetails.recent.imei.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#000', marginBottom: '12px' }}>Recent IMEI Records ({companyDetails.stats.imeiCount} total)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {companyDetails.recent.imei.map(imei => (
                    <div key={imei.id} style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '4px' }}>{imei.imei}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {imei.brand || '—'} {imei.model || ''} • Purchase: {imei.purchase || '—'} • Amount: {imei.amount ? `₹${imei.amount}` : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Sold Records */}
            {companyDetails.recent.sold.length > 0 && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#000', marginBottom: '12px' }}>Recent Sold Records ({companyDetails.stats.soldCount} total)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {companyDetails.recent.sold.map(sold => (
                    <div key={sold.id} style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '4px' }}>Sold to: {sold.sold_name || '—'}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        IMEI: {sold.imei} • Amount: {sold.sold_amount ? `₹${sold.sold_amount}` : '—'} • Date: {sold.sold_date ? new Date(sold.sold_date).toLocaleDateString() : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#666' }}>No details available</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
