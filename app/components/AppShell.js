"use client";

import { useSession } from 'next-auth/react';
import React from 'react';
import { ConfirmDialog, Modal } from '@/app/components/Modal';
import { Icon } from '@/app/components/Icons';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { ToastContext } from '@/app/components/ToastProvider';
import BottomNav from '@/app/components/BottomNav';
import { useTheme } from '@/app/contexts/ThemeContext';

/**
 * Get first available page based on user permissions
 * @param {Object} session - User session
 * @returns {string} First available page path
 */
function getFirstAvailablePage(session) {
  if (!session?.user) return '/login';
  
  const role = session.user.role;
  
  // Superadmin always goes to Admin Management
  if (role === 'superadmin') {
    return '/admin';
  }
  
  // Admin/Staff redirect based on permissions
  const permissions = session.user.permissions || {};
  const hasPermission = (key) => permissions[key] === true;
  
  // Check permissions in order of priority
  if (hasPermission('dashboard')) return '/dashboard';
  if (hasPermission('brands')) return '/brands';
  if (hasPermission('stock')) return '/stock';
  if (hasPermission('reports')) return '/reports';
  if (hasPermission('activity')) return '/activity';
  if (hasPermission('profile')) return '/profile';
  if (hasPermission('staff')) return '/staff';
  
  // Default fallback
  return '/dashboard';
}

export default function AppShell({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { notify } = React.useContext(ToastContext);
  const { theme } = useTheme();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);
  const [scanError, setScanError] = React.useState('');
  
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#111827' : '#f5f6f8';
  const cardBg = isDark ? '#1f2937' : '#fff';
  const textColor = isDark ? '#f9fafb' : '#000';
  const mutedColor = isDark ? '#9ca3af' : '#666';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const videoRef = React.useRef(null);
  const codeReaderRef = React.useRef(null);
  const lastScannedRef = React.useRef('');

  // Permission-based redirection
  React.useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const currentPath = pathname;
      const userRole = session.user.role;
      
      // Skip redirection for login/register pages
      if (currentPath === '/login' || currentPath === '/register') {
        return;
      }
      
      // Superadmin can only access admin page
      if (userRole === 'superadmin') {
        if (currentPath === '/admin') {
          return;
        } else {
          router.push('/admin');
          return;
        }
      }
      
      // Admin/Staff can access pages based on permissions
      const permissions = session.user.permissions || {};
      const hasPermission = (key) => permissions[key] === true;
      
      // Check each route with its specific permission
      // Allow dashboard detail pages and edit pages
      if ((currentPath.startsWith('/dashboard/') && hasPermission('dashboard'))) {
        return;
      }
      if (currentPath === '/dashboard' && hasPermission('dashboard')) {
        return;
      }
      if (currentPath === '/brands' && hasPermission('brands')) {
        return;
      }
      if (currentPath === '/stock' && hasPermission('stock')) {
        return;
      }
      if (currentPath === '/reports' && hasPermission('reports')) {
        return;
      }
      if (currentPath === '/activity' && hasPermission('activity')) {
        return;
      }
      if (currentPath === '/profile' && hasPermission('profile')) {
        return;
      }
      if (currentPath === '/staff' && hasPermission('staff')) {
        return;
      }
      
      // Redirect to first available page based on permissions
      const firstPage = getFirstAvailablePage(session);
      if (currentPath !== firstPage && !currentPath.startsWith('/dashboard/')) {
        router.push(firstPage);
      }
    }
  }, [status, session, pathname, router]);

  // Global scanner API
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__imeiScanner = window.__imeiScanner || {};
      window.__imeiScanner.open = () => {
        setScannerOpen(true);
        setTimeout(() => startScanner(), 50);
      };
      window.__imeiScanner.close = () => {
        setScannerOpen(false);
        stopScanner();
      };
    }
  }, []);

  /**
   * Start IMEI scanner
   */
  async function startScanner() {
    try {
      setScanning(true);
      setScanError('');
      
      // Clean up any existing scanner instance
      if (codeReaderRef.current) {
        try {
          // Stop any existing video tracks first
          if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject;
            const tracks = stream.getTracks?.() || [];
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        codeReaderRef.current = null;
      }
      
      // Create new scanner instance
      codeReaderRef.current = new BrowserMultiFormatReader();
      const codeReader = codeReaderRef.current;
      
      const constraints = { 
        video: { 
          facingMode: 'environment', 
          width: { ideal: 480 }, 
          height: { ideal: 360 } 
        } 
      };
      
      await codeReader.decodeFromConstraints(
        constraints, 
        videoRef.current, 
        async (result) => {
          if (result) {
            const text = (result.getText?.() || result.text || '').trim().replace(/\D/g, '');
            // Validate IMEI: 15-16 digits
            if (!text || text.length < 15 || text.length > 16 || lastScannedRef.current === text) {
              if (text && text.length < 15) {
                setScanError(`Invalid IMEI: Must be 15-16 digits (got ${text.length})`);
              }
              return;
            }
            
            lastScannedRef.current = text;
            // Dispatch custom event for dashboard to listen
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('imei-scanned', { detail: { imei: text } }));
            }
            stopScanner();
            setScannerOpen(false);
            notify('IMEI scanned successfully');
          }
        }
      );
    } catch (error) {
      setScanning(false);
      setScanError('Camera access denied or not available');
      notify('Camera error', 'error');
      // Clean up on error
      if (codeReaderRef.current) {
        codeReaderRef.current = null;
      }
    }
  }

  /**
   * Stop scanner and cleanup resources
   */
  function stopScanner() {
    setScanning(false);
    setScanError('');
    try {
      // Stop all video tracks
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks?.() || [];
        tracks.forEach(track => {
          track.stop();
          track.enabled = false;
        });
        videoRef.current.srcObject = null;
      }
      // Clear the code reader reference
      if (codeReaderRef.current) {
        codeReaderRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  }

  if (status !== 'authenticated') {
    return <>{children}</>;
  }

  return (
    <div className="layout" style={{
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      minHeight: '100vh',
      background: bgColor,
      transition: 'background-color 0.3s ease'
    }}>
      {/* Modern Header */}
      <header className="app-header" style={{
        background: isDark ? '#1f2937' : '#ffffff',
        borderBottom: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
        padding: isDark ? '16px 24px' : '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: isDark ? '0 1px 0 rgba(255,255,255,0.05)' : '0 1px 2px rgba(0,0,0,0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
        background: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Logo/App Name */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isDark ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}>
              📱
            </div>
            <div>
              <h1 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: textColor, 
                margin: '0', 
                lineHeight: '1.2',
                letterSpacing: '-0.02em'
              }}>
                IMEI Manager
              </h1>
              {session?.user && (
                <div style={{ 
                  fontSize: '12px', 
                  color: mutedColor, 
                  marginTop: '2px',
                  fontWeight: '500'
                }}>
                  {session.user.name}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* User Info */}
          {session?.user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: isDark ? '#374151' : '#f3f4f6',
              fontSize: '13px',
              fontWeight: '500',
              color: textColor
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isDark ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="desktop-only" style={{ fontSize: '13px' }}>
                {session.user.name}
              </span>
            </div>
          )}
          
          {/* Sign Out Button */}
          <button
            className="icon-btn"
            title="Sign out"
            onClick={() => setConfirmOpen(true)}
            style={{ 
              background: isDark ? '#374151' : '#f3f4f6', 
              border: 'none', 
              color: textColor, 
              padding: '10px 14px', 
              borderRadius: '10px', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = isDark ? '#4b5563' : '#e5e7eb';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = isDark ? '#374151' : '#f3f4f6';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <Icon.Logout />
            <span className="desktop-only">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="main-layout" style={{ 
        display: 'flex', 
        flex: 1,
        minHeight: 0
      }}>
        {/* Modern Sidebar - Desktop Only */}
        <aside className="app-sidebar desktop-only" style={{
          width: sidebarCollapsed ? '72px' : '240px',
          minWidth: sidebarCollapsed ? '72px' : '240px',
          background: isDark ? '#1f2937' : '#ffffff',
          borderRight: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
          padding: sidebarCollapsed ? '16px 8px' : '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          // gap: '8px',
          boxShadow: isDark ? '2px 0 8px rgba(0,0,0,0.1)' : '2px 0 8px rgba(0,0,0,0.04)',
          overflowY: 'auto',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative'
        }}>
          {/* Sidebar Header */}
          <div style={{
            marginBottom: '16px',
            paddingBottom: '16px',
            borderBottom: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            {!sidebarCollapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: mutedColor,
                  margin: '0 0 4px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Menu
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: textColor,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {session?.user?.name || 'Company'}
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: isDark ? '#374151' : '#f3f4f6',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: textColor,
                minWidth: '32px',
                minHeight: '32px',
                transition: 'all 0.2s ease'
              }}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onMouseEnter={(e) => {
                e.target.style.background = isDark ? '#4b5563' : '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = isDark ? '#374151' : '#f3f4f6';
              }}
            >
              {sidebarCollapsed ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              )}
            </button>
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {/* Helper function to check permissions */}
            {(() => {
              // Ensure permissions is always an object
              let permissions = session?.user?.permissions;
              if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) {
                permissions = {};
              }
              const role = session?.user?.role;
              const hasPermission = (key) => {
                if (role === 'superadmin') return true;
                return permissions && typeof permissions === 'object' && permissions[key] === true;
              };
              
              // Modern Menu item component with tooltip
              const MenuItem = ({ href, label, icon, permission }) => {
                if (permission && !hasPermission(permission)) return null;
                const isActive = pathname === href;
                const [showTooltip, setShowTooltip] = React.useState(false);
                
                return (
                  <div 
                    style={{ position: 'relative' }}
                    onMouseEnter={() => sidebarCollapsed && setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
                    <Link 
                      href={href} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: sidebarCollapsed ? '0' : '12px',
                        padding: sidebarCollapsed ? '12px' : '12px 14px',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        color: isActive 
                          ? (isDark ? '#ffffff' : '#111827') 
                          : (isDark ? '#9ca3af' : '#6b7280'),
                        background: isActive 
                          ? (isDark ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)')
                          : 'transparent',
                        fontWeight: isActive ? '600' : '500',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                        fontSize: '14px',
                        whiteSpace: 'nowrap',
                        border: 'none',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = isDark ? '#374151' : '#f3f4f6';
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }
                      }}
                    >
                      {!sidebarCollapsed && (
                        <span style={{ 
                          fontSize: '20px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px'
                        }}>
                          {icon}
                        </span>
                      )}
                      {sidebarCollapsed ? (
                        <span style={{ fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
                      ) : (
                        <span>{label}</span>
                      )}
                      {isActive && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '3px',
                          background: isDark ? '#ffffff' : '#667eea',
                          borderRadius: '0 3px 3px 0'
                        }} />
                      )}
                    </Link>
                    {sidebarCollapsed && showTooltip && (
                      <div style={{
                        position: 'absolute',
                        left: '100%',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        marginLeft: '12px',
                        background: isDark ? '#374151' : '#1f2937',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                        pointerEvents: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}>
                        {label}
                        <div style={{
                          position: 'absolute',
                          right: '100%',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: '6px solid transparent',
                          borderRightColor: isDark ? '#374151' : '#1f2937'
                        }} />
                      </div>
                    )}
                  </div>
                );
              };
              
              return (
                <>
                  {/* Superadmin only sees Admin Management */}
                  {role === 'superadmin' ? (
                    <MenuItem href="/admin" label="Admin Management" icon="👤" />
                  ) : (
                    <>
                      {/* Admin/Staff see menus based on permissions */}
                      <MenuItem href="/dashboard" label="Dashboard" icon="📊" permission="dashboard" />
                      <MenuItem href="/brands" label="Brands" icon="🏷️" permission="brands" />
                      <MenuItem href="/stock" label="Stock" icon="📦" permission="stock" />
                      <MenuItem href="/reports" label="Reports" icon="📈" permission="reports" />
                      <MenuItem href="/activity" label="Activity Logs" icon="📋" permission="activity" />
                      <MenuItem href="/profile" label="Company Profile" icon="⚙️" permission="profile" />
                      <MenuItem href="/staff" label="Staff Management" icon="👥" permission="staff" />
                    </>
                  )}
                </>
              );
            })()}
          </nav>
        </aside>
        
        {/* Main Content Area */}
        <main className="main-content" style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          background: isDark ? '#111827' : '#f9fafb',
          // padding: '24px',
          overflowY: 'auto',
          transition: 'background-color 0.3s ease'
        }}>
          <div style={{
            maxWidth: '1400px',
            width: '100%',
            margin: '0 auto'
          }}>
            {children}
          </div>
        </main>
      </div>
      
      {/* Modern Footer */}
      <footer className="app-footer" style={{ 
        background: isDark ? '#1f2937' : '#ffffff', 
        borderTop: isDark ? '1px solid #374151' : '1px solid #e5e7eb', 
        padding: '20px 24px', 
        textAlign: 'center', 
        boxShadow: isDark ? '0 -1px 0 rgba(255,255,255,0.05)' : '0 -1px 2px rgba(0,0,0,0.04)', 
        marginTop: 'auto', 
        transition: 'all 0.3s ease' 
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: mutedColor,
            fontSize: '13px',
            fontWeight: '500'
          }}>
            <span>© {new Date().getFullYear()} IMEI Manager. All rights reserved.</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '12px',
            color: mutedColor,
            fontWeight: '400'
          }}>
            <span>Built with Next.js & MySQL</span>
          </div>
        </div>
      </footer>

      <ConfirmDialog
        open={confirmOpen}
        title="Sign out"
        message="Are you sure you want to sign out?"
        confirmText="Sign out"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { window.location.href = '/api/auth/signout'; }}
      />

      {/* IMEI Scanner Modal - Machine Style */}
      <Modal open={scannerOpen} title="" fullscreen={true} onClose={() => { setScannerOpen(false); stopScanner(); }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
          padding: '0'
        }}>
          {/* Scanner Area - Full Screen Machine Style */}
          <div style={{
            position: 'relative',
            width: '100%',
            minHeight: '400px',
            background: '#000',
            borderRadius: '0',
            overflow: 'hidden'
          }}>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '400px',
                objectFit: 'cover'
              }}
              muted
              playsInline
              autoPlay
            />
            
            {/* Overlay with scanning area */}
            <div style={{ 
              position: 'absolute', 
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 20%, transparent 60%, rgba(0,0,0,0.4) 100%)'
            }}>
              {/* Scanning frame - centered */}
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                width: '80%',
                maxWidth: '300px',
                aspectRatio: '3 / 1',
                pointerEvents: 'none'
              }}>
                {/* Corner brackets - larger for machine style */}
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: 50, 
                  height: 50, 
                  borderTop: '4px solid #00ff00', 
                  borderLeft: '4px solid #00ff00',
                  boxShadow: '0 0 10px #00ff00'
                }} />
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  width: 50, 
                  height: 50, 
                  borderTop: '4px solid #00ff00', 
                  borderRight: '4px solid #00ff00',
                  boxShadow: '0 0 10px #00ff00'
                }} />
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  width: 50, 
                  height: 50, 
                  borderBottom: '4px solid #00ff00', 
                  borderLeft: '4px solid #00ff00',
                  boxShadow: '0 0 10px #00ff00'
                }} />
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  right: 0, 
                  width: 50, 
                  height: 50, 
                  borderBottom: '4px solid #00ff00', 
                  borderRight: '4px solid #00ff00',
                  boxShadow: '0 0 10px #00ff00'
                }} />
                
                {/* Scanning line animation */}
                {scanning && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: '#00ff00',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    boxShadow: '0 0 20px #00ff00',
                    animation: 'scanLineMove 2s linear infinite'
                  }} />
                )}
              </div>

              {/* Status indicator */}
              {scanning && (
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#00ff00',
                  color: '#000',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  fontFamily: 'monospace',
                  boxShadow: '0 0 20px #00ff00'
                }}>
                  SCANNING...
                </div>
              )}

              {/* Instructions */}
              <div style={{
                position: 'absolute',
                bottom: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)'
              }}>
                Position barcode within frame
              </div>
            </div>
          </div>

          {/* Error Message */}
          {scanError && (
            <div style={{
              background: '#dc2626',
              color: '#fff',
              padding: '12px',
              fontSize: '13px',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              {scanError}
            </div>
          )}

          {/* Control Buttons - Machine Style */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0',
            borderTop: '2px solid #000'
          }}>
            <button 
              type="button" 
              onClick={startScanner} 
              disabled={scanning}
              style={{ 
                background: scanning ? '#374151' : '#111827',
                color: '#fff',
                padding: '16px',
                border: 'none',
                borderRadius: '0',
                fontSize: '16px',
                fontWeight: '600',
                cursor: scanning ? 'not-allowed' : 'pointer',
                borderRight: '1px solid #000'
              }}
            >
              {scanning ? 'SCANNING...' : 'START SCAN'}
            </button>
            <button 
              type="button" 
              onClick={stopScanner} 
              disabled={!scanning}
              style={{ 
                background: !scanning ? '#374151' : '#dc2626',
                color: '#fff',
                padding: '16px',
                border: 'none',
                borderRadius: '0',
                fontSize: '16px',
                fontWeight: '600',
                cursor: !scanning ? 'not-allowed' : 'pointer'
              }}
            >
              STOP
            </button>
          </div>
        </div>
      </Modal>

      {/* Bottom Navigation for Mobile */}
      <div className="mobile-only" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100 }}>
        <BottomNav />
      </div>
    </div>
  );
}
