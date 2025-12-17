'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Icon } from '@/app/components/Icons';
import { useTheme } from '@/app/contexts/ThemeContext';
import { ToastContext } from '@/app/components/ToastProvider';

export default function EditImeiPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { notify } = React.useContext(ToastContext);
  const { theme } = useTheme();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [purchase, setPurchase] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');

  // Loaded options
  const [brands, setBrands] = useState([]);
  const [brandInput, setBrandInput] = useState('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Purple', 'Gold', 'Silver', 'Gray', 'Other'];
  const ramOptions = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', 'Other'];
  const storageOptions = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', 'Other'];

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#000000' : '#f9fafb';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#111827';
  const mutedColor = isDark ? '#9ca3af' : '#6b7280';
  const borderColor = isDark ? '#374151' : '#e5e7eb';

  useEffect(() => {
    if (params?.id) {
      loadRecord();
      loadBrands();
    }
  }, [params?.id]);

  async function loadRecord() {
    const id = params?.id;
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/imei/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          notify('Record not found', 'error');
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to load record');
      }
      const data = await res.json();
      if (data.record) {
        setRecord(data.record);
        // Pre-fill form with existing data
        setPurchase(data.record.purchase || '');
        setAmount(data.record.amount || '');
        setDate(data.record.date ? new Date(data.record.date).toISOString().split('T')[0] : '');
        setBrand(data.record.brand || '');
        setBrandInput(data.record.brand || '');
        setModel(data.record.model || '');
        setColor(data.record.color || '');
        setRam(data.record.ram || '');
        setStorage(data.record.storage || '');
      }
    } catch (error) {
      console.error('Error loading record:', error);
      notify('Error loading record', 'error');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function loadBrands() {
    try {
      const res = await fetch('/api/brands');
      if (res.ok) {
        const data = await res.json();
        setBrands(data.brands || []);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!record || !record.id) {
      notify('Record not found', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/imei/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchase: purchase.trim() || null,
          amount: amount ? parseFloat(amount) : null,
          date: date || null,
          brand: brand || null,
          model: model.trim() || null,
          color: color || null,
          ram: ram || null,
          storage: storage || null
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        notify(data?.error || 'Failed to update record', 'error');
        return;
      }

      notify('Record updated successfully');
      router.push(`/dashboard/${record.id}`);
    } catch (error) {
      console.error('Error updating record:', error);
      notify('Error updating record', 'error');
    } finally {
      setSubmitting(false);
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

  if (!record) {
    return null;
  }

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
            Edit IMEI Record
          </h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* IMEI Number - Read Only */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
              IMEI Number
            </label>
            <input
              type="text"
              value={record.imei}
              disabled
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                background: isDark ? '#374151' : '#f3f4f6',
                color: mutedColor,
                cursor: 'not-allowed'
              }}
            />
          </div>

          {/* Purchase and Amount */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
                Purchase Name
              </label>
              <input
                type="text"
                value={purchase}
                onChange={e => setPurchase(e.target.value)}
                placeholder="Enter purchase/vendor name"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  background: cardBg,
                  color: textColor
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  background: cardBg,
                  color: textColor
                }}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
              Purchase Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                background: cardBg,
                color: textColor
              }}
            />
          </div>

          {/* Brand */}
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
              Brand (Select or Enter)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={brandInput || brand}
                onChange={e => {
                  const value = e.target.value;
                  setBrandInput(value);
                  setBrand(value);
                  setShowBrandDropdown(value.length > 0);
                }}
                onFocus={() => setShowBrandDropdown(true)}
                onBlur={() => setTimeout(() => setShowBrandDropdown(false), 200)}
                placeholder="Select brand or enter manually"
                list="brand-list"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  background: cardBg,
                  color: textColor
                }}
              />
              <datalist id="brand-list">
                {brands.map(b => (
                  <option key={b.id} value={b.name} />
                ))}
              </datalist>
              {showBrandDropdown && brands.filter(b => b.name.toLowerCase().includes((brandInput || brand).toLowerCase())).length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: cardBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  marginTop: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {brands.filter(b => b.name.toLowerCase().includes((brandInput || brand).toLowerCase())).slice(0, 10).map(brandOption => (
                    <div
                      key={brandOption.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setBrand(brandOption.name);
                        setBrandInput(brandOption.name);
                        setShowBrandDropdown(false);
                      }}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: `1px solid ${borderColor}`,
                        color: textColor
                      }}
                      onMouseEnter={(e) => e.target.style.background = isDark ? '#374151' : '#f3f4f6'}
                      onMouseLeave={(e) => e.target.style.background = cardBg}
                    >
                      {brandOption.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Model */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
              Model
            </label>
            <input
              type="text"
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder="Enter model"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                background: cardBg,
                color: textColor
              }}
            />
          </div>

          {/* Color, RAM, Storage */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
                Color
              </label>
              <select
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  background: cardBg,
                  color: textColor,
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select Color</option>
                {colors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
                RAM
              </label>
              <select
                value={ram}
                onChange={e => setRam(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  background: cardBg,
                  color: textColor,
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select RAM</option>
                {ramOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
                Storage
              </label>
              <select
                value={storage}
                onChange={e => setStorage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  background: cardBg,
                  color: textColor,
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select Storage</option>
                {storageOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                flex: 1,
                padding: '14px',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                background: 'transparent',
                color: textColor
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer',
                background: submitting ? mutedColor : (isDark ? '#374151' : '#111827'),
                color: '#ffffff',
                opacity: submitting ? 0.6 : 1
              }}
            >
              {submitting ? 'Updating...' : 'Update Record'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
