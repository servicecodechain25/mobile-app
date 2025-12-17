'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/app/contexts/ThemeContext';

/**
 * Bottom Drawer Component for Mobile
 */
function BottomDrawer({ open, title, children, onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#f9fafb' : '#111827';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const handleColor = isDark ? '#6b7280' : '#d1d5db';

  useEffect(() => {
    if (open) {
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  if (!open && !isClosing) return null;

  return (
    <>
      <div 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.5)', 
          zIndex: 3000,
          animation: open ? 'fadeIn 0.3s ease' : 'fadeOut 0.3s ease',
          opacity: open ? 1 : 0
        }}
        onClick={handleClose}
      />
      <div 
        style={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: bgColor,
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 3001,
          boxShadow: isDark ? '0 -4px 20px rgba(0,0,0,0.5)' : '0 -4px 20px rgba(0,0,0,0.15)',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Handle Bar */}
        <div style={{
          width: '40px',
          height: '4px',
          background: handleColor,
          borderRadius: '2px',
          margin: '12px auto 8px',
          cursor: 'pointer'
        }} onClick={handleClose} />
        
        {/* Header */}
        {title && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '0 20px 16px',
            borderBottom: `1px solid ${borderColor}`
          }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: textColor,
              margin: 0
            }}>
              {title}
            </h2>
            <button 
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '24px',
                color: isDark ? '#9ca3af' : '#6b7280',
                padding: 0
              }}
            >
              ×
            </button>
          </div>
        )}
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          WebkitOverflowScrolling: 'touch'
        }}>
          {children}
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </>
  );
}

/**
 * Reusable modal component - Desktop: Centered Modal, Mobile: Bottom Drawer
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether modal is open
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {Function} props.onClose - Close handler
 * @param {boolean} props.fullscreen - Whether modal is fullscreen
 */
export function Modal({ open, title, children, onClose, fullscreen = false }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use bottom drawer on mobile, centered modal on desktop
  if (isMobile && !fullscreen) {
    return <BottomDrawer open={open} title={title} onClose={onClose}>{children}</BottomDrawer>;
  }

  if (!open) return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0,0,0,0.6)', 
      display: 'grid', 
      placeItems: 'center', 
      zIndex: 3000,
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div 
        className="card" 
        style={{ 
          background: fullscreen ? '#000' : '#ffffff', 
          width: fullscreen ? '100%' : '90%', 
          maxWidth: fullscreen ? '100%' : 500, 
          borderRadius: fullscreen ? 0 : 12, 
          padding: fullscreen ? '0' : '20px', 
          boxShadow: fullscreen ? 'none' : '0 10px 40px rgba(0,0,0,0.2)',
          border: 'none',
          animation: 'slideUp 0.3s ease',
          maxHeight: fullscreen ? '100vh' : '90vh',
          overflow: fullscreen ? 'hidden' : 'auto'
        }}
      >
        {title && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#111827',
              margin: 0
            }}>
              {title}
            </h2>
            <button 
              onClick={onClose}
              style={{
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#6b7280'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f3f4f6';
              }}
            >
              ×
            </button>
          </div>
        )}
        {!title && (
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '24px',
              color: '#fff',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
            }}
          >
            ×
          </button>
        )}
        <div>
          {children}
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/**
 * Confirmation dialog component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether dialog is open
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Confirmation message
 * @param {string} props.confirmText - Confirm button text
 * @param {string} props.cancelText - Cancel button text
 * @param {Function} props.onConfirm - Confirm handler
 * @param {Function} props.onCancel - Cancel handler
 */
export function ConfirmDialog({ 
  open, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel,
  confirmColor = '#667eea'
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#f9fafb' : '#111827';
  const mutedColor = isDark ? '#9ca3af' : '#6b7280';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const cancelBg = isDark ? '#374151' : '#f3f4f6';
  
  if (!open) return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0,0,0,0.6)', 
      display: 'grid', 
      placeItems: 'center', 
      zIndex: 3000,
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease',
      padding: '16px'
    }}
    onClick={onCancel}
    >
      <div 
        className="card" 
        style={{ 
          background: bgColor, 
          width: '100%', 
          maxWidth: 420, 
          borderRadius: '16px', 
          padding: '24px',
          boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease',
          border: `1px solid ${borderColor}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '700', 
            color: textColor,
            margin: '0 0 8px 0'
          }}>
            {title}
          </h2>
        </div>
        <div style={{ 
          marginBottom: '24px',
          fontSize: '15px',
          color: mutedColor,
          lineHeight: '1.5'
        }}>
          {message}
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end' 
        }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              border: `1px solid ${borderColor}`,
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              background: cancelBg,
              color: textColor,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = isDark ? '#4b5563' : '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = cancelBg;
            }}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              background: confirmColor,
              color: '#ffffff',
              transition: 'all 0.2s ease',
              boxShadow: `0 4px 12px ${confirmColor}40`
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = `0 6px 16px ${confirmColor}60`;
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 4px 12px ${confirmColor}40`;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}


