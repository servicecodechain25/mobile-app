'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Icon } from '@/app/components/Icons';
import { useTheme } from '@/app/contexts/ThemeContext';
import { ToastContext } from '@/app/components/ToastProvider';
import { ConfirmDialog } from '@/app/components/Modal';

export default function ImeiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { notify } = React.useContext(ToastContext);
  const { theme } = useTheme();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#000000' : '#f9fafb';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#111827';
  const mutedColor = isDark ? '#9ca3af' : '#6b7280';
  const borderColor = isDark ? '#374151' : '#e5e7eb';

  useEffect(() => {
    const id = params?.id;
    if (id) {
      console.log('Loading record with id:', id);
      loadRecord();
    } else {
      console.log('No id in params:', params);
    }
  }, [params]);

  async function loadRecord() {
    const id = params?.id;
    if (!id) {
      console.error('No id available');
      return;
    }
    try {
      setLoading(true);
      console.log('Fetching record:', `/api/imei/${id}`);
      const res = await fetch(`/api/imei/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          console.error('Record not found - 404');
          notify('Record not found', 'error');
          setLoading(false);
          return;
        }
        throw new Error('Failed to load record');
      }
      const data = await res.json();
      console.log('Record loaded:', data);
      if (data.record) {
        setRecord(data.record);
      } else {
        console.error('No record in response:', data);
        notify('Record not found', 'error');
      }
    } catch (error) {
      console.error('Error loading record:', error);
      notify('Error loading record', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: bgColor, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ color: textColor }}>Loading...</div>
      </div>
    );
  }

  if (!record && !loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: bgColor, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px'
      }}>
        <div style={{ color: textColor, fontSize: '16px', textAlign: 'center' }}>Record not found</div>
        <button
          onClick={() => {
            window.location.href = '/dashboard';
          }}
          style={{
            padding: '12px 24px',
            background: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            color: textColor,
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!record) {
    return null;
  }

  const purchaseAmount = parseFloat(record.amount) || 0;
  const soldAmount = parseFloat(record.sold_amount) || 0;
  const profit = soldAmount > 0 ? soldAmount - purchaseAmount : null;
  const isSold = !!record.sold_name;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: bgColor, 
      paddingBottom: '80px' 
    }}>
      {/* Header */}
      <div style={{
        background: cardBg,
        borderBottom: `1px solid ${borderColor}`,
        padding: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: textColor
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: '700', 
            color: textColor, 
            margin: 0,
            flex: 1
          }}>
            IMEI Details
          </h1>
        </div>

        {/* Total Amount */}
        <div style={{ fontSize: '32px', fontWeight: '700', color: textColor, marginBottom: '8px' }}>
          {soldAmount > 0 ? `₹${soldAmount.toLocaleString('en-IN')}` : `₹${purchaseAmount.toLocaleString('en-IN')}`}
        </div>

        {/* IMEI Number */}
        <div style={{ fontSize: '16px', color: mutedColor, marginBottom: '12px' }}>
          IMEI: {record.imei}
        </div>

        {/* Status Badge */}
        {isSold && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: isDark ? '#374151' : '#111827',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            transform: 'rotate(-5deg)',
            boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            SOLD
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        padding: '16px',
        background: cardBg,
        borderBottom: `1px solid ${borderColor}`
      }}>
                <button
          onClick={() => {
            router.push(`/dashboard/${record.id}/edit`);
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '12px',
            background: 'transparent',
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            cursor: 'pointer',
            color: textColor
          }}
        >
          <Icon.Edit width={20} height={20} />
          <span style={{ fontSize: '11px', fontWeight: '500' }}>Edit</span>
        </button>
        {!isSold && (
          <button
            onClick={() => {
              router.push(`/dashboard?sell=${record.id}`);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '12px',
              background: 'transparent',
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              cursor: 'pointer',
              color: textColor
            }}
          >
            <Icon.DollarSign width={20} height={20} />
            <span style={{ fontSize: '11px', fontWeight: '500' }}>Sell</span>
          </button>
        )}
        <button
          onClick={() => {
            navigator.clipboard.writeText(record.imei);
            notify('IMEI copied to clipboard');
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '12px',
            background: 'transparent',
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            cursor: 'pointer',
            color: textColor
          }}
        >
          <Icon.Copy width={20} height={20} />
          <span style={{ fontSize: '11px', fontWeight: '500' }}>Copy</span>
        </button>
        <button
          onClick={() => setDeleteConfirmOpen(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '12px',
            background: 'transparent',
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#ef4444'
          }}
        >
          <Icon.Trash width={20} height={20} />
          <span style={{ fontSize: '11px', fontWeight: '500' }}>Delete</span>
        </button>
      </div>

      {/* Record Update History */}
      {record.created_at && (
        <div style={{
          padding: '16px',
          background: cardBg,
          borderBottom: `1px solid ${borderColor}`
        }}>
          <div style={{ fontSize: '12px', color: mutedColor }}>
            Record created {new Date(record.created_at).toLocaleDateString('en-IN', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      )}

      {/* Details Section */}
      <div style={{ padding: '16px', background: cardBg, marginTop: '8px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: textColor, marginBottom: '16px' }}>
          Purchase Details
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <DetailRow label="IMEI Number" value={record.imei} textColor={textColor} mutedColor={mutedColor} />
          <DetailRow label="Purchase Name" value={record.purchase || '—'} textColor={textColor} mutedColor={mutedColor} />
          <DetailRow label="Purchase Amount" value={purchaseAmount > 0 ? `₹${purchaseAmount.toLocaleString('en-IN')}` : '—'} textColor={textColor} mutedColor={mutedColor} />
          <DetailRow label="Purchase Date" value={record.date ? new Date(record.date).toLocaleDateString('en-IN') : '—'} textColor={textColor} mutedColor={mutedColor} />
        </div>
      </div>

      {/* Product Details */}
      <div style={{ padding: '16px', background: cardBg, marginTop: '8px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: textColor, marginBottom: '16px' }}>
          Product Details
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <DetailRow label="Brand" value={record.brand || '—'} textColor={textColor} mutedColor={mutedColor} />
          <DetailRow label="Model" value={record.model || '—'} textColor={textColor} mutedColor={mutedColor} />
          <DetailRow label="Color" value={record.color || '—'} textColor={textColor} mutedColor={mutedColor} />
          <DetailRow label="RAM" value={record.ram || '—'} textColor={textColor} mutedColor={mutedColor} />
          <DetailRow label="Storage" value={record.storage || '—'} textColor={textColor} mutedColor={mutedColor} />
        </div>
      </div>

      {/* Sold Details */}
      {isSold && (
        <div style={{ padding: '16px', background: cardBg, marginTop: '8px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: textColor, marginBottom: '16px' }}>
            Sale Details
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <DetailRow label="Sold To" value={record.sold_name || '—'} textColor={textColor} mutedColor={mutedColor} />
            <DetailRow label="Sold Amount" value={soldAmount > 0 ? `₹${soldAmount.toLocaleString('en-IN')}` : '—'} textColor={textColor} mutedColor={mutedColor} />
            <DetailRow label="Sold Date" value={record.sold_date ? new Date(record.sold_date).toLocaleDateString('en-IN') : '—'} textColor={textColor} mutedColor={mutedColor} />
            {record.store && <DetailRow label="Store" value={record.store} textColor={textColor} mutedColor={mutedColor} />}
            {profit !== null && (
              <DetailRow 
                label="Profit" 
                value={`${profit >= 0 ? '+' : '-'}₹${Math.abs(profit).toLocaleString('en-IN')}`}
                textColor={profit >= 0 ? '#22c55e' : '#ef4444'}
                mutedColor={mutedColor}
                valueStyle={{ fontWeight: '600' }}
              />
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Record"
        message={`Are you sure you want to delete IMEI ${record?.imei}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        confirmColor="#ef4444"
      />
    </div>
  );

  async function handleDelete() {
    setDeleteConfirmOpen(false);
    if (!params?.id) return;
    try {
      const res = await fetch(`/api/imei/${params.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error('Failed to delete');
      }
      notify('Record deleted successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting record:', error);
      notify('Error deleting record', 'error');
    }
  }
}

function DetailRow({ label, value, textColor, mutedColor, valueStyle = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '12px', color: mutedColor, fontWeight: '500' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', color: textColor, fontWeight: '400', ...valueStyle }}>
        {value}
      </div>
    </div>
  );
}
