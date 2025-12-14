'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Icon } from '@/app/components/Icons';
import { ConfirmDialog, Modal } from '@/app/components/Modal';
import { ToastContext } from '@/app/components/ToastProvider';
import Pager from '@/app/components/Pager';

export default function StaffPage() {
  const { data: session } = useSession();
  const { notify } = React.useContext(ToastContext);
  const [staff, setStaff] = useState([]);
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
  const [editStaff, setEditStaff] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPermissions, setEditPermissions] = useState({});
  const [formOpen, setFormOpen] = useState(false);

  // Only admin and superadmin can access
  if (session?.user?.role !== 'superadmin' && session?.user?.role !== 'admin') {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Access denied.</div>;
  }

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: page, pageSize: pageSize });
    if (search) params.append('q', search);
    const res = await fetch(`/api/staff?${params}`);
    if (!res.ok) {
      notify('Failed to load staff', 'error');
      setLoading(false);
      return;
    }
    const data = await res.json();
    setStaff(Array.isArray(data.staff) ? data.staff : []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [page, pageSize, search]);

  async function addStaff(e) {
    e.preventDefault();
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, permissions }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      notify(data?.error || 'Failed to add staff', 'error');
      return;
    }
    setName('');
    setEmail('');
    setPassword('');
    setPermissions({ dashboard: false, brands: false, stock: false, reports: false, activity: false, profile: false, staff: false });
    setFormOpen(false);
    load();
    notify('Staff created');
  }

  function startEdit(staffMember) {
    setEditStaff(staffMember);
    setEditName(staffMember.name);
    setEditEmail(staffMember.email);
    
    // Normalize permissions - ensure all keys exist
    const staffPerms = staffMember.permissions || {};
    setEditPermissions({
      dashboard: staffPerms.dashboard === true,
      brands: staffPerms.brands === true,
      stock: staffPerms.stock === true,
      reports: staffPerms.reports === true,
      activity: staffPerms.activity === true,
      profile: staffPerms.profile === true,
      staff: staffPerms.staff === true
    });
    setFormOpen(true);
  }

  async function updateStaff(e) {
    e.preventDefault();
    if (!editStaff) return;
    
    const res = await fetch(`/api/staff/${editStaff.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: editName, 
        email: editEmail, 
        permissions: editPermissions 
      }),
    });
    
    if (res.ok) {
      setEditStaff(null);
      setEditName('');
      setEditEmail('');
      setEditPermissions({ dashboard: false, brands: false, stock: false, reports: false, activity: false, profile: false, staff: false });
      setFormOpen(false);
      load();
      notify('Staff updated successfully');
    } else {
      const data = await res.json().catch(() => ({}));
      notify(data?.error || 'Failed to update staff', 'error');
    }
  }

  async function removeStaff(id) {
    const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
    if (res.ok) { 
      load(); 
      notify('Staff deleted'); 
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', padding: '16px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#000', margin: '0 0 8px 0' }}>
          Staff Management
        </h1>
        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
          Manage staff members and permissions
        </p>
      </div>

      {/* Search and Add */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search staff..."
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px 16px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            background: '#fff'
          }}
        />
        <button
          type="button"
          onClick={() => {
            setEditStaff(null);
            setName('');
            setEmail('');
            setPassword('');
            setPermissions({ dashboard: false, brands: false, stock: false, reports: false, activity: false, profile: false, staff: false });
            setFormOpen(true);
          }}
          style={{
            padding: '10px 20px',
            border: '1px solid #000',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            background: '#000',
            color: '#fff',
            whiteSpace: 'nowrap'
          }}
        >
          + Add Staff
        </button>
      </div>

      {/* Staff List - Mobile Card View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Loading...</div>
        </div>
      ) : staff.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No staff members found
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {staff.map(staffMember => (
            <div
              key={staffMember.id}
              style={{
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>
                    {staffMember.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {staffMember.email}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => startEdit(staffMember)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    <Icon.Edit width={14} height={14} />
                  </button>
                  <button
                    onClick={() => setConfirmId(staffMember.id)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    <Icon.Trash width={14} height={14} />
                  </button>
                </div>
              </div>
              
              {staffMember.permissions && (
                <div style={{ fontSize: '12px', color: '#666', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>Permissions:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {Object.entries(staffMember.permissions).map(([key, value]) => 
                      value && (
                        <span key={key} style={{ 
                          padding: '2px 8px', 
                          background: '#f5f5f5', 
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}>
                          {key}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <Pager page={page} pageSize={pageSize} total={total} onChange={setPage} />
        </div>
      )}

      {/* Add/Edit Form Modal */}
      <Modal open={formOpen} title={editStaff ? 'Edit Staff' : 'Add Staff'} onClose={() => {
        setFormOpen(false);
        setEditStaff(null);
        setName('');
        setEmail('');
        setPassword('');
        setPermissions({ dashboard: false, brands: false, stock: false, reports: false, activity: false, profile: false, staff: false });
      }}>
        <form onSubmit={editStaff ? updateStaff : addStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#000' }}>
              Name
            </label>
            <input
              value={editStaff ? editName : name}
              onChange={e => editStaff ? setEditName(e.target.value) : setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#000' }}>
              Email
            </label>
            <input
              type="email"
              value={editStaff ? editEmail : email}
              onChange={e => editStaff ? setEditEmail(e.target.value) : setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {!editStaff && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#000' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}
          
          {/* Menu Permissions Section */}
          <div style={{
            marginTop: '8px',
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e1e5e9'
          }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#000' }}>
              Menu Permissions
            </label>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 12px 0' }}>
              Select which menus this staff can access
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px'
            }}>
              {[
                { key: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'IMEI scanning' },
                { key: 'brands', label: 'Brands', icon: '🏷️', desc: 'Manage brands' },
                { key: 'stock', label: 'Stock', icon: '📦', desc: 'View stock' },
                { key: 'reports', label: 'Reports', icon: '📈', desc: 'View reports' },
                { key: 'activity', label: 'Activity Logs', icon: '📋', desc: 'View activity logs' },
                { key: 'profile', label: 'Company Profile', icon: '⚙️', desc: 'Manage profile' },
                { key: 'staff', label: 'Staff Management', icon: '👥', desc: 'Manage staff' }
              ].map(menu => (
                <label
                  key={menu.key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px',
                    border: (editStaff ? editPermissions[menu.key] : permissions[menu.key]) ? '2px solid #000' : '2px solid #e1e5e9',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: (editStaff ? editPermissions[menu.key] : permissions[menu.key]) ? '#f5f5f5' : '#fff',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editStaff ? (editPermissions[menu.key] || false) : (permissions[menu.key] || false)}
                    onChange={e => {
                      if (editStaff) {
                        setEditPermissions({ ...editPermissions, [menu.key]: e.target.checked });
                      } else {
                        setPermissions({ ...permissions, [menu.key]: e.target.checked });
                      }
                    }}
                    style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#000', marginBottom: '2px' }}>
                      {menu.icon} {menu.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      {menu.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditStaff(null);
                setName('');
                setEmail('');
                setPassword('');
                setPermissions({ dashboard: false, brands: false, stock: false, reports: false, activity: false, profile: false, staff: false });
              }}
              style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                background: '#fff'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                border: '1px solid #000',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                background: '#000',
                color: '#fff'
              }}
            >
              {editStaff ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete Staff"
        message="Are you sure you want to delete this staff member?"
        confirmText="Delete"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          removeStaff(confirmId);
          setConfirmId(null);
        }}
      />
    </div>
  );
}

