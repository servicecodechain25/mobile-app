"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Icon } from '@/app/components/Icons';
import { Modal } from '@/app/components/Modal';
import { ToastContext } from '@/app/components/ToastProvider';
import Pager from '@/app/components/Pager';
import { useTheme } from '@/app/contexts/ThemeContext';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { notify } = React.useContext(ToastContext);
  const [imeiRecords, setImeiRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [scannedImei, setScannedImei] = useState('');
  
  // Form fields
  const [imei, setImei] = useState('');
  const [purchase, setPurchase] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [ram, setRam] = useState('');
  const [storage, setStorage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Sold form fields
  const [soldFormOpen, setSoldFormOpen] = useState(false);
  const [existingImeiRecord, setExistingImeiRecord] = useState(null);
  const [soldName, setSoldName] = useState('');
  const [soldAmount, setSoldAmount] = useState('');
  const [soldDate, setSoldDate] = useState('');
  const [store, setStore] = useState('');
  const [soldSubmitting, setSoldSubmitting] = useState(false);
  const [manualImeiInput, setManualImeiInput] = useState('');
  const [searchingImei, setSearchingImei] = useState(false);

  // Loaded options
  const [brands, setBrands] = useState([]);
  const [existingImeis, setExistingImeis] = useState([]);
  const [brandInput, setBrandInput] = useState('');
  const [imeiInput, setImeiInput] = useState('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showImeiDropdown, setShowImeiDropdown] = useState(false);
  
  // Duplicate detection
  const [duplicateCheck, setDuplicateCheck] = useState({
    checking: false,
    exists: false,
    record: null,
    accessDenied: false,
    message: ''
  });
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  
  // Quick stats
  const [quickStats, setQuickStats] = useState({
    total: 0,
    available: 0,
    sold: 0,
    totalPurchase: 0,
    totalSales: 0,
    profit: 0
  });

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    brand: '',
    status: '', // 'available', 'sold', 'all'
    purchaseDateFrom: '',
    purchaseDateTo: '',
    soldDateFrom: '',
    soldDateTo: '',
    purchaseAmountMin: '',
    purchaseAmountMax: '',
    soldAmountMin: '',
    soldAmountMax: '',
    color: '',
    ram: '',
    storage: '',
    purchaseName: ''
  });

  // Phone options
  const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Purple', 'Gold', 'Silver', 'Gray', 'Other'];
  const ramOptions = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', 'Other'];
  const storageOptions = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', 'Other'];

  // Load brands and IMEIs
  useEffect(() => {
    async function loadOptions() {
      try {
        const [brandsRes, imeisRes] = await Promise.all([
          fetch('/api/brands?all=true'),
          fetch('/api/imei/list')
        ]);
        
        if (brandsRes.ok) {
          const brandsData = await brandsRes.json();
          setBrands(brandsData.brands || []);
        }
        
        if (imeisRes.ok) {
          const imeisData = await imeisRes.json();
          setExistingImeis(imeisData.imeis || []);
        }
      } catch (error) {
        console.error('Error loading options:', error);
      }
    }
    loadOptions();
  }, []);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: page, pageSize: pageSize });
    if (search) params.append('q', search);
    
    // Add advanced filters
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const res = await fetch(`/api/imei?${params}`);
    if (!res.ok) {
      notify('Failed to load records', 'error');
      setLoading(false);
      return;
    }
    const data = await res.json();
    setImeiRecords(Array.isArray(data.records) ? data.records : []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  function clearFilters() {
    setFilters({
      brand: '',
      status: '',
      purchaseDateFrom: '',
      purchaseDateTo: '',
      soldDateFrom: '',
      soldDateTo: '',
      purchaseAmountMin: '',
      purchaseAmountMax: '',
      soldAmountMin: '',
      soldAmountMax: '',
      color: '',
      ram: '',
      storage: '',
      purchaseName: ''
    });
    setPage(1);
  }

  function getActiveFiltersCount() {
    return Object.values(filters).filter(v => v !== '').length;
  }

  useEffect(() => {
    load();
    loadQuickStats();
  }, [page, pageSize, search, filters]);

  async function loadQuickStats() {
    try {
      const res = await fetch('/api/stock');
      if (res.ok) {
        const data = await res.json();
        setQuickStats({
          total: data.totalCount || 0,
          available: data.availableCount || 0,
          sold: data.soldCount || 0,
          totalPurchase: data.totalPurchaseAmount || 0,
          totalSales: data.totalSoldAmount || 0,
          profit: data.profit || 0
        });
      }
    } catch (error) {
      console.error('Error loading quick stats:', error);
    }
  }

  async function exportToCSV() {
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      const res = await fetch(`/api/imei/export?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `imei-records-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        notify('Export successful');
      } else {
        notify('Export failed', 'error');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      notify('Export failed', 'error');
    }
  }

  // Open scanner from global window object
  function openScanner() {
    if (typeof window !== 'undefined' && window.__imeiScanner?.open) {
      window.__imeiScanner.open();
    }
  }

  // Listen for scanned IMEI and check if exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleImeiScanned = async (scannedImeiValue) => {
        setScannedImei(scannedImeiValue);
        setImei(scannedImeiValue);
        setImeiInput(scannedImeiValue);
        
        // Check if IMEI exists in database
        try {
          const res = await fetch(`/api/imei/check?imei=${encodeURIComponent(scannedImeiValue)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.accessDenied) {
              // IMEI exists but belongs to another user
              notify(data.message || 'This IMEI belongs to another user', 'error');
              return;
            }
            if (data.exists && data.record) {
              // IMEI exists - show sold form
              setExistingImeiRecord(data.record);
              setSoldFormOpen(true);
            } else {
              // IMEI doesn't exist - show regular form
              setFormOpen(true);
            }
          } else {
            // Error checking - show regular form
            setFormOpen(true);
          }
        } catch (error) {
          console.error('Error checking IMEI:', error);
          // On error, show regular form
          setFormOpen(true);
        }
      };
      
      window.addEventListener('imei-scanned', (e) => {
        handleImeiScanned(e.detail.imei);
      });
      
      return () => {
        window.removeEventListener('imei-scanned', handleImeiScanned);
      };
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (!event.target.closest('[data-combobox]')) {
        setShowBrandDropdown(false);
        setShowImeiDropdown(false);
      }
    }
    
    if (formOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [formOpen]);

  function resetForm() {
    setImei('');
    setImeiInput('');
    setPurchase('');
    setAmount('');
    setDate('');
    setBrand('');
    setBrandInput('');
    setModel('');
    setColor('');
    setRam('');
    setStorage('');
    setScannedImei('');
    setShowBrandDropdown(false);
    setShowImeiDropdown(false);
  }
  
  function resetSoldForm() {
    setSoldName('');
    setSoldAmount('');
    setSoldDate('');
    setStore('');
    setExistingImeiRecord(null);
    setManualImeiInput('');
    setSearchingImei(false);
  }

  // Function to open sold form with manual IMEI entry
  function openSoldFormManually() {
    setSoldFormOpen(true);
    setExistingImeiRecord(null);
    setManualImeiInput('');
  }

  // Function to search for IMEI manually
  async function searchImeiForSold() {
    if (!manualImeiInput.trim()) {
      notify('Please enter an IMEI number', 'error');
      return;
    }

    setSearchingImei(true);
    try {
      const res = await fetch(`/api/imei/check?imei=${encodeURIComponent(manualImeiInput.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.accessDenied) {
          notify(data.message || 'This IMEI belongs to another user', 'error');
          setSearchingImei(false);
          return;
        }
        if (data.exists && data.record) {
          // Check if already sold
          if (data.record.sold_name) {
            notify('This IMEI is already marked as sold', 'error');
            setSearchingImei(false);
            return;
          }
          setExistingImeiRecord(data.record);
          notify('IMEI found successfully');
        } else {
          notify('IMEI not found. Please check the IMEI number.', 'error');
        }
      } else {
        notify('Error checking IMEI', 'error');
      }
    } catch (error) {
      console.error('Error searching IMEI:', error);
      notify('Error searching IMEI', 'error');
    } finally {
      setSearchingImei(false);
    }
  }

  // Real-time duplicate checking
  useEffect(() => {
    const checkDuplicate = async () => {
      const imeiValue = imei.trim();
      if (!imeiValue || imeiValue.length < 5) {
        setDuplicateCheck({ checking: false, exists: false, record: null, accessDenied: false, message: '' });
        return;
      }

      setDuplicateCheck(prev => ({ ...prev, checking: true }));
      
      try {
        const res = await fetch(`/api/imei/check?imei=${encodeURIComponent(imeiValue)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists) {
            if (data.accessDenied) {
              setDuplicateCheck({
                checking: false,
                exists: true,
                record: null,
                accessDenied: true,
                message: data.message || 'This IMEI belongs to another user'
              });
            } else if (data.record) {
              setDuplicateCheck({
                checking: false,
                exists: true,
                record: data.record,
                accessDenied: false,
                message: 'This IMEI already exists in the database'
              });
            }
          } else {
            setDuplicateCheck({ checking: false, exists: false, record: null, accessDenied: false, message: '' });
          }
        }
      } catch (error) {
        console.error('Error checking duplicate:', error);
        setDuplicateCheck({ checking: false, exists: false, record: null, accessDenied: false, message: '' });
      }
    };

    // Debounce duplicate check
    const timeoutId = setTimeout(checkDuplicate, 500);
    return () => clearTimeout(timeoutId);
  }, [imei]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!imei.trim()) {
      notify('IMEI number is required', 'error');
      return;
    }

    // Check for duplicate before submitting
    if (duplicateCheck.exists && duplicateCheck.record) {
      setDuplicateWarningOpen(true);
      return;
    }

    if (duplicateCheck.accessDenied) {
      notify(duplicateCheck.message || 'This IMEI belongs to another user', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/imei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: imei.trim(),
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
        if (data.error && data.error.includes('already exists')) {
          // Duplicate detected on server side - show warning
          setDuplicateWarningOpen(true);
          // Try to fetch the existing record
          try {
            const checkRes = await fetch(`/api/imei/check?imei=${encodeURIComponent(imei.trim())}`);
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData.exists && checkData.record) {
                setDuplicateCheck({
                  checking: false,
                  exists: true,
                  record: checkData.record,
                  accessDenied: false,
                  message: 'This IMEI already exists'
                });
              }
            }
          } catch (err) {
            console.error('Error fetching duplicate record:', err);
          }
        } else {
          notify(data?.error || 'Failed to save record', 'error');
        }
        return;
      }

      resetForm();
      setFormOpen(false);
      setDuplicateCheck({ checking: false, exists: false, record: null, accessDenied: false, message: '' });
      load();
      notify('IMEI record saved successfully');
    } catch (error) {
      notify('Error saving record', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function startEditExistingRecord() {
    if (duplicateCheck.record) {
      setEditingRecord(duplicateCheck.record);
      // Pre-fill form with existing data
      setImei(duplicateCheck.record.imei || '');
      setImeiInput(duplicateCheck.record.imei || '');
      setPurchase(duplicateCheck.record.purchase || '');
      setAmount(duplicateCheck.record.amount || '');
      setDate(duplicateCheck.record.date || '');
      setBrand(duplicateCheck.record.brand || '');
      setBrandInput(duplicateCheck.record.brand || '');
      setModel(duplicateCheck.record.model || '');
      setColor(duplicateCheck.record.color || '');
      setRam(duplicateCheck.record.ram || '');
      setStorage(duplicateCheck.record.storage || '');
      setDuplicateWarningOpen(false);
      setFormOpen(true);
    }
  }

  async function handleUpdateExisting() {
    if (!editingRecord || !editingRecord.id) {
      notify('Record not found', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/imei/${editingRecord.id}`, {
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

      resetForm();
      setFormOpen(false);
      setEditingRecord(null);
      setDuplicateWarningOpen(false);
      setDuplicateCheck({ checking: false, exists: false, record: null, accessDenied: false, message: '' });
      load();
      notify('IMEI record updated successfully');
    } catch (error) {
      notify('Error updating record', 'error');
    } finally {
      setSubmitting(false);
    }
  }
  
  async function handleSoldSubmit(e) {
    e.preventDefault();
    if (!existingImeiRecord || !existingImeiRecord.id) {
      notify('IMEI record not found', 'error');
      return;
    }

    setSoldSubmitting(true);
    try {
      const res = await fetch('/api/sold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei_id: existingImeiRecord.id,
          sold_name: soldName.trim() || null,
          sold_amount: soldAmount ? parseFloat(soldAmount) : null,
          sold_date: soldDate || null,
          store: store.trim() || null
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        notify(data?.error || 'Failed to save sold record', 'error');
        return;
      }

      resetSoldForm();
      setSoldFormOpen(false);
      load();
      notify('Sold record saved successfully');
    } catch (error) {
      notify('Error saving sold record', 'error');
    } finally {
      setSoldSubmitting(false);
    }
  }

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#111827' : '#f9fafb';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#f9fafb' : '#111827';
  const mutedColor = isDark ? '#9ca3af' : '#6b7280';
  const borderColor = isDark ? '#374151' : '#e5e7eb';

  return (
    <div className="dashboard-container" style={{ 
      minHeight: '100vh', 
      background: bgColor, 
      padding: '0', 
      width: '100%', 
      maxWidth: '100%', 
      boxSizing: 'border-box' 
    }}>
      {/* Simple Header Section */}
      <div className="dashboard-header" style={{ 
        padding: '20px 0', 
        marginBottom: '20px', 
        borderBottom: `1px solid ${borderColor}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 className="dashboard-title" style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: textColor, 
              margin: '0 0 4px 0'
            }}>
              Dashboard
            </h1>
            <p className="dashboard-subtitle" style={{
              color: mutedColor,
              fontSize: '14px',
              margin: '0'
            }}>
              Manage your IMEI records
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={openScanner}
              style={{
                background: isDark ? '#374151' : '#111827',
                color: '#fff',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Icon.Camera width={16} height={16} />
              <span>Scan</span>
            </button>
            <button
              type="button"
              onClick={openSoldFormManually}
              style={{
                background: isDark ? '#374151' : '#22c55e',
                color: '#fff',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Mark as Sold</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simple Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '24px',
        paddingBottom: '20px',
        borderBottom: `1px solid ${borderColor}`
      }}>
        <div style={{
          padding: '16px 0'
        }}>
          <div style={{ 
            fontSize: '12px', 
            color: mutedColor, 
            marginBottom: '8px',
            fontWeight: '500'
          }}>Total Records</div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: textColor }}>{quickStats.total}</div>
        </div>
        <div style={{ padding: '16px 0' }}>
          <div style={{ 
            fontSize: '12px', 
            color: mutedColor, 
            marginBottom: '8px',
            fontWeight: '500'
          }}>Available</div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: '#22c55e' }}>{quickStats.available}</div>
        </div>
        <div style={{ padding: '16px 0' }}>
          <div style={{ 
            fontSize: '12px', 
            color: mutedColor, 
            marginBottom: '8px',
            fontWeight: '500'
          }}>Sold</div>
          <div style={{ fontSize: '28px', fontWeight: '600', color: textColor }}>{quickStats.sold}</div>
        </div>
        <div style={{ padding: '16px 0' }}>
          <div style={{ 
            fontSize: '12px', 
            color: mutedColor, 
            marginBottom: '8px',
            fontWeight: '500'
          }}>Total Purchase</div>
          <div style={{ fontSize: '22px', fontWeight: '600', color: textColor }}>₹{quickStats.totalPurchase.toLocaleString('en-IN')}</div>
        </div>
        <div style={{ padding: '16px 0' }}>
          <div style={{ 
            fontSize: '12px', 
            color: mutedColor, 
            marginBottom: '8px',
            fontWeight: '500'
          }}>Total Sales</div>
          <div style={{ fontSize: '22px', fontWeight: '600', color: textColor }}>₹{quickStats.totalSales.toLocaleString('en-IN')}</div>
        </div>
        <div style={{ padding: '16px 0' }}>
          <div style={{ 
            fontSize: '12px', 
            color: mutedColor, 
            marginBottom: '8px',
            fontWeight: '500'
          }}>Profit</div>
          <div style={{ fontSize: '22px', fontWeight: '600', color: quickStats.profit >= 0 ? '#22c55e' : '#ef4444' }}>
            ₹{quickStats.profit.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Simple Filters Section */}
      <div className="dashboard-filters" style={{
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
          <div style={{ flex: '1', minWidth: '200px' }}>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search IMEI, purchase, brand..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${borderColor}`,
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                background: isDark ? '#111827' : '#ffffff',
                color: textColor
              }}
            />
          </div>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            style={{
              padding: '10px 12px',
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              fontSize: '14px',
              background: isDark ? '#111827' : '#ffffff',
              color: textColor,
              cursor: 'pointer'
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{
              padding: '10px 16px',
              border: `1px solid ${borderColor}`,
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              background: showAdvancedFilters ? (isDark ? '#374151' : '#111827') : (isDark ? '#374151' : '#f3f4f6'),
              color: showAdvancedFilters ? '#fff' : textColor,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            <Icon.Filter width={16} height={16} />
            Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
          </button>
          <button
            type="button"
            onClick={exportToCSV}
            style={{
              padding: '12px 20px',
              border: `1px solid ${borderColor}`,
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              background: '#fff',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
            title="Export to CSV"
          >
            <Icon.Download width={16} height={16} />
            Export CSV
          </button>
        </div>

        {/* Active Filters Chips */}
        {getActiveFiltersCount() > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>Active filters:</span>
            {filters.brand && (
              <span style={{ padding: '4px 8px', background: '#f3f4f6', borderRadius: '4px', fontSize: '12px' }}>
                Brand: {filters.brand} <button onClick={() => setFilters({...filters, brand: ''})} style={{ marginLeft: '6px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </span>
            )}
            {filters.status && (
              <span style={{ padding: '4px 8px', background: '#f3f4f6', borderRadius: '4px', fontSize: '12px' }}>
                Status: {filters.status} <button onClick={() => setFilters({...filters, status: ''})} style={{ marginLeft: '6px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </span>
            )}
            {filters.color && (
              <span style={{ padding: '4px 8px', background: '#f3f4f6', borderRadius: '4px', fontSize: '12px' }}>
                Color: {filters.color} <button onClick={() => setFilters({...filters, color: ''})} style={{ marginLeft: '6px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </span>
            )}
            {filters.purchaseName && (
              <span style={{ padding: '4px 8px', background: '#f3f4f6', borderRadius: '4px', fontSize: '12px' }}>
                Purchase: {filters.purchaseName} <button onClick={() => setFilters({...filters, purchaseName: ''})} style={{ marginLeft: '6px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </span>
            )}
            {(filters.purchaseAmountMin || filters.purchaseAmountMax) && (
              <span style={{ padding: '4px 8px', background: '#f3f4f6', borderRadius: '4px', fontSize: '12px' }}>
                Purchase Amount: {filters.purchaseAmountMin || '0'} - {filters.purchaseAmountMax || '∞'} <button onClick={() => setFilters({...filters, purchaseAmountMin: '', purchaseAmountMax: ''})} style={{ marginLeft: '6px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </span>
            )}
            <button
              onClick={clearFilters}
              style={{
                padding: '4px 10px',
                background: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div style={{
            marginTop: '16px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {/* Status Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={e => { setFilters({...filters, status: e.target.value}); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All</option>
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                </select>
              </div>

              {/* Brand Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Brand
                </label>
                <select
                  value={filters.brand}
                  onChange={e => { setFilters({...filters, brand: e.target.value}); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Brands</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Color Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Color
                </label>
                <select
                  value={filters.color}
                  onChange={e => { setFilters({...filters, color: e.target.value}); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Colors</option>
                  {colors.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* RAM Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  RAM
                </label>
                <select
                  value={filters.ram}
                  onChange={e => { setFilters({...filters, ram: e.target.value}); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All RAM</option>
                  {ramOptions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Storage Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Storage
                </label>
                <select
                  value={filters.storage}
                  onChange={e => { setFilters({...filters, storage: e.target.value}); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">All Storage</option>
                  {storageOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Purchase Name Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Purchase Name
                </label>
                <input
                  type="text"
                  value={filters.purchaseName}
                  onChange={e => { setFilters({...filters, purchaseName: e.target.value}); setPage(1); }}
                  placeholder="Filter by purchase name"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Purchase Date From */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Purchase Date From
                </label>
                <input
                  type="date"
                  value={filters.purchaseDateFrom}
                  onChange={e => { setFilters({...filters, purchaseDateFrom: e.target.value}); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Purchase Date To */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Purchase Date To
                </label>
                <input
                  type="date"
                  value={filters.purchaseDateTo}
                  onChange={e => { setFilters({...filters, purchaseDateTo: e.target.value}); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Sold Date From */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Sold Date From
                </label>
                <input
                  type="date"
                  value={filters.soldDateFrom}
                  onChange={e => { setFilters({...filters, soldDateFrom: e.target.value}); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Sold Date To */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Sold Date To
                </label>
                <input
                  type="date"
                  value={filters.soldDateTo}
                  onChange={e => { setFilters({...filters, soldDateTo: e.target.value}); setPage(1); }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Purchase Amount Min */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Purchase Amount Min (₹)
                </label>
                <input
                  type="number"
                  value={filters.purchaseAmountMin}
                  onChange={e => { setFilters({...filters, purchaseAmountMin: e.target.value}); setPage(1); }}
                  placeholder="Min amount"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Purchase Amount Max */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Purchase Amount Max (₹)
                </label>
                <input
                  type="number"
                  value={filters.purchaseAmountMax}
                  onChange={e => { setFilters({...filters, purchaseAmountMax: e.target.value}); setPage(1); }}
                  placeholder="Max amount"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Sold Amount Min */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Sold Amount Min (₹)
                </label>
                <input
                  type="number"
                  value={filters.soldAmountMin}
                  onChange={e => { setFilters({...filters, soldAmountMin: e.target.value}); setPage(1); }}
                  placeholder="Min amount"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Sold Amount Max */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                  Sold Amount Max (₹)
                </label>
                <input
                  type="number"
                  value={filters.soldAmountMax}
                  onChange={e => { setFilters({...filters, soldAmountMax: e.target.value}); setPage(1); }}
                  placeholder="Max amount"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="dashboard-content" style={{ padding: '0' }}>
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
            <span style={{ marginLeft: '16px', color: '#666' }}>Loading records...</span>
          </div>
        ) : (
          <>
            {/* Simple Desktop Table */}
            <div className="desktop-only table-wrap" style={{
              overflow: 'auto',
              borderTop: `1px solid ${borderColor}`
            }}>
              <table className="dashboard-table" style={{
                width: '100%',
                minWidth: 700,
                borderCollapse: 'collapse',
                background: 'transparent'
              }}>
                <thead>
                  <tr style={{ 
                    background: isDark ? '#1f2937' : '#f9fafb',
                    borderBottom: `1px solid ${borderColor}`
                  }}>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontWeight: '600', 
                      color: textColor, 
                      fontSize: '13px'
                    }}>IMEI</th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontWeight: '600', 
                      color: textColor, 
                      fontSize: '13px',
                    }}>Purchase Name</th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontWeight: '600', 
                      color: textColor, 
                      fontSize: '13px',
                    }}>Purchase Amount</th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontWeight: '600', 
                      color: textColor, 
                      fontSize: '13px',
                    }}>Purchase Date</th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontWeight: '600', 
                      color: textColor, 
                      fontSize: '13px',
                    }}>Sold Name</th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontWeight: '600', 
                      color: textColor, 
                      fontSize: '13px',
                    }}>Sold Amount</th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontWeight: '600', 
                      color: textColor, 
                      fontSize: '13px',
                    }}>Sold Date</th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontWeight: '600', 
                      color: textColor, 
                      fontSize: '13px',
                    }}>Profit</th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontWeight: '600', 
                      color: textColor, 
                      fontSize: '13px',
                    }}>Brand</th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontWeight: '600', 
                      color: textColor, 
                      fontSize: '13px',
                    }}>Model</th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontWeight: '600', 
                      color: textColor, 
                      fontSize: '13px',
                    }}>Color</th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontWeight: '600', 
                      color: textColor, 
                      fontSize: '13px',
                    }}>RAM</th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontWeight: '600', 
                      color: textColor, 
                      fontSize: '13px',
                    }}>Storage</th>
                  </tr>
                </thead>
                <tbody>
                  {imeiRecords.map((record, index) => {
                    const purchaseAmount = parseFloat(record.amount) || 0;
                    const soldAmount = parseFloat(record.sold_amount) || 0;
                    const profit = soldAmount > 0 ? soldAmount - purchaseAmount : null;
                    return (
                      <tr 
                        key={record.id} 
                        style={{ 
                          borderBottom: index < imeiRecords.length - 1 ? `1px solid ${borderColor}` : 'none',
                          background: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isDark ? '#374151' : '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <td style={{ padding: '12px', color: textColor, fontWeight: '600', fontSize: '14px' }}>{record.imei}</td>
                        <td style={{ padding: '12px', color: textColor, fontSize: '14px' }}>{record.purchase || '—'}</td>
                        <td style={{ padding: '12px', color: textColor, fontSize: '14px', fontWeight: '600' }}>{record.amount ? `₹${record.amount.toLocaleString('en-IN')}` : '—'}</td>
                        <td style={{ padding: '12px', color: mutedColor, fontSize: '14px' }}>{record.date ? new Date(record.date).toLocaleDateString('en-IN') : '—'}</td>
                        <td style={{ padding: '12px', color: textColor, fontSize: '14px' }}>
                          {record.sold_name ? (
                            <span style={{ fontWeight: '600', color: textColor }}>{record.sold_name}</span>
                          ) : (
                            <span style={{ color: mutedColor }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', color: textColor, fontSize: '14px', fontWeight: '600' }}>
                          {record.sold_amount ? `₹${parseFloat(record.sold_amount).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td style={{ padding: '12px', color: mutedColor, fontSize: '14px' }}>
                          {record.sold_date ? new Date(record.sold_date).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600' }}>
                          {profit !== null ? (
                            <span style={{ color: profit >= 0 ? '#22c55e' : '#ef4444' }}>
                              {profit >= 0 ? '+' : ''}₹{profit.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span style={{ color: mutedColor }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', color: textColor, fontSize: '14px' }}>{record.brand || '—'}</td>
                        <td style={{ padding: '12px', color: textColor, fontSize: '14px' }}>{record.model || '—'}</td>
                        <td style={{ padding: '12px', color: textColor, fontSize: '14px' }}>{record.color || '—'}</td>
                        <td style={{ padding: '12px', color: textColor, fontSize: '14px' }}>{record.ram || '—'}</td>
                        <td style={{ padding: '12px', color: textColor, fontSize: '14px' }}>{record.storage || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-only" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {imeiRecords.map(record => {
                const purchaseAmount = parseFloat(record.amount) || 0;
                const soldAmount = parseFloat(record.sold_amount) || 0;
                const profit = soldAmount > 0 ? soldAmount - purchaseAmount : null;
                return (
                  <div key={record.id} className="imei-card" style={{
                    padding: '12px',
                    borderBottom: `1px solid ${borderColor}`,
                    background: cardBg,
                    borderRadius: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: textColor, marginBottom: '4px' }}>
                          {record.imei}
                        </div>
                        <div style={{ fontSize: '13px', color: mutedColor }}>
                          {record.brand || '—'} {record.model ? `• ${record.model}` : ''}
                        </div>
                      </div>
                      {record.sold_name && (
                        <div style={{ 
                          padding: '4px 10px', 
                          background: isDark ? '#374151' : '#111827', 
                          color: '#fff',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          SOLD
                        </div>
                      )}
                    </div>
                    
                    {/* Purchase Section */}
                    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${borderColor}` }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>Purchase Details</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '2px' }}>Purchase Name</div>
                          <div style={{ color: textColor, fontWeight: '500' }}>{record.purchase || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '2px' }}>Purchase Amount</div>
                          <div style={{ color: textColor, fontWeight: '500' }}>{record.amount ? `₹${record.amount.toLocaleString('en-IN')}` : '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '2px' }}>Purchase Date</div>
                          <div style={{ color: textColor }}>{record.date ? new Date(record.date).toLocaleDateString('en-IN') : '—'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Sold Section */}
                    {record.sold_name && (
                      <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${borderColor}` }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>Sold Details</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                          <div>
                            <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '2px' }}>Sold Name</div>
                            <div style={{ color: textColor, fontWeight: '500' }}>{record.sold_name}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '2px' }}>Sold Amount</div>
                            <div style={{ color: textColor, fontWeight: '500' }}>{record.sold_amount ? `₹${parseFloat(record.sold_amount).toLocaleString('en-IN')}` : '—'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: mutedColor, marginBottom: '2px' }}>Sold Date</div>
                            <div style={{ color: textColor }}>{record.sold_date ? new Date(record.sold_date).toLocaleDateString('en-IN') : '—'}</div>
                          </div>
                          {record.store && (
                            <div>
                              <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>Store</div>
                              <div style={{ color: '#000' }}>{record.store}</div>
                            </div>
                          )}
                          {profit !== null && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>Profit</div>
                              <div style={{ color: profit >= 0 ? '#22c55e' : '#ef4444', fontWeight: '600', fontSize: '14px' }}>
                                {profit >= 0 ? '+' : ''}₹{profit.toLocaleString('en-IN')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Specifications */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#000', marginBottom: '8px' }}>Specifications</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>Color</div>
                          <div style={{ color: '#000' }}>{record.color || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>RAM</div>
                          <div style={{ color: '#000' }}>{record.ram || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>Storage</div>
                          <div style={{ color: '#000' }}>{record.storage || '—'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Pagination */}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
              <Pager page={page} pageSize={pageSize} total={total} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* IMEI Form Modal */}
      <Modal open={formOpen} title={editingRecord ? "Edit IMEI Record" : "Add IMEI Record"} onClose={() => { 
        setFormOpen(false); 
        resetForm();
        setEditingRecord(null);
        setDuplicateCheck({ checking: false, exists: false, record: null, accessDenied: false, message: '' });
        setShowBrandDropdown(false);
        setShowImeiDropdown(false);
      }}>
        <form onSubmit={editingRecord ? (e) => { e.preventDefault(); handleUpdateExisting(); } : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', background: 'white' }}>
          <div style={{ position: 'relative' }} data-combobox>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
              IMEI Number * (Select or Enter)
              {duplicateCheck.checking && (
                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>Checking...</span>
              )}
              {duplicateCheck.exists && !duplicateCheck.accessDenied && (
                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#f44336', fontWeight: '600' }}>
                  ⚠️ Duplicate detected
                </span>
              )}
              {duplicateCheck.accessDenied && (
                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#f44336', fontWeight: '600' }}>
                  ⚠️ {duplicateCheck.message}
                </span>
              )}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={imeiInput || imei}
                onChange={e => {
                  const value = e.target.value;
                  setImeiInput(value);
                  setImei(value);
                  setShowImeiDropdown(value.length > 0);
                }}
                onFocus={() => setShowImeiDropdown(true)}
                onBlur={() => setTimeout(() => setShowImeiDropdown(false), 200)}
                placeholder="Select existing IMEI or enter manually"
                required
                list="imei-list"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: '40px',
                  border: duplicateCheck.exists && !duplicateCheck.accessDenied 
                    ? '2px solid #f44336' 
                    : duplicateCheck.accessDenied
                    ? '2px solid #ff9800'
                    : '2px solid #e1e5e9',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  background: duplicateCheck.exists && !duplicateCheck.accessDenied ? '#ffebee' : '#fff'
                }}
              />
              <datalist id="imei-list">
                {existingImeis.map(imeiOption => (
                  <option key={imeiOption} value={imeiOption} />
                ))}
              </datalist>
              {showImeiDropdown && existingImeis.filter(i => i.toLowerCase().includes((imeiInput || imei).toLowerCase())).length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #e1e5e9',
                  borderRadius: '8px',
                  marginTop: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                }}>
                  {existingImeis.filter(i => i.toLowerCase().includes((imeiInput || imei).toLowerCase())).slice(0, 10).map(imeiOption => (
                    <div
                      key={imeiOption}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setImei(imeiOption);
                        setImeiInput(imeiOption);
                        setShowImeiDropdown(false);
                      }}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                      onMouseLeave={(e) => e.target.style.background = 'white'}
                    >
                      {imeiOption}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {scannedImei && (
              <p style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>
                ✓ Scanned: {scannedImei}
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                Purchase
              </label>
              <input
                value={purchase}
                onChange={e => setPurchase(e.target.value)}
                placeholder="Enter purchase/vendor name"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                Amount
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
                  border: '2px solid #e1e5e9',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div style={{ position: 'relative' }} data-combobox>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
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
                    paddingRight: '40px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '4px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
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
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
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
                          borderBottom: '1px solid #f0f0f0',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.background = 'white'}
                      >
                        {brandOption.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                Model
              </label>
              <input
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="Enter model"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                Color
              </label>
              <select
                value={color}
                onChange={e => setColor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '4px',
                  fontSize: '16px',
                  background: 'white',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select Color</option>
                {colors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                RAM
              </label>
              <select
                value={ram}
                onChange={e => setRam(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '4px',
                  fontSize: '16px',
                  background: 'white',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select RAM</option>
                {ramOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                Storage
              </label>
              <select
                value={storage}
                onChange={e => setStorage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '4px',
                  fontSize: '16px',
                  background: 'white',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Select Storage</option>
                {storageOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { 
                setFormOpen(false); 
                resetForm();
                setShowBrandDropdown(false);
                setShowImeiDropdown(false);
              }}
              style={{
                background: '#f3f4f6',
                color: '#374151',
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
              disabled={submitting || (duplicateCheck.exists && !editingRecord)}
              style={{
                background: (duplicateCheck.exists && !editingRecord) ? '#ccc' : submitting ? '#ccc' : '#3b82f6',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (submitting || (duplicateCheck.exists && !editingRecord)) ? 'not-allowed' : 'pointer',
                opacity: (submitting || (duplicateCheck.exists && !editingRecord)) ? 0.6 : 1
              }}
            >
              {submitting ? (editingRecord ? 'Updating...' : 'Saving...') : (editingRecord ? 'Update Record' : 'Save Record')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Duplicate Warning Modal */}
      <Modal 
        open={duplicateWarningOpen} 
        title="⚠️ Duplicate IMEI Detected" 
        onClose={() => { 
          setDuplicateWarningOpen(false);
        }}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ 
            padding: '16px', 
            background: '#fff3cd', 
            border: '1px solid #ffc107', 
            borderRadius: '8px', 
            marginBottom: '20px' 
          }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#856404', marginBottom: '8px' }}>
              This IMEI number already exists in the database!
            </div>
            <div style={{ fontSize: '14px', color: '#856404' }}>
              {duplicateCheck.record ? (
                <>
                  IMEI: <strong>{duplicateCheck.record.imei}</strong> is already registered.
                  {duplicateCheck.record.brand && (
                    <> Brand: <strong>{duplicateCheck.record.brand}</strong></>
                  )}
                  {duplicateCheck.record.purchase && (
                    <> • Purchase: <strong>{duplicateCheck.record.purchase}</strong></>
                  )}
                  {duplicateCheck.record.amount && (
                    <> • Amount: <strong>₹{duplicateCheck.record.amount}</strong></>
                  )}
                </>
              ) : (
                'This IMEI number is already in use.'
              )}
            </div>
          </div>

          {duplicateCheck.record && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>
                Existing Record Details:
              </h3>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '16px', 
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>IMEI</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#000' }}>{duplicateCheck.record.imei || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Brand</div>
                  <div style={{ fontSize: '14px', color: '#000' }}>{duplicateCheck.record.brand || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Model</div>
                  <div style={{ fontSize: '14px', color: '#000' }}>{duplicateCheck.record.model || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Purchase</div>
                  <div style={{ fontSize: '14px', color: '#000' }}>{duplicateCheck.record.purchase || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Amount</div>
                  <div style={{ fontSize: '14px', color: '#000' }}>
                    {duplicateCheck.record.amount ? `₹${duplicateCheck.record.amount}` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Date</div>
                  <div style={{ fontSize: '14px', color: '#000' }}>
                    {duplicateCheck.record.date ? new Date(duplicateCheck.record.date).toLocaleDateString('en-IN') : '—'}
                  </div>
                </div>
                {duplicateCheck.record.sold_name && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Status</div>
                    <div style={{ fontSize: '14px', color: '#22c55e', fontWeight: '600' }}>SOLD</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setDuplicateWarningOpen(false);
                resetForm();
                setFormOpen(false);
              }}
              style={{
                padding: '12px 24px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            {duplicateCheck.record && (
              <button
                type="button"
                onClick={startEditExistingRecord}
                style={{
                  padding: '12px 24px',
                  background: '#667eea',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Edit Existing Record
              </button>
            )}
            {duplicateCheck.record && duplicateCheck.record.sold_name && (
              <button
                type="button"
                onClick={() => {
                  setExistingImeiRecord(duplicateCheck.record);
                  setDuplicateWarningOpen(false);
                  setFormOpen(false);
                  setSoldFormOpen(true);
                }}
                style={{
                  padding: '12px 24px',
                  background: '#22c55e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                View Sold Details
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Sold Form Modal */}
      <Modal open={soldFormOpen} title="Mark as Sold" onClose={() => { 
        setSoldFormOpen(false); 
        resetSoldForm();
      }}>
        {!existingImeiRecord ? (
          // Manual IMEI Entry Section
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
                Enter IMEI Number
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={manualImeiInput}
                  onChange={e => setManualImeiInput(e.target.value)}
                  placeholder="Enter IMEI number"
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      searchImeiForSold();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    background: cardBg,
                    color: textColor
                  }}
                />
                <button
                  type="button"
                  onClick={searchImeiForSold}
                  disabled={searchingImei || !manualImeiInput.trim()}
                  style={{
                    background: searchingImei || !manualImeiInput.trim() ? '#f3f4f6' : '#111827',
                    color: searchingImei || !manualImeiInput.trim() ? '#9ca3af' : '#fff',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: searchingImei || !manualImeiInput.trim() ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {searchingImei ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => { 
                  setSoldFormOpen(false); 
                  resetSoldForm();
                }}
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
            </div>
          </div>
        ) : (
          // Existing IMEI Details and Sold Form
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Display existing IMEI details */}
            <div style={{ 
              background: isDark ? '#1f2937' : '#f0f9ff', 
              border: `1px solid ${isDark ? '#374151' : '#bae6fd'}`, 
              borderRadius: '4px', 
              padding: '16px',
              marginBottom: '8px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: textColor, margin: '0 0 12px 0' }}>
                IMEI Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '14px', color: textColor }}>
                <div><strong>IMEI:</strong> {existingImeiRecord.imei}</div>
                <div><strong>Brand:</strong> {existingImeiRecord.brand || '—'}</div>
                <div><strong>Model:</strong> {existingImeiRecord.model || '—'}</div>
                <div><strong>Color:</strong> {existingImeiRecord.color || '—'}</div>
                <div><strong>RAM:</strong> {existingImeiRecord.ram || '—'}</div>
                <div><strong>Storage:</strong> {existingImeiRecord.storage || '—'}</div>
                <div><strong>Purchase:</strong> {existingImeiRecord.purchase || '—'}</div>
                <div><strong>Purchase Amount:</strong> {existingImeiRecord.amount ? `₹${existingImeiRecord.amount}` : '—'}</div>
                <div><strong>Purchase Date:</strong> {existingImeiRecord.date ? new Date(existingImeiRecord.date).toLocaleDateString() : '—'}</div>
              </div>
            </div>

            <form onSubmit={handleSoldSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
                    Sold Name (Buyer Name)
                  </label>
                  <input
                    value={soldName}
                    onChange={e => setSoldName(e.target.value)}
                    placeholder="Enter buyer name"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      background: cardBg,
                      color: textColor
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
                    Sold Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={soldAmount}
                    onChange={e => setSoldAmount(e.target.value)}
                    placeholder="Enter sale amount"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      background: cardBg,
                      color: textColor
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
                    Sold Date
                  </label>
                  <input
                    type="date"
                    value={soldDate}
                    onChange={e => setSoldDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      background: cardBg,
                      color: textColor
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: textColor, marginBottom: '8px' }}>
                    Store
                  </label>
                  <input
                    value={store}
                    onChange={e => setStore(e.target.value)}
                    placeholder="Enter store name"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      background: cardBg,
                      color: textColor
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { 
                    setExistingImeiRecord(null);
                    setManualImeiInput('');
                  }}
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
                  Change IMEI
                </button>
                <button
                  type="button"
                  onClick={() => { 
                    setSoldFormOpen(false); 
                    resetSoldForm();
                  }}
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
                  disabled={soldSubmitting}
                  style={{
                    background: soldSubmitting ? '#ccc' : '#22c55e',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: soldSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {soldSubmitting ? 'Saving...' : 'Mark as Sold'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}

